//
//  BrandPrimitives.swift
//  Shared
//
//  Reusable branded UI primitives for Manager + Worker.
//

import SwiftUI
import UIKit

// MARK: - Page chrome

public struct BrandPageBackground: ViewModifier {
    public init() {}

    public func body(content: Content) -> some View {
        content
            .background(BrandTokens.bgPage.ignoresSafeArea())
            .preferredColorScheme(.dark)
    }
}

public extension View {
    /// Deep navy page surface + forced dark scheme (matches web branded shell).
    func brandPageChrome() -> some View {
        modifier(BrandPageBackground())
    }

    /// Hide default List/Form system grouped fill and paint branded page.
    func brandScrollChrome() -> some View {
        self
            .scrollContentBackground(.hidden)
            .background(BrandTokens.bgPage)
    }

    func brandListRowSurface() -> some View {
        listRowBackground(BrandTokens.surface)
    }

    /// Apply branded list row surface to every row in a List section chain.
    func brandListChrome() -> some View {
        self
            .brandScrollChrome()
            .listRowBackground(BrandTokens.surface)
            .listStyle(.insetGrouped)
    }
}

// MARK: - Buttons

public enum BrandButtonVariant {
    case primary
    case secondary
    case destructive
}

public enum BrandButtonWidth {
    /// Expand to container width (forms, bottom CTAs).
    case fill
    /// Hug content; still enforces min height / horizontal padding for touch target.
    case hug
    /// Compact toolbar/row control: min 44pt height, intrinsic width + padding.
    case compact
}

public struct BrandButtonStyle: ButtonStyle {
    private let variant: BrandButtonVariant
    private let isEnabled: Bool
    private let width: BrandButtonWidth
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(
        variant: BrandButtonVariant = .primary,
        isEnabled: Bool = true,
        width: BrandButtonWidth = .fill
    ) {
        self.variant = variant
        self.isEnabled = isEnabled
        self.width = width
    }

    public func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        let label = configuration.label
            .font(width == .compact ? .subheadline.weight(.semibold) : .headline)
            .foregroundStyle(foreground)
            .padding(.horizontal, width == .compact ? BrandTokens.space3 : BrandTokens.space4)
            .frame(minHeight: BrandTokens.touchMin)
            .frame(maxWidth: width == .fill ? .infinity : nil)
            .background(background(pressed: pressed))
            .overlay(overlay)
            .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous))

        return Group {
            if reduceMotion {
                label
            } else {
                label
                    .opacity(pressed && isEnabled ? BrandTokens.opacityPressed : 1)
                    .animation(.easeOut(duration: BrandTokens.durationButton), value: pressed)
            }
        }
    }

    private var foreground: Color {
        switch variant {
        case .primary:
            return BrandTokens.textOnPrimary
        case .secondary, .destructive:
            return BrandTokens.textPrimary
        }
    }

    private func background(pressed: Bool) -> Color {
        switch variant {
        case .primary:
            if !isEnabled {
                // Solid disabled yellow (readable on navy) — not a washed double-opacity overlay.
                return BrandTokens.actionPrimaryDisabledSolid
            }
            return pressed ? BrandTokens.actionPrimaryPressed : BrandTokens.actionPrimary
        case .secondary:
            return BrandTokens.surface
        case .destructive:
            return BrandTokens.badgeErrorBg
        }
    }

    @ViewBuilder
    private var overlay: some View {
        switch variant {
        case .primary:
            if !isEnabled {
                RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous)
                    .stroke(BrandTokens.actionPrimary.opacity(0.55), lineWidth: 1)
            } else {
                EmptyView()
            }
        case .secondary:
            RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous)
                .stroke(BrandTokens.borderSubtle, lineWidth: 1)
        case .destructive:
            RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous)
                .stroke(BrandTokens.stateError.opacity(0.5), lineWidth: 1)
        }
    }
}

public struct BrandPrimaryButton<Label: View>: View {
    private let action: () -> Void
    private let disabled: Bool
    private let width: BrandButtonWidth
    private let label: () -> Label

    public init(
        disabled: Bool = false,
        width: BrandButtonWidth = .fill,
        action: @escaping () -> Void,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.disabled = disabled
        self.width = width
        self.action = action
        self.label = label
    }

    public var body: some View {
        Button(action: action, label: label)
            .buttonStyle(BrandButtonStyle(variant: .primary, isEnabled: !disabled, width: width))
            .disabled(disabled)
    }
}

public struct BrandSecondaryButton<Label: View>: View {
    private let action: () -> Void
    private let disabled: Bool
    private let width: BrandButtonWidth
    private let label: () -> Label

    public init(
        disabled: Bool = false,
        width: BrandButtonWidth = .fill,
        action: @escaping () -> Void,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.disabled = disabled
        self.width = width
        self.action = action
        self.label = label
    }

    public var body: some View {
        Button(action: action, label: label)
            .buttonStyle(BrandButtonStyle(variant: .secondary, isEnabled: !disabled, width: width))
            .disabled(disabled)
    }
}

public struct BrandDestructiveButton<Label: View>: View {
    private let action: () -> Void
    private let disabled: Bool
    private let width: BrandButtonWidth
    private let label: () -> Label

    public init(
        disabled: Bool = false,
        width: BrandButtonWidth = .fill,
        action: @escaping () -> Void,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.disabled = disabled
        self.width = width
        self.action = action
        self.label = label
    }

    public var body: some View {
        Button(action: action, label: label)
            .buttonStyle(BrandButtonStyle(variant: .destructive, isEnabled: !disabled, width: width))
            .disabled(disabled)
    }
}

// MARK: - Card / input / badge

