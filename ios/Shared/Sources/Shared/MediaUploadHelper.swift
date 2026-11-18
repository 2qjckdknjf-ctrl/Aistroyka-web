//
//  MediaUploadHelper.swift
//  Shared
//

import Foundation

/// Foreground upload of chat media to Supabase Storage (media bucket).
public enum MediaUploadHelper {
    public static func uploadObject(
        storagePath: String,
        data: Data,
        mimeType: String,
        token: String
    ) async throws {
        let base = Config.supabaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let urlString = "\(base)/storage/v1/object/media/\(storagePath)"
        guard let url = URL(string: urlString) else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid storage URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue(mimeType, forHTTPHeaderField: "Content-Type")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        let (respData, response) = try await URLSession.shared.upload(for: request, from: data)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        if code >= 400 {
            throw APIError.from(data: respData, response: response)
        }
    }

    /// Create session → upload binary → finalize. Returns upload session id (mediaId).
    public static func uploadChatMedia(
        data: Data,
        mimeType: String,
        fileExtension: String
    ) async throws -> String {
        guard let token = await AuthService.shared.getAccessToken() else {
            throw APIError(statusCode: 401, code: "unauthorized", message: "Not signed in")
        }
        let key = UUID().uuidString
        let (sessionId, uploadPath) = try await TaskMessagesAPI.createUploadSession(idempotencyKey: key)
        let pathInBucket = uploadPath.hasPrefix("media/")
            ? String(uploadPath.dropFirst("media/".count))
            : uploadPath
        let filename = "\(UUID().uuidString.prefix(8)).\(fileExtension)"
        let storagePath = "\(pathInBucket)/\(filename)"
        try await uploadObject(storagePath: storagePath, data: data, mimeType: mimeType, token: token)
        let objectPath = "media/\(storagePath)"
        try await TaskMessagesAPI.finalizeUploadSession(
            sessionId: sessionId,
            objectPath: objectPath,
            mimeType: mimeType,
            sizeBytes: data.count,
            idempotencyKey: UUID().uuidString
        )
        return sessionId
    }

    /// Detect image MIME/extension from magic bytes. Unknown payloads stay JPEG.
    public static func detectImageKind(data: Data) -> (mimeType: String, fileExtension: String) {
        if data.count >= 8,
           data[0] == 0x89, data[1] == 0x50, data[2] == 0x4E, data[3] == 0x47 {
            return ("image/png", "png")
        }
        if data.count >= 3, data[0] == 0xFF, data[1] == 0xD8, data[2] == 0xFF {
            return ("image/jpeg", "jpg")
        }
        if data.count >= 12 {
            let brand = data.subdata(in: 4..<8)
            if brand == Data("ftyp".utf8) {
                return ("image/heic", "heic")
            }
        }
        return ("image/jpeg", "jpg")
    }
}
