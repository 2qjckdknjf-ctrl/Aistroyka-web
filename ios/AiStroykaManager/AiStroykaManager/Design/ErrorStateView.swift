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
                .foregroundStyle(.secondary)
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
func runManagerLoad(
    setLoading: @MainActor (Bool) -> Void,
    setErrorMessage: @MainActor (String?) -> Void,
    operation: () async throws -> Void
) async {
    setErrorMessage(nil)
    setLoading(true)
    defer { setLoading(false) }
    do {
        try await operation()
    } catch let apiError as APIError {
        setErrorMessage(apiError.message)
    } catch {
        setErrorMessage(error.localizedDescription)
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
    } catch let apiError as APIError {
        setErrorMessage(apiError.message)
    } catch {
        setErrorMessage(error.localizedDescription)
    }
    return false
}

func shouldLoadInitially<T>(items: [T], errorMessage: String?) -> Bool {
    items.isEmpty && errorMessage == nil
}

func shouldLoadInitially<T>(item: T?, errorMessage: String?) -> Bool {
    item == nil && errorMessage == nil
}
