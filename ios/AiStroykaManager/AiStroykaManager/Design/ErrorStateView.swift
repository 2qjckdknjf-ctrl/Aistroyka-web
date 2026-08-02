//
//  ErrorStateView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ErrorStateView: View {
    var message: String
    /// Caller-supplied localized title — no English hardcoded default.
    var retryTitle: String
    var retry: (() -> Void)?

    init(message: String, retryTitle: String, retry: (() -> Void)? = nil) {
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    var body: some View {
        VStack(spacing: BrandTokens.space3) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 44))
                .foregroundStyle(ManagerSemanticColors.warning)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(ManagerSemanticColors.textSecondary)
                .multilineTextAlignment(.center)
            if let retry {
                BrandSecondaryButton(action: retry) {
                    Text(retryTitle)
                }
                .frame(maxWidth: 280)
                .accessibilityIdentifier("pilot_manager_error_retry")
            }
        }
        .padding(BrandTokens.space8)
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
