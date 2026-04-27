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
