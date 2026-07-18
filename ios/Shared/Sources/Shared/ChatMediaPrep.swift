//
//  ChatMediaPrep.swift
//  Shared
//
//  Normalize gallery picks for task_chat upload (JPEG images; video MIME from UTType).
//

import Foundation
import UniformTypeIdentifiers

#if canImport(UIKit)
import UIKit
#endif

public enum ChatMediaPrep {
    public struct Prepared {
        public let data: Data
        public let kind: String
        public let mimeType: String
        public let fileExtension: String

        public init(data: Data, kind: String, mimeType: String, fileExtension: String) {
            self.data = data
            self.kind = kind
            self.mimeType = mimeType
            self.fileExtension = fileExtension
        }
    }

    /// Prepare gallery bytes for chat upload. Images are normalized to JPEG so MIME matches allow-list.
    public static func prepareGalleryItem(data: Data, isVideo: Bool, contentTypes: [UTType]) throws -> Prepared {
        guard !data.isEmpty else {
            throw ChatMediaPrepError.emptyPayload
        }
        let looksVideo = isVideo || contentTypes.contains {
            $0.conforms(to: .movie) || $0.conforms(to: .mpeg4Movie) || $0.conforms(to: .quickTimeMovie)
        }
        if looksVideo {
            let isMov = contentTypes.contains { $0.conforms(to: .quickTimeMovie) }
            let mime = isMov ? "video/quicktime" : "video/mp4"
            let ext = isMov ? "mov" : "mp4"
            let maxVideo = 50 * 1024 * 1024
            if data.count > maxVideo {
                throw ChatMediaPrepError.tooLarge(bytes: data.count, maxBytes: maxVideo)
            }
            return Prepared(data: data, kind: "video", mimeType: mime, fileExtension: ext)
        }

        let jpeg = try jpegData(from: data)
        let maxImage = 15 * 1024 * 1024
        if jpeg.count > maxImage {
            throw ChatMediaPrepError.tooLarge(bytes: jpeg.count, maxBytes: maxImage)
        }
        return Prepared(data: jpeg, kind: "image", mimeType: "image/jpeg", fileExtension: "jpg")
    }

    private static func jpegData(from data: Data) throws -> Data {
        #if canImport(UIKit)
        if let image = UIImage(data: data), let jpeg = image.jpegData(compressionQuality: 0.88), !jpeg.isEmpty {
            return jpeg
        }
        #endif
        // Pass through if payload already looks like JPEG (SOI marker).
        if data.count > 3, data[0] == 0xFF, data[1] == 0xD8 {
            return data
        }
        throw ChatMediaPrepError.unsupportedImage
    }
}

public enum ChatMediaPrepError: LocalizedError {
    case emptyPayload
    case unsupportedImage
    case tooLarge(bytes: Int, maxBytes: Int)

    public var errorDescription: String? {
        switch self {
        case .emptyPayload, .unsupportedImage:
            return NSLocalizedString("task_chat_media_read_failed", comment: "")
        case .tooLarge:
            return NSLocalizedString("task_chat_media_too_large", comment: "")
        }
    }
}
