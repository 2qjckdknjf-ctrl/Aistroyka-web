//
//  BrandTokens.swift
//  Shared
//
//  Canonical mobile semantic tokens mapped from live web brand:
//  apps/web/app/design-tokens.css (--aistroyka-*).
//  Feature screens must consume these (or Manager/Worker semantic wrappers),
//  never raw system palette / hardcoded feature colors.
//

import SwiftUI
import UIKit

/// Hex helpers kept private so feature code cannot invent ad-hoc colors.
private enum BrandHex {
    static func color(_ hex: UInt32, alpha: Double = 1) -> Color {
        Color(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

public enum BrandTokens {
    // MARK: - Surfaces (deep navy branded)

    /// `--aistroyka-bg-primary` / page
    public static let bgPage = BrandHex.color(0x040A18)
    /// `--aistroyka-bg-secondary`
    public static let bgSecondary = BrandHex.color(0x0B1428)
    /// `--aistroyka-surface`
    public static let surface = BrandHex.color(0x101B33)
    /// `--aistroyka-surface-raised`
    public static let surfaceRaised = BrandHex.color(0x16213E)
    /// `--aistroyka-surface-muted`
    public static let surfaceMuted = BrandHex.color(0x1F2E4D)

    // MARK: - Brand / action

    /// `--aistroyka-accent` construction yellow
    public static let actionPrimary = BrandHex.color(0xF5C518)
    public static let actionPrimaryHover = BrandHex.color(0xFFD54F)
    public static let actionPrimaryPressed = BrandHex.color(0xE2AB00)
    public static let actionPrimaryDisabled = BrandHex.color(0xFFC400, alpha: 0.45)
    /// Solid disabled primary fill for dark navy (readable yellow, not a muddy overlay).
    public static let actionPrimaryDisabledSolid = BrandHex.color(0xB89212)
    /// Tint for selected chips / nav (`--aistroyka-accent-light`)
    public static let actionPrimarySoft = BrandHex.color(0xFFC400, alpha: 0.18)

    // MARK: - Text

    public static let textPrimary = BrandHex.color(0xF8FBFF)
    public static let textSecondary = BrandHex.color(0x9FB0CD)
    public static let textTertiary = BrandHex.color(0x6D7F9F)
    /// On yellow primary buttons (`--aistroyka-text-inverse`)
    public static let textOnPrimary = BrandHex.color(0x050B1C)
    public static let textOnBranded = BrandHex.color(0xF9FAFB, alpha: 0.95)

    // MARK: - Borders

    public static let borderSubtle = BrandHex.color(0x223250)
    public static let borderStrong = BrandHex.color(0x2F4771)

    // MARK: - Status

    public static let stateSuccess = BrandHex.color(0x34C759)
    public static let stateWarning = BrandHex.color(0xFF9500)
    public static let stateError = BrandHex.color(0xFF3B30)
    public static let stateInfo = BrandHex.color(0x007AFF)

    public static let badgeNeutralBg = BrandHex.color(0x3C3C43, alpha: 0.2)
    public static let badgeSuccessBg = BrandHex.color(0x34C759, alpha: 0.2)
    public static let badgeWarningBg = BrandHex.color(0xFF9500, alpha: 0.2)
    public static let badgeErrorBg = BrandHex.color(0xFF3B30, alpha: 0.2)

    // MARK: - Overlay / skeleton

    public static let overlayDim = Color.black.opacity(0.3)
    public static let skeletonLine = textPrimary.opacity(0.3)
    public static let skeletonTitle = textPrimary.opacity(0.25)

    // MARK: - UIKit bridges (list chrome)

    public static var uiBgPage: UIColor { UIColor(red: 4 / 255, green: 10 / 255, blue: 24 / 255, alpha: 1) }
    public static var uiSurface: UIColor { UIColor(red: 16 / 255, green: 27 / 255, blue: 51 / 255, alpha: 1) }
    public static var uiTextPrimary: UIColor { UIColor(red: 248 / 255, green: 251 / 255, blue: 255 / 255, alpha: 1) }

    /// Apply once at app root so List/Form rows don't flash system white.
    public static func applyGlobalListChrome() {
        let table = UITableView.appearance()
        table.backgroundColor = uiBgPage
        table.separatorColor = UIColor(red: 34 / 255, green: 50 / 255, blue: 80 / 255, alpha: 1)
        UITableViewCell.appearance().backgroundColor = uiSurface
        UICollectionView.appearance().backgroundColor = uiBgPage
    }

    // MARK: - Spacing (4pt grid)

    public static let space1: CGFloat = 4
    public static let space2: CGFloat = 8
    public static let space3: CGFloat = 12
    public static let space4: CGFloat = 16
    public static let space5: CGFloat = 20
    public static let space6: CGFloat = 24
    public static let space8: CGFloat = 32
    public static let space10: CGFloat = 40
    public static let space12: CGFloat = 48
    public static let screenX: CGFloat = 16
    public static let sectionY: CGFloat = 24
    public static let touchMin: CGFloat = 44

    // MARK: - Radius

    public static let radiusXs: CGFloat = 4
    public static let radiusSm: CGFloat = 6
    public static let radiusMd: CGFloat = 8
    public static let radiusLg: CGFloat = 10
    public static let radiusXl: CGFloat = 16
    public static let radiusXxl: CGFloat = 20
    public static let radiusCard: CGFloat = 16

    // MARK: - Motion (seconds)

    public static let durationInstant: Double = 0.15
    public static let durationFast: Double = 0.25
    public static let durationNormal: Double = 0.35
    public static let durationButton: Double = 0.2

    // MARK: - Opacity

    public static let opacityDisabled: Double = 0.5
    public static let opacitySubtle: Double = 0.7
    public static let opacityPressed: Double = 0.92
}
