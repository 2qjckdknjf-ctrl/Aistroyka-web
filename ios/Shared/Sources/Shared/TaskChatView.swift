//
//  TaskChatView.swift
//  Shared
//
//  Task-scoped Worker ↔ Manager chat (text / voice / photo / video).
//

import SwiftUI
import AVFoundation
import AVKit
import PhotosUI
import UniformTypeIdentifiers
import CoreTransferable

/// Reliable PhotosPicker import (raw `Data.self` often returns nil for library items).
struct PickedChatMedia: Transferable {
    let data: Data

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(importedContentType: .image) { data in
            PickedChatMedia(data: data)
        }
        DataRepresentation(importedContentType: .jpeg) { data in
            PickedChatMedia(data: data)
        }
        DataRepresentation(importedContentType: .png) { data in
            PickedChatMedia(data: data)
        }
        DataRepresentation(importedContentType: .heic) { data in
            PickedChatMedia(data: data)
        }
        DataRepresentation(importedContentType: .mpeg4Movie) { data in
            PickedChatMedia(data: data)
        }
        DataRepresentation(importedContentType: .quickTimeMovie) { data in
            PickedChatMedia(data: data)
        }
        FileRepresentation(importedContentType: .image) { received in
            let data = try Data(contentsOf: received.file)
            return PickedChatMedia(data: data)
        }
        FileRepresentation(importedContentType: .movie) { received in
            let data = try Data(contentsOf: received.file)
            return PickedChatMedia(data: data)
        }
    }
}

@MainActor
public final class TaskChatViewModel: ObservableObject {
    @Published public var messages: [TaskMessageDTO] = []
    @Published public var draftText: String = ""
    @Published public var isLoading = false
    @Published public var isSending = false
    @Published public var errorMessage: String?
    @Published public var isRecording = false

    public let taskId: String
    /// May be nil at first paint (host resolves session async); refreshed in `start()`.
    @Published public private(set) var currentUserId: String?
    private var pollTask: Task<Void, Never>?
    private var audioRecorder: AVAudioRecorder?
    private var recordURL: URL?

    public init(
        taskId: String,
        currentUserId: String?,
        enqueueOfflineText: ((String, String, String) -> Bool)? = nil
    ) {
        self.taskId = taskId
        self.currentUserId = currentUserId
        self.enqueueOfflineText = enqueueOfflineText
    }

