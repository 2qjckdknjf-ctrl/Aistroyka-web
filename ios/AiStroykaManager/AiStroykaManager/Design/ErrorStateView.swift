//
//  ErrorStateView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ErrorStateView: View {
    var message: String
    var retryTitle: String = NSLocalizedString("mgr_retry", comment: "")
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(ManagerSemanticColors.warning)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(ManagerV43.textSecondary)
                .multilineTextAlignment(.center)
            if let retry = retry {
                Button(retryTitle, action: retry)
                    .buttonStyle(.bordered)
                    .accessibilityIdentifier("pilot_manager_error_retry")
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

@MainActor
@discardableResult
func runManagerAction(
    setLoading: @MainActor (Bool) -> Void,
    setErrorMessage: @MainActor (String?) -> Void,
    operation: () async throws -> Void
) async -> Bool {
    setErrorMessage(nil)
    setLoading(true)
    defer { setLoading(false) }
    do {
        try await operation()
        return true
    } catch {
        setErrorMessage(localizedManagerError(error))
    }
    return false
}

func shouldLoadInitially<T>(items: [T], errorMessage: String?) -> Bool {
    items.isEmpty && errorMessage == nil
}

func shouldLoadInitially<T>(item: T?, errorMessage: String?) -> Bool {
    item == nil && errorMessage == nil
}

func localizedManagerError(_ error: Error) -> String {
    if let apiError = error as? APIError {
        return localizedManagerAPIMessage(apiError.message)
    }
    return localizedManagerAPIMessage(error.localizedDescription)
}

func localizedManagerAPIMessage(_ message: String) -> String {
    let normalized = message.lowercased()
    if normalized.contains("authentication required")
        || normalized.contains("unauthorized")
        || normalized.contains("401") {
        return NSLocalizedString("mgr_v43_auth_required", comment: "")
    }
    if ManagerV43Formatters.isPermissionDenied(message) {
        return NSLocalizedString("mgr_v43_permission_denied", comment: "")
    }
    return message
}

@MainActor
func runManagerLoad(
    setLoading: @MainActor (Bool) -> Void,
    setErrorMessage: @MainActor (String?) -> Void,
    previewFallback: (() -> Void)? = nil,
    operation: () async throws -> Void
) async {
    setErrorMessage(nil)
    setLoading(true)
    defer { setLoading(false) }
    do {
        try await operation()
    } catch {
        if ManagerV43Preview.showsCatalogWithoutAuth, let previewFallback {
            previewFallback()
            setErrorMessage(nil)
            return
        }
        setErrorMessage(localizedManagerError(error))
    }
}
