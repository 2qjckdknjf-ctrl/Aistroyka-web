//
//  TeamOverviewPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct TeamOverviewPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text(NSLocalizedString("mgr_team_placeholder", comment: ""))
                    .foregroundStyle(.secondary)
                    .aistroykaRowChrome()
            }
            .aistroykaListChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_team", comment: ""))
        }
    }
}
