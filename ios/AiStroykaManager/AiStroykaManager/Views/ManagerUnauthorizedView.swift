//
//  ManagerUnauthorizedView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerUnauthorizedView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    let message: String

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "person.crop.circle.badge.minus")
                .font(.largeTitle)
                .foregroundStyle(BrandTokens.textSecondary)
            Text(NSLocalizedString("mgr_unauthorized", comment: ""))
                .font(.title2)
                .fontWeight(.semibold)
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(BrandTokens.textSecondary)
                .padding(.horizontal)
            if sessionState.canRetryRoleCheck {
                Button(NSLocalizedString("mgr_retry", comment: "")) {
                    sessionState.checkSession()
                }
                .buttonStyle(.bordered)
                .accessibilityIdentifier("pilot_manager_unauthorized_retry")
            }
            Button(NSLocalizedString("mgr_sign_out", comment: "")) {
                Task { await sessionState.signOut() }
            }
            .buttonStyle(.borderedProminent)
            .accessibilityIdentifier("pilot_manager_unauthorized_sign_out")
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(BrandTokens.bgPage)
        .accessibilityIdentifier("pilot_manager_unauthorized")
    }
}