public struct BrandCard<Content: View>: View {
    private let content: () -> Content

    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: BrandTokens.space2) {
            content()
        }
        .padding(BrandTokens.space4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BrandTokens.surface)
        .overlay(
            RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous)
                .stroke(BrandTokens.borderSubtle.opacity(0.8), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous))
    }
}

public struct BrandTextFieldBackground: ViewModifier {
    public init() {}

    public func body(content: Content) -> some View {
        content
            .padding(BrandTokens.space4)
            .frame(minHeight: BrandTokens.touchMin)
            .background(BrandTokens.surface)
            .overlay(
                RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous)
                    .stroke(BrandTokens.borderSubtle, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusLg, style: .continuous))
            .foregroundStyle(BrandTokens.textPrimary)
    }
}

public extension View {
    func brandFieldChrome() -> some View {
        modifier(BrandTextFieldBackground())
    }
}

public enum BrandBadgeTone {
    case neutral
    case success
    case warning
    case error
    case info
}

public struct BrandBadge: View {
    private let text: String
    private let tone: BrandBadgeTone

    public init(_ text: String, tone: BrandBadgeTone = .neutral) {
        self.text = text
        self.tone = tone
    }

    public var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(foreground)
            .padding(.horizontal, BrandTokens.space2)
            .padding(.vertical, BrandTokens.space1)
            .background(background)
            .clipShape(Capsule())
    }

    private var foreground: Color {
        switch tone {
        case .neutral: return BrandTokens.textSecondary
        case .success: return BrandTokens.stateSuccess
        case .warning: return BrandTokens.stateWarning
        case .error: return BrandTokens.stateError
        case .info: return BrandTokens.stateInfo
        }
    }

    private var background: Color {
        switch tone {
        case .neutral: return BrandTokens.badgeNeutralBg
        case .success: return BrandTokens.badgeSuccessBg
        case .warning: return BrandTokens.badgeWarningBg
        case .error: return BrandTokens.badgeErrorBg
        case .info: return BrandTokens.stateInfo.opacity(0.2)
        }
    }
}

public struct BrandLoadingState: View {
    private let message: String

    public init(_ message: String) {
        self.message = message
    }

    public var body: some View {
        VStack(spacing: BrandTokens.space3) {
            ProgressView()
                .tint(BrandTokens.actionPrimary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(BrandTokens.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .brandPageChrome()
    }
}

public struct BrandEmptyState: View {
    private let title: String
    private let subtitle: String?
    private let actionTitle: String?
    private let action: (() -> Void)?

    public init(
        title: String,
        subtitle: String? = nil,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.actionTitle = actionTitle
        self.action = action
    }

    public var body: some View {
        VStack(spacing: BrandTokens.space3) {
            Image(systemName: "tray")
                .font(.system(size: 48))
                .foregroundStyle(BrandTokens.textTertiary)
            Text(title)
                .font(.headline)
                .foregroundStyle(BrandTokens.textPrimary)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(BrandTokens.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let actionTitle, let action {
                BrandPrimaryButton(width: .hug, action: action) {
                    Text(actionTitle)
                        .padding(.horizontal, BrandTokens.space4)
                }
            }
        }
        .padding(BrandTokens.space8)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

public struct BrandErrorState: View {
    private let message: String
    private let retryTitle: String
    private let retry: (() -> Void)?

    /// - Parameters:
    ///   - retryTitle: Caller-supplied localized string (no English default).
    public init(message: String, retryTitle: String, retry: (() -> Void)? = nil) {
        self.message = message
        self.retryTitle = retryTitle
        self.retry = retry
    }

    public var body: some View {
        VStack(spacing: BrandTokens.space3) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 44))
                .foregroundStyle(BrandTokens.stateWarning)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(BrandTokens.textSecondary)
                .multilineTextAlignment(.center)
            if let retry {
                BrandSecondaryButton(width: .hug, action: retry) {
                    Text(retryTitle)
                        .padding(.horizontal, BrandTokens.space4)
                }
            }
        }
        .padding(BrandTokens.space8)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

public struct BrandOfflineBanner: View {
    private let message: String

    public init(_ message: String) {
        self.message = message
    }

    public var body: some View {
        HStack(spacing: BrandTokens.space2) {
            Image(systemName: "wifi.slash")
            Text(message)
                .font(.subheadline)
        }
        .foregroundStyle(BrandTokens.stateWarning)
        .padding(BrandTokens.space3)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BrandTokens.badgeWarningBg)
        .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusMd, style: .continuous))
    }
}

public struct BrandSkeletonBlock: View {
    private let height: CGFloat

    public init(height: CGFloat = 16) {
        self.height = height
    }

    public var body: some View {
        RoundedRectangle(cornerRadius: BrandTokens.radiusSm, style: .continuous)
            .fill(BrandTokens.skeletonLine)
            .frame(height: height)
            .frame(maxWidth: .infinity)
    }
}

/// Brand mark for dark surfaces (uses asset catalog image named `BrandHelmet` when present).
public struct BrandMark: View {
    private let size: CGFloat

    public init(size: CGFloat = 56) {
        self.size = size
    }

    public var body: some View {
        Group {
            if UIImage(named: "BrandHelmet") != nil {
                Image("BrandHelmet")
                    .resizable()
                    .scaledToFit()
            } else {
                Image(systemName: "hardhat.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(BrandTokens.actionPrimary)
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// Photo / Async-style image chrome: consistent radius + loading/error surfaces.
public struct BrandMediaFrame<Content: View>: View {
    private let content: () -> Content

    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    public var body: some View {
        content()
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous)
                    .stroke(BrandTokens.borderSubtle, lineWidth: 1)
            )
    }
}
