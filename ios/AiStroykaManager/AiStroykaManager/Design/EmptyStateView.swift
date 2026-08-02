//
//  EmptyStateView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct EmptyStateView: View {
    var title: String = NSLocalizedString("mgr_empty_default_title", comment: "")
    var subtitle: String?
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        BrandEmptyState(
            title: title,
            subtitle: subtitle,
            actionTitle: actionTitle,
            action: action
        )
    }
}
