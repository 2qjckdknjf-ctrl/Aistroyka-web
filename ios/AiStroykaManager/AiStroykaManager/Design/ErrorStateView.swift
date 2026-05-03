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
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if let retry = retry {
                Button(retryTitle, action: retry)
                    .buttonStyle(.bordered)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

@MainActor
func runManagerLoad(
    isLoading: inout Bool,
    errorMessage: inout String?,
    operation: () async throws -> Void
) async {
    errorMessage = nil
    isLoading = true
    defer { isLoading = false }
    do {
        try await operation()
    } catch let apiError as APIError {
        errorMessage = apiError.message
    } catch {
        errorMessage = error.localizedDescription
    }
}

@MainActor
@discardableResult
func runManagerAction(
    isLoading: inout Bool,
    errorMessage: inout String?,
    operation: () async throws -> Void
) async -> Bool {
    errorMessage = nil
    isLoading = true
    defer { isLoading = false }
    do {
        try await operation()
        return true
    } catch let apiError as APIError {
        errorMessage = apiError.message
    } catch {
        errorMessage = error.localizedDescription
    }
    return false
}

func shouldLoadInitially<T>(items: [T], errorMessage: String?) -> Bool {
    items.isEmpty && errorMessage == nil
}

func shouldLoadInitially<T>(item: T?, errorMessage: String?) -> Bool {
    item == nil && errorMessage == nil
}
