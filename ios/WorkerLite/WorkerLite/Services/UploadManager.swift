//
//  UploadManager.swift
//  WorkerLite
//

import Foundation
import UIKit

enum UploadPhase: String {
    case queued
    case creatingSession
    case uploading
    case finalizing
    case attaching
    case done
    case failed
}

struct PhotoUploadItem: Identifiable, Equatable {
    let id: UUID
    let purpose: String // report_before | report_after
    var phase: UploadPhase
    var sessionId: String?
    var uploadPath: String?
    var error: String?
    var idempotencyKeyCreate: String
    var idempotencyKeyFinalize: String
    var idempotencyKeyAddMedia: String

    static func == (lhs: PhotoUploadItem, rhs: PhotoUploadItem) -> Bool {
        lhs.id == rhs.id && lhs.phase == rhs.phase && lhs.sessionId == rhs.sessionId && lhs.error == rhs.error
    }
}

@MainActor
final class UploadManager: ObservableObject {
    @Published var items: [PhotoUploadItem] = []
    
    func enqueue(purpose: String) -> PhotoUploadItem {
        let item = PhotoUploadItem(
            id: UUID(),
            purpose: purpose,
            phase: .queued,
            sessionId: nil,
            uploadPath: nil,
            error: nil,
            idempotencyKeyCreate: DeviceContext.newIdempotencyKey(),
            idempotencyKeyFinalize: DeviceContext.newIdempotencyKey(),
            idempotencyKeyAddMedia: DeviceContext.newIdempotencyKey()
        )
        items.append(item)
        return item
    }
    
    func upload(image: UIImage, itemId: UUID, reportId: String) async {
        guard let idx = items.firstIndex(where: { $0.id == itemId }) else { return }
        let filename = "\(itemId.uuidString.prefix(8)).jpg"
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else {
            updateItem(at: idx) { $0.phase = .failed; $0.error = "Could not encode image" }
            return
        }
        let size = jpeg.count
        updateItem(at: idx) { $0.phase = .creatingSession }
        
        let purpose = items[idx].purpose
        let keyCreate = items[idx].idempotencyKeyCreate
        let keyFinalize = items[idx].idempotencyKeyFinalize
        let keyAddMedia = items[idx].idempotencyKeyAddMedia
        do {
            let (sessionId, uploadPath) = try await WorkerAPI.createUploadSession(
                purpose: purpose,
                idempotencyKey: keyCreate
            )
            updateItem(at: idx) { $0.sessionId = sessionId; $0.uploadPath = uploadPath; $0.phase = .uploading }
            
            let pathInBucket = uploadPath.hasPrefix("media/") ? String(uploadPath.dropFirst("media/".count)) : uploadPath
            let storagePath = "\(pathInBucket)/\(filename)"
            let objectPath = "media/\(storagePath)"
            
            try await uploadToSupabaseStorage(data: jpeg, path: storagePath)
            updateItem(at: idx) { $0.phase = .finalizing }
            
            try await WorkerAPI.finalizeUploadSession(
                sessionId: sessionId,
                objectPath: objectPath,
                mimeType: "image/jpeg",
                sizeBytes: size,
                idempotencyKey: keyFinalize
            )
            updateItem(at: idx) { $0.phase = .attaching }
            
            try await WorkerAPI.addMedia(
                reportId: reportId,
                uploadSessionId: sessionId,
                idempotencyKey: keyAddMedia
            )
            updateItem(at: idx) { $0.phase = .done }
        } catch {
            updateItem(at: idx) { $0.phase = .failed; $0.error = (error as? APIError)?.message ?? error.localizedDescription }
        }
    }
    
    private func updateItem(at index: Int, _ block: (inout PhotoUploadItem) -> Void) {
        var it = items[index]
        block(&it)
        items[index] = it
    }
    
    func retry(itemId: UUID, image: UIImage?, reportId: String) async {
        guard let idx = items.firstIndex(where: { $0.id == itemId }),
              let img = image else { return }
        updateItem(at: idx) { $0.phase = .queued; $0.error = nil }
        await upload(image: img, itemId: itemId, reportId: reportId)
    }
    
    private func uploadToSupabaseStorage(data: Data, path: String) async throws {
        let base = Config.supabaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let urlString = "\(base)/storage/v1/object/media/\(path)"
        guard let url = URL(string: urlString) else { throw APIError(statusCode: nil, code: nil, message: "Invalid storage URL") }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(await AuthService.shared.getAccessToken() ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.httpBody = data
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(statusCode: nil, code: nil, message: "Storage upload failed")
        }
        guard (200...299).contains(http.statusCode) else {
            let message: String
            if http.statusCode == 401 || http.statusCode == 403 {
                message = "Storage policy denied. Check Supabase RLS for bucket media and tenant path."
            } else {
                message = "Storage upload failed (HTTP \(http.statusCode))"
            }
            throw APIError(statusCode: http.statusCode, code: nil, message: message)
        }
    }
}
