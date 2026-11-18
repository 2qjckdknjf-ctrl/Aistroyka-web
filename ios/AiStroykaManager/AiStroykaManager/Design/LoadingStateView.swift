//
//  LoadingStateView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct LoadingStateView: View {
    var message: String = NSLocalizedString("mgr_loading", comment: "")

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text(message)
                .font(.subheadline)
                .foregroundStyle(ManagerV43.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
