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
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
            Text(NSLocalizedString("mgr_unauthorized", comment: ""))
                .font(.title2)
                .fontWeight(.semibold)
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            Button(NSLocalizedString("mgr_sign_out", comment: "")) {
                Task { await sessionState.signOut() }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }
}
