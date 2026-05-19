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
        HStack(spacing: 8) {
            ProgressView()
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
    }
}

public struct InlineErrorRetryRow: View {
    private let message: String
    private let retryTitle: String
    private let retry: () -> Void

    public init(message: String, retryTitle: String = "Retry", retry: @escaping () -> Void) {
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.red)
            Button(retryTitle, action: retry)
                .buttonStyle(.bordered)
        }
        .accessibilityElement(children: .contain)
    }
}
