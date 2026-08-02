//
//  WorkerSemanticColors.swift
//  AiStroykaWorker
//
//  App-level semantic aliases → Shared BrandTokens (live web --aistroyka-*).
//

import SwiftUI
import Shared

enum WorkerSemanticColors {
    static let pageBackground = BrandTokens.bgPage
    static let inputSurface = BrandTokens.surface
    static let surface = BrandTokens.surface
    static let surfaceMuted = BrandTokens.surfaceMuted
    static let borderSubtle = BrandTokens.borderSubtle
    static let primary = BrandTokens.actionPrimary
    static let onPrimary = BrandTokens.textOnPrimary
    static let primaryDisabled = BrandTokens.actionPrimaryDisabled
    static let textPrimary = BrandTokens.textPrimary
    static let textSecondary = BrandTokens.textSecondary
    static let textTertiary = BrandTokens.textTertiary
    static let success = BrandTokens.stateSuccess
    static let warning = BrandTokens.stateWarning
    static let warningSurface = BrandTokens.badgeWarningBg
    static let info = BrandTokens.stateInfo
    static let error = BrandTokens.stateError
    static let neutral = BrandTokens.textSecondary
}
