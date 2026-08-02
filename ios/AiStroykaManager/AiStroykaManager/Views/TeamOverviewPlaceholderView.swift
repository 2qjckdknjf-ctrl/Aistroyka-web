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
                    .foregroundStyle(BrandTokens.textSecondary)
            }
            .navigationTitle(NSLocalizedString("mgr_tab_team", comment: ""))
        .brandScrollChrome()

        }
    }
}
