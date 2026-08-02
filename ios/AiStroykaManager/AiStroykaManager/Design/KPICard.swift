//
//  KPICard.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct KPICard: View {
    var title: String
    var value: String
    var subtitle: String?

    var body: some View {
        BrandCard {
            VStack(alignment: .leading, spacing: BrandTokens.space1) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(ManagerSemanticColors.textSecondary)
                Text(value)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundStyle(ManagerSemanticColors.textPrimary)
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(ManagerSemanticColors.textTertiary)
                }
            }
        }
    }
}
