//
//  ProjectCopilotChatView.swift
//  POST /api/v1/projects/:id/copilot/chat/stream (SSE)
//

import SwiftUI
import Shared

struct CopilotChatMessage: Identifiable {
    let id: UUID
    let role: String
    let content: String

    init(id: UUID = UUID(), role: String, content: String) {
        self.id = id
        self.role = role
        self.content = content
    }
}

struct ProjectCopilotChatView: View {
    let projectId: String
    let projectName: String
    let intelligence: ProjectIntelligenceDataDTO?

    @State private var messages: [CopilotChatMessage] = []
    @State private var draft = ""
    @State private var threadId: String?
    @State private var isSending = false
    @State private var errorMessage: String?
    @State private var fallbackNote: String?

    private var decisionContext: DecisionContextPayload {
        intelligence?.buildDecisionContext() ?? DecisionContextPayload(
            overallRisk: 0.3,
            confidence: 0.7,
            topRiskFactors: [],
            projectedDelayDate: nil,
            velocityTrend: "unknown",
            anomalies: [],
            aggregatedAt: ISO8601DateFormatter().string(from: Date())
        )
    }

    private var uiLocale: String? {
        if #available(iOS 16, *) {
            return Locale.current.language.languageCode?.identifier
        }
        return Locale.current.languageCode
    }

    var body: some View {
        VStack(spacing: 0) {
            if let note = fallbackNote {
                Text(note)
                    .font(.caption)
                    .foregroundStyle(.orange)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.orange.opacity(0.12))
            }
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(messages) { m in
                            chatBubble(m)
                                .id(m.id)
                        }
                        if isSending {
                            ProgressView()
                                .padding(.leading, 8)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }
            if let err = errorMessage {
                Text(err)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }
            HStack(spacing: 8) {
                TextField(NSLocalizedString("mgr_copilot_input_placeholder", comment: ""), text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                    .disabled(isSending)
                Button(action: { send() }) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                }
                .disabled(isSending || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityIdentifier("pilot_manager_copilot_send")
            }
            .padding()
        }
        .navigationTitle(String(format: NSLocalizedString("mgr_copilot_title_fmt", comment: ""), projectName))
        .accessibilityIdentifier("pilot_manager_copilot")
        .onAppear {
            if messages.isEmpty {
                messages.append(CopilotChatMessage(
                    role: "assistant",
                    content: NSLocalizedString("mgr_copilot_welcome", comment: "")
                ))
            }
        }
    }

    @ViewBuilder
    private func chatBubble(_ m: CopilotChatMessage) -> some View {
        let isUser = m.role == "user"
        HStack {
            if isUser { Spacer(minLength: 40) }
            Text(m.content)
                .padding(10)
                .background(isUser ? Color.accentColor.opacity(0.15) : Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            if !isUser { Spacer(minLength: 40) }
        }
    }

    private func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isSending else { return }
        draft = ""
        errorMessage = nil
        fallbackNote = nil
        messages.append(CopilotChatMessage(role: "user", content: text))
        isSending = true
        let assistantId = UUID()
        messages.append(CopilotChatMessage(id: assistantId, role: "assistant", content: ""))

        Task { @MainActor in
            defer { isSending = false }
            func updateAssistant(_ transform: (String) -> String) {
                guard let idx = messages.firstIndex(where: { $0.id == assistantId }) else { return }
                var copy = messages
                copy[idx] = CopilotChatMessage(
                    id: assistantId,
                    role: "assistant",
                    content: transform(copy[idx].content)
                )
                messages = copy
            }
            func removeEmptyAssistant() {
                guard let idx = messages.firstIndex(where: { $0.id == assistantId }),
                      messages[idx].content.isEmpty else { return }
                messages.remove(at: idx)
            }
            do {
                let done = try await ManagerCopilotService.streamCopilotChat(
                    projectId: projectId,
                    threadId: threadId,
                    userText: text,
                    decisionContext: decisionContext,
                    locale: uiLocale
                ) { event in
                    Task { @MainActor in
                        switch event {
                        case .token(let delta):
                            updateAssistant { $0 + delta }
                        case .done(let d):
                            threadId = d.threadId.isEmpty ? threadId : d.threadId
                            if let fr = d.fallbackReason, !fr.isEmpty {
                                fallbackNote = String(
                                    format: NSLocalizedString("mgr_copilot_fallback_fmt", comment: ""),
                                    fr
                                )
                            }
                            if !d.finalText.isEmpty {
                                updateAssistant { _ in d.finalText }
                            }
                        default:
                            break
                        }
                    }
                }
                if let d = done,
                   let idx = messages.firstIndex(where: { $0.id == assistantId }),
                   messages[idx].content.isEmpty {
                    updateAssistant { _ in d.finalText }
                }
            } catch let api as APIError {
                errorMessage = api.message
                removeEmptyAssistant()
            } catch {
                errorMessage = error.localizedDescription
                removeEmptyAssistant()
            }
        }
    }
}