    public func start() {
        Task {
            if currentUserId == nil, let session = await AuthService.shared.currentSession() {
                currentUserId = session.user.id
            }
            await reload()
        }
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                await reload(silent: true)
            }
        }
    }

    public func stop() {
        pollTask?.cancel()
        pollTask = nil
        stopRecording(send: false)
    }

    public func reload(silent: Bool = false) async {
        if !silent { isLoading = true }
        do {
            messages = try await TaskMessagesAPI.listAll(taskId: taskId)
            errorMessage = nil
            if let last = messages.last {
                TaskChatReadStore.markRead(taskId: taskId, createdAt: last.createdAt)
            }
        } catch {
            if !silent {
                errorMessage = error.localizedDescription
            }
        }
        if !silent { isLoading = false }
    }

    public func deleteMessage(_ id: String) async {
        do {
            try await TaskMessagesAPI.delete(taskId: taskId, messageId: id)
            messages.removeAll { $0.id == id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Optional hook for host apps (e.g. Worker offline queue). Return true if handled offline.
    public var enqueueOfflineText: ((String, String, String) -> Bool)?

    public func sendText() async {
        let body = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty, !isSending else { return }
        isSending = true
        let clientId = UUID().uuidString
        if !NetworkMonitor.shared.isConnected {
            if let enqueueOfflineText, enqueueOfflineText(taskId, body, clientId) {
                let optimistic = TaskMessageDTO(
                    id: "local-\(clientId)",
                    senderUserId: currentUserId ?? "me",
                    kind: "text",
                    body: body,
                    clientId: clientId,
                    createdAt: ISO8601DateFormatter().string(from: Date())
                )
                messages.append(optimistic)
                draftText = ""
                errorMessage = nil
                isSending = false
                return
            }
        }
        do {
            let msg = try await TaskMessagesAPI.sendText(
                taskId: taskId,
                body: body,
                clientId: clientId,
                idempotencyKey: clientId
            )
            if !messages.contains(where: { $0.id == msg.id }) {
                messages.append(msg)
            }
            draftText = ""
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
        isSending = false
    }

    public func sendMedia(data: Data, kind: String, mimeType: String, fileExtension: String, durationMs: Int? = nil) async {
        guard !isSending else { return }
        if !NetworkMonitor.shared.isConnected {
            errorMessage = NSLocalizedString("task_chat_media_offline", comment: "")
            return
        }
        isSending = true
        let clientId = UUID().uuidString
        do {
            let mediaId = try await MediaUploadHelper.uploadChatMedia(
                data: data,
                mimeType: mimeType,
                fileExtension: fileExtension
            )
            let msg = try await TaskMessagesAPI.sendMedia(
                taskId: taskId,
                kind: kind,
                mediaId: mediaId,
                durationMs: durationMs,
                clientId: clientId,
                idempotencyKey: clientId
            )
            if !messages.contains(where: { $0.id == msg.id }) {
                messages.append(msg)
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
        isSending = false
    }

    public func startRecording() {
        guard !isRecording else { return }
        let session = AVAudioSession.sharedInstance()
        session.requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                guard let self else { return }
                guard granted else {
                    self.errorMessage = NSLocalizedString("task_chat_mic_denied", comment: "")
                    return
                }
                do {
                    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                    try session.setActive(true)
                    let url = FileManager.default.temporaryDirectory.appendingPathComponent("chat-voice-\(UUID().uuidString).m4a")
                    let settings: [String: Any] = [
                        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                        AVSampleRateKey: 44100,
                        AVNumberOfChannelsKey: 1,
                        AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
                    ]
                    let recorder = try AVAudioRecorder(url: url, settings: settings)
                    recorder.record()
                    self.audioRecorder = recorder
                    self.recordURL = url
                    self.isRecording = true
                    self.errorMessage = nil
                } catch {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    public func stopRecording(send: Bool) {
        guard isRecording else { return }
        let durationMs = Int((audioRecorder?.currentTime ?? 0) * 1000)
        audioRecorder?.stop()
        audioRecorder = nil
        isRecording = false
        guard send, let url = recordURL, let data = try? Data(contentsOf: url) else {
            if let url = recordURL { try? FileManager.default.removeItem(at: url) }
            recordURL = nil
            return
        }
        recordURL = nil
        Task {
            await sendMedia(data: data, kind: "voice", mimeType: "audio/m4a", fileExtension: "m4a", durationMs: max(durationMs, 1))
            try? FileManager.default.removeItem(at: url)
        }
    }
}

public struct TaskChatView: View {
    @StateObject private var model: TaskChatViewModel
    @State private var showPhotoPicker = false
    @State private var photoItem: PhotosPickerItem?
    @State private var fullscreenURL: URL?

    public init(
        taskId: String,
        currentUserId: String?,
        enqueueOfflineText: ((String, String, String) -> Bool)? = nil
    ) {
        _model = StateObject(
            wrappedValue: TaskChatViewModel(
                taskId: taskId,
                currentUserId: currentUserId,
                enqueueOfflineText: enqueueOfflineText
            )
        )
    }

    public var body: some View {
        VStack(spacing: 0) {
            if model.isLoading && model.messages.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 8) {
                            ForEach(model.messages) { msg in
                                messageBubble(msg)
                                    .id(msg.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: model.messages.count) { _ in
                        if let last = model.messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }
            }
            if let err = model.errorMessage {
                Text(err)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.horizontal)
                    .accessibilityIdentifier("task_chat_error")
                    .accessibilityLabel("task_chat_error")
            }
            composer
        }
        .onAppear { model.start() }
        .onDisappear { model.stop() }
        .photosPicker(isPresented: $showPhotoPicker, selection: $photoItem, matching: .any(of: [.images, .videos]))
        .modifier(TaskChatPhotoItemChangeModifier(photoItem: $photoItem, onPick: consumePickedPhotoItem))
        .fullScreenCover(isPresented: Binding(
            get: { fullscreenURL != nil },
            set: { if !$0 { fullscreenURL = nil } }
        )) {
            if let url = fullscreenURL {
                TaskChatFullscreenMediaView(url: url) { fullscreenURL = nil }
            }
        }
    }

    private func consumePickedPhotoItem(_ item: PhotosPickerItem) {
        Task {
            defer { photoItem = nil }
            let isVideo = item.supportedContentTypes.contains {
                $0.conforms(to: .movie) || $0.conforms(to: .mpeg4Movie) || $0.conforms(to: .quickTimeMovie)
            }
            do {
                let picked = try await item.loadTransferable(type: PickedChatMedia.self)
                guard let picked, !picked.data.isEmpty else {
                    model.errorMessage = NSLocalizedString("task_chat_media_read_failed", comment: "")
                    return
                }
                if isVideo {
                    await model.sendMedia(
                        data: picked.data,
                        kind: "video",
                        mimeType: "video/mp4",
                        fileExtension: "mp4"
                    )
                } else {
                    await model.sendMedia(
                        data: picked.data,
                        kind: "image",
                        mimeType: "image/jpeg",
                        fileExtension: "jpg"
                    )
                }
            } catch {
                model.errorMessage = error.localizedDescription
            }
        }
    }

    private func messageBubble(_ msg: TaskMessageDTO) -> some View {
        let mine = model.currentUserId != nil && msg.senderUserId == model.currentUserId
        return HStack {
            if mine { Spacer(minLength: 40) }
            VStack(alignment: mine ? .trailing : .leading, spacing: 4) {
                Group {
                    if msg.kind == "voice", let urlStr = msg.mediaUrl, let url = URL(string: urlStr) {
                        TaskChatAudioPlayer(url: url)
                            .padding(8)
                            .accessibilityIdentifier("task_chat_voice_\(msg.id)")
                            .accessibilityLabel("task_chat_voice")
                    } else if msg.kind == "image", let urlStr = msg.mediaUrl, let url = URL(string: urlStr) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image.resizable().scaledToFit().frame(maxHeight: 180)
                                    .onTapGesture { fullscreenURL = url }
                            case .failure:
                                Text(bubbleText(msg))
                            default:
                                ProgressView()
                            }
                        }
                        .padding(6)
                        .accessibilityIdentifier("task_chat_image_\(msg.id)")
                        .accessibilityLabel("task_chat_photo")
                    } else if msg.kind == "video", let urlStr = msg.mediaUrl, let url = URL(string: urlStr) {
                        Button {
                            fullscreenURL = url
                        } label: {
                            Label(NSLocalizedString("task_chat_video", comment: ""), systemImage: "play.rectangle.fill")
                        }
                        .padding(10)
                        .accessibilityIdentifier("task_chat_video_\(msg.id)")
                        .accessibilityLabel("task_chat_video")
                    } else {
                        Text(bubbleText(msg))
                            .padding(10)
                    }
                }
                .background(mine ? Color.accentColor.opacity(0.85) : Color.secondary.opacity(0.15))
                .foregroundColor(mine ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                HStack(spacing: 8) {
                    Text(msg.createdAt)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    if mine {
                        Button(role: .destructive) {
                            Task { await model.deleteMessage(msg.id) }
                        } label: {
                            Text(NSLocalizedString("task_chat_delete", comment: ""))
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                        }
                        .buttonStyle(.bordered)
                        .accessibilityIdentifier("task_chat_delete_\(msg.id)")
                        .accessibilityLabel("task_chat_delete")
                    }
                }
            }
            if !mine { Spacer(minLength: 40) }
        }
        .accessibilityIdentifier("task_chat_bubble_\(msg.id)")
        .contextMenu {
            if mine {
                Button(role: .destructive) {
                    Task { await model.deleteMessage(msg.id) }
                } label: {
                    Label(NSLocalizedString("task_chat_delete", comment: ""), systemImage: "trash")
                }
                .accessibilityIdentifier("task_chat_context_delete_\(msg.id)")
                .accessibilityLabel("task_chat_delete")
            }
        }
    }

    private func bubbleText(_ msg: TaskMessageDTO) -> String {
        switch msg.kind {
        case "text":
            return msg.body ?? ""
        case "voice":
            let sec = msg.durationMs.map { max(1, $0 / 1000) } ?? 0
            return String(format: NSLocalizedString("task_chat_voice_fmt", comment: ""), sec)
        case "image":
            return NSLocalizedString("task_chat_photo", comment: "")
        case "video":
            return NSLocalizedString("task_chat_video", comment: "")
        default:
            return msg.kind
        }
    }

    private var composer: some View {
        VStack(spacing: 8) {
            HStack(alignment: .bottom, spacing: 8) {
                Button {
                    showPhotoPicker = true
                } label: {
                    Image(systemName: "paperclip")
                }
                .disabled(model.isSending)
                .accessibilityIdentifier("task_chat_attach")
                .accessibilityLabel("task_chat_attach")
                TextField(NSLocalizedString("task_chat_placeholder", comment: ""), text: $model.draftText, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityIdentifier("task_chat_composer")
                    .accessibilityLabel("task_chat_composer")
                Button {
                    if model.isRecording {
                        model.stopRecording(send: true)
                    } else {
                        model.startRecording()
                    }
                } label: {
                    Image(systemName: model.isRecording ? "stop.circle.fill" : "mic.circle")
                        .foregroundColor(model.isRecording ? .red : .accentColor)
                }
                .disabled(model.isSending)
                .accessibilityIdentifier(model.isRecording ? "task_chat_voice_stop" : "task_chat_voice_record")
                .accessibilityLabel(model.isRecording ? "task_chat_voice_stop" : "task_chat_voice_record")
                Button {
                    Task { await model.sendText() }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                }
                .disabled(model.isSending || model.draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityIdentifier("task_chat_send")
                .accessibilityLabel("task_chat_send")
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(.ultraThinMaterial)
    }
}

struct TaskChatAudioPlayer: View {
    let url: URL
    @State private var player: AVPlayer?

    var body: some View {
        HStack {
            Button {
                if player == nil {
                    let p = AVPlayer(url: url)
                    player = p
                    p.play()
                } else {
                    player?.pause()
                    player = nil
                }
            } label: {
                Image(systemName: player == nil ? "play.circle.fill" : "pause.circle.fill")
                    .font(.title2)
            }
            Text(NSLocalizedString("task_chat_voice_fmt", comment: "").replacingOccurrences(of: "%d", with: "…"))
                .font(.caption)
        }
        .onDisappear {
            player?.pause()
            player = nil
        }
    }
}

struct TaskChatFullscreenMediaView: View {
    let url: URL
    let onClose: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            if url.pathExtension.lowercased() == "mp4" || url.absoluteString.contains("video") {
                VideoPlayer(player: AVPlayer(url: url))
                    .ignoresSafeArea()
            } else {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFit()
                    default:
                        ProgressView().tint(.white)
                    }
                }
            }
            Button(action: onClose) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title)
                    .foregroundStyle(.white)
                    .padding()
            }
        }
    }
}

/// Bridges PhotosPicker selection across iOS 16/17+ onChange semantics.
private struct TaskChatPhotoItemChangeModifier: ViewModifier {
    @Binding var photoItem: PhotosPickerItem?
    let onPick: (PhotosPickerItem) -> Void

    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.onChange(of: photoItem) { _, newValue in
                if let newValue { onPick(newValue) }
            }
        } else {
            content.onChange(of: photoItem) { newValue in
                if let newValue { onPick(newValue) }
            }
        }
    }
}
