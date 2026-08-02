//
//  InlineStatusViews.swift
//  Shared
//
//  Small, reusable loading / error+retry rows for Worker and Manager.
//

import SwiftUI

public struct InlineLoadingRow: View {
    private let message: String

    public init(_ message: String) {
        self.message = message
    }

    public var body: some View {
        HStack(spacing: BrandTokens.space2) {
            ProgressView()
                .tint(BrandTokens.actionPrimary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(BrandTokens.textSecondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
    }
}

public struct InlineErrorRetryRow: View {
    private let message: String
    private let retryTitle: String
    private let retry: () -> Void

    /// - Parameters:
    ///   - retryTitle: Caller-supplied localized string (required; no English default).
    public init(message: String, retryTitle: String, retry: @escaping () -> Void) {
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: BrandTokens.space2) {
            Text(message)
                .font(.subheadline)
                .foregroundStyle(BrandTokens.stateError)
            BrandSecondaryButton(width: .hug, action: retry) {
                Text(retryTitle)
                    .padding(.horizontal, BrandTokens.space3)
            }
        }
        .accessibilityElement(children: .contain)
    }
}
