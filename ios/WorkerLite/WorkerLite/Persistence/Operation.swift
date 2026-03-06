//
//  Operation.swift
//  WorkerLite
//
//  Phase 7.3 — Persistent offline operation model.
//

import Foundation

enum OperationState: String, Codable {
    case queued
    case running
    case succeeded
    case failed_permanent
}

enum OperationType: String, Codable {
    case startShift
    case endShift
    case createReport
    case createUploadSession
    case uploadBinary
    case finalizeSession
    case attachMedia
    case submitReport
    case syncAck
}

/// Minimal payload: only fields needed for execution. All optional; decode by type.
struct OperationPayload: Codable, Equatable {
    var dayId: String?
    var taskId: String?
    var reportId: String?
    var purpose: String?
    var photoItemId: String?
    var sessionId: String?
    var uploadPath: String?
    var objectPath: String?
    var mimeType: String?
    var sizeBytes: Int?
    var imageDataBase64: String?
    var cursor: Int?

    init(dayId: String? = nil, taskId: String? = nil, reportId: String? = nil, purpose: String? = nil, photoItemId: String? = nil, sessionId: String? = nil, uploadPath: String? = nil, objectPath: String? = nil, mimeType: String? = nil, sizeBytes: Int? = nil, imageDataBase64: String? = nil, cursor: Int? = nil) {
        self.dayId = dayId
        self.taskId = taskId
        self.reportId = reportId
        self.purpose = purpose
        self.photoItemId = photoItemId
        self.sessionId = sessionId
        self.uploadPath = uploadPath
        self.objectPath = objectPath
        self.mimeType = mimeType
        self.sizeBytes = sizeBytes
        self.imageDataBase64 = imageDataBase64
        self.cursor = cursor
    }
}

struct QueuedOperation: Codable, Equatable {
    var id: String
    var type: OperationType
    var payload: OperationPayload
    var idempotencyKey: String
    var dependsOn: [String]
    var state: OperationState
    var attemptCount: Int
    var nextAttemptAt: String?
    var lastErrorCode: String?
    var lastErrorMessage: String?
    var createdAt: String
    var updatedAt: String
    var resultReportId: String?
    var resultSessionId: String?
    var resultUploadPath: String?
}
