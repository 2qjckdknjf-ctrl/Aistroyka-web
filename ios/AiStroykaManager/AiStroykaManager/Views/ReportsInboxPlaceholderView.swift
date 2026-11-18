//
//  ReportsInboxPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ReportsInboxPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text(NSLocalizedString("mgr_reports_placeholder", comment: ""))
                    .foregroundStyle(.secondary)
            }
            .aistroykaListChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_reports", comment: ""))
        }
    }
}
