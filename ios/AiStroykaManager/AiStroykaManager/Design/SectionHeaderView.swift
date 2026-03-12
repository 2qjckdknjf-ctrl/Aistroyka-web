//
//  SectionHeaderView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

/// Reusable section header for lists and dashboards.
struct SectionHeaderView: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundStyle(.primary)
    }
}
