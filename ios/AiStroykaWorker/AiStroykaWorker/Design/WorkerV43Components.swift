//
//  WorkerV43Components.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct WorkerV43HeroPhoto<Overlay: View>: View {
    var height: CGFloat = 168
    var systemImage: String = "building.2.fill"
    @ViewBuilder var overlay: () -> Overlay

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: [
                    Color(red: 38 / 255, green: 64 / 255, blue: 92 / 255),
                    Color(red: 18 / 255, green: 36 / 255, blue: 58 / 255),
                    Color(red: 8 / 255, green: 16 / 255, blue: 28 / 255),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Image(systemName: systemImage)
                .font(.system(size: 86, weight: .light))
                .foregroundStyle(.white.opacity(0.12))
                .offset(x: 140, y: 18)
            LinearGradient(
                colors: [.clear, WorkerV43.bg.opacity(0.72)],
                startPoint: .top,
                endPoint: .bottom
            )
            overlay()
                .padding(14)
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: WorkerV43.radiusCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: WorkerV43.radiusCard, style: .continuous)
                .stroke(WorkerV43.border, lineWidth: 1)
        )
    }
}

struct WorkerV43PhotoComparisonFrame: View {
    let kind: WorkerPhotoKind
    let captured: UIImage?
    let beforeReference: UIImage?
    let angleOK: Bool?

    private var mode: WorkerPhotoComparisonMode {
        WorkerPhotoComparisonMode.resolve(
            kind: kind,
            hasCaptured: captured != nil,
            hasBeforeReference: beforeReference != nil
        )
    }

    private var frameTint: Color {
        switch angleOK {
        case true:
            return WorkerV43.success
        case false:
            return WorkerV43.warning
        case nil:
            return kind == .after ? WorkerV43.yellow : WorkerV43.border
        }
    }

    var body: some View {
        ZStack {
            switch mode {
            case .split:
                if let captured, let beforeReference {
                    HStack(spacing: 3) {
                        pane(beforeReference, caption: NSLocalizedString("wrk_v43_compare_before", comment: ""))
                        pane(captured, caption: NSLocalizedString("wrk_v43_compare_after", comment: ""))
                    }
                    .accessibilityIdentifier("pilot_worker_camera_split")
                }
            case .capturedOnly:
                if let captured {
                    Image(uiImage: captured)
                        .resizable()
                        .scaledToFill()
                }
            case .ghostBefore:
                ghost
            case .placeholder:
                placeholder
            }
        }
        .frame(maxWidth: .infinity, minHeight: 280)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(frameTint, lineWidth: kind == .after ? 1.5 : 1)
        )
    }

    private var ghost: some View {
        ZStack {
            if let beforeReference {
                Image(uiImage: beforeReference)
                    .resizable()
                    .scaledToFill()
                    .opacity(0.4)
            }
            LinearGradient(
                colors: [.clear, WorkerV43.bg.opacity(0.55)],
                startPoint: .center,
                endPoint: .bottom
            )
            VStack(spacing: 8) {
                Image(systemName: "camera.viewfinder")
                    .font(.system(size: 28))
                    .foregroundStyle(WorkerV43.yellow)
                Text(NSLocalizedString("wrk_v43_repeat_angle", comment: ""))
                    .foregroundStyle(WorkerV43.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }

    private var placeholder: some View {
        ZStack {
            WorkerV43.cardStrong
            VStack(spacing: 8) {
                Image(systemName: "camera.viewfinder")
                    .font(.system(size: 28))
                    .foregroundStyle(WorkerV43.yellow)
                Text(kind == .after
                     ? NSLocalizedString("wrk_v43_repeat_angle", comment: "")
                     : NSLocalizedString("wrk_v43_capture_overview", comment: ""))
                    .foregroundStyle(WorkerV43.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }

    private func pane(_ image: UIImage, caption: String) -> some View {
        ZStack(alignment: .bottomLeading) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
            Text(caption)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(WorkerV43.bg.opacity(0.72))
                .clipShape(Capsule())
                .padding(8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
    }
}

struct WorkerV43Card<Content: View>: View {
    var padding: CGFloat = WorkerV43.space4
    var radius: CGFloat = WorkerV43.radiusCard
    var borderColor: Color = WorkerV43.border
    var fill: Color = WorkerV43.card
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(fill)
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
    }
}

struct WorkerV43Chip: View {
    let title: String
    var selected: Bool
    var tint: Color = WorkerV43.yellow
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(selected ? WorkerV43.yellowInk : WorkerV43.textPrimary)
                .padding(.horizontal, 12)
                .frame(minHeight: 36)
                .background(selected ? tint : WorkerV43.cardStrong)
                .overlay(Capsule().stroke(selected ? tint : WorkerV43.border, lineWidth: 1))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .frame(minHeight: WorkerV43.touch)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

struct WorkerV43StatusPill: View {
    enum Kind { case success, warning, danger, info, ai, neutral }
    let text: String
    var kind: Kind = .neutral
    var systemImage: String?

    var body: some View {
        HStack(spacing: 4) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.system(size: 10, weight: .semibold))
            }
            Text(text)
                .font(.system(size: 12, weight: .semibold))
        }
        .foregroundStyle(foreground)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(foreground.opacity(0.16))
        .overlay(Capsule().stroke(foreground.opacity(0.55), lineWidth: 1))
        .clipShape(Capsule())
        .accessibilityLabel(text)
    }

    private var foreground: Color {
        switch kind {
        case .success: return WorkerV43.success
        case .warning: return WorkerV43.warning
        case .danger: return WorkerV43.danger
        case .info: return WorkerV43.dataBlue
        case .ai: return WorkerV43.aiViolet
        case .neutral: return WorkerV43.textSecondary
        }
    }
}

struct WorkerV43PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var enabled: Bool = true
    var loading: Bool = false
    var fill: Color = WorkerV43.yellow
    var ink: Color = WorkerV43.yellowInk
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if loading { ProgressView().tint(ink) }
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .multilineTextAlignment(.center)
            }
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity)
            .frame(minHeight: WorkerV43.ctaHeight)
            .background(enabled ? fill : fill.opacity(0.45))
            .clipShape(RoundedRectangle(cornerRadius: WorkerV43.radiusControl, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!enabled || loading)
        .opacity((enabled && !loading) ? 1 : 0.7)
        .frame(minHeight: WorkerV43.fieldTouch)
    }
}

struct WorkerV43OutlineButton: View {
    let title: String
    var systemImage: String? = nil
    var tint: Color = WorkerV43.yellow
    var enabled: Bool = true
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).font(.system(size: 16, weight: .semibold))
            }
            .foregroundStyle(tint)
            .frame(maxWidth: .infinity)
            .frame(minHeight: WorkerV43.ctaHeight)
            .overlay(
                RoundedRectangle(cornerRadius: WorkerV43.radiusControl, style: .continuous)
                    .stroke(tint, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.5)
    }
}

struct WorkerV43OfflineBanner: View {
    var queued: Int = 0
    var lastSync: Date?
    var retry: (() -> Void)?

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "wifi.slash")
                .foregroundStyle(WorkerV43.yellow)
            VStack(alignment: .leading, spacing: 2) {
                Text(NSLocalizedString("wrk_v43_offline_banner", comment: ""))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                if queued > 0 {
                    Text(String(format: NSLocalizedString("wrk_v43_queue_count_fmt", comment: ""), queued))
                        .font(.system(size: 12))
                        .foregroundStyle(WorkerV43.yellow)
                }
            }
            Spacer()
            if let retry {
                Button(NSLocalizedString("worker_retry", comment: ""), action: retry)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(WorkerV43.yellow)
            }
        }
        .padding(12)
        .background(WorkerV43.yellow.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

struct WorkerV43SyncPill: View {
    let status: String
    var kind: WorkerV43StatusPill.Kind = .success

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: kind == .success ? "checkmark.icloud.fill" : "icloud")
                .foregroundStyle(kind == .success ? WorkerV43.success : WorkerV43.warning)
            Text(status)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(WorkerV43.textPrimary)
                .lineLimit(1)
        }
        .padding(.horizontal, 12)
        .frame(minHeight: 36)
        .background(WorkerV43.cardStrong)
        .clipShape(Capsule())
    }
}

struct WorkerV43ProgressRing: View {
    var progress: Double
    var lineWidth: CGFloat = 8
    var size: CGFloat = 64
    var tint: Color = WorkerV43.dataBlue
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let clamped = WorkerV43Formatters.clampedProgress(progress)
        ZStack {
            Circle().stroke(WorkerV43.border, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: clamped)
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(reduceMotion ? nil : .easeOut(duration: 0.7), value: clamped)
            Text(WorkerV43Formatters.percentLabel(clamped))
                .font(.system(size: size > 70 ? 18 : 13, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
        }
        .frame(width: size, height: size)
        .accessibilityLabel(NSLocalizedString("wrk_v43_progress", comment: ""))
        .accessibilityValue(WorkerV43Formatters.percentLabel(clamped))
    }
}

struct WorkerV43Skeleton: View {
    var height: CGFloat = 72
    var body: some View {
        RoundedRectangle(cornerRadius: WorkerV43.radiusCard, style: .continuous)
            .fill(WorkerV43.cardStrong)
            .frame(height: height)
            .redacted(reason: .placeholder)
    }
}

struct WorkerV43EmptyState: View {
    let title: String
    var detail: String?
    var systemImage: String = "tray"
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 28))
                .foregroundStyle(WorkerV43.textSecondary)
            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
                .multilineTextAlignment(.center)
            if let detail {
                Text(detail)
                    .font(.system(size: 15))
                    .foregroundStyle(WorkerV43.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let retry {
                Button(NSLocalizedString("worker_retry", comment: ""), action: retry)
                    .foregroundStyle(WorkerV43.yellow)
                    .frame(minHeight: WorkerV43.touch)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
    }
}

struct WorkerV43Row: View {
    let title: String
    var subtitle: String?
    var systemImage: String
    var iconTint: Color = WorkerV43.dataBlue
    var trailing: String?
    var badge: String?
    var badgeTint: Color = WorkerV43.dataBlue
    var action: (() -> Void)?

    var body: some View {
        Button(action: { action?() }) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(iconTint)
                    .frame(width: 32, height: 32)
                    .background(iconTint.opacity(0.16))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(WorkerV43.textPrimary)
                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(WorkerV43.textSecondary)
                    }
                }
                Spacer()
                if let badge {
                    Text(badge)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(badgeTint)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(badgeTint.opacity(0.16))
                        .clipShape(Capsule())
                }
                if let trailing {
                    Text(trailing)
                        .font(.system(size: 13))
                        .foregroundStyle(WorkerV43.cyan)
                }
                if action != nil {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(WorkerV43.textSecondary)
                }
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(action == nil)
        .frame(minHeight: WorkerV43.fieldTouch)
    }
}

struct WorkerV43TabBar: View {
    @Binding var selected: WorkerTab
    var cameraAction: () -> Void
    @ObservedObject private var inboxBadge = WorkerInboxBadgeStore.shared

    private var messagesBadge: Int { inboxBadge.count }

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            tab(.today, title: NSLocalizedString("wrk_v43_tab_today", comment: ""), image: "house")
            tab(.tasks, title: NSLocalizedString("wrk_v43_tab_tasks", comment: ""), image: "checklist")
            Button(action: cameraAction) {
                ZStack {
                    Circle().fill(WorkerV43.yellow).frame(width: 58, height: 58)
                    Image(systemName: "camera.fill")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(WorkerV43.yellowInk)
                }
            }
            .buttonStyle(.plain)
            .offset(y: -10)
            .accessibilityLabel(NSLocalizedString("wrk_v43_tab_camera", comment: ""))
            .accessibilityIdentifier("pilot_worker_tab_camera")
            tab(.messages, title: NSLocalizedString("wrk_v43_tab_messages", comment: ""), image: "bubble.left")
            tab(.more, title: NSLocalizedString("wrk_v43_tab_more", comment: ""), image: "ellipsis")
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) { WorkerV43.border.frame(height: 0.5) }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("pilot_worker_tab_bar")
    }

    private func tab(_ tab: WorkerTab, title: String, image: String) -> some View {
        let on = selected == tab
        return Button {
            selected = tab
        } label: {
            VStack(spacing: 4) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: on ? "\(image).fill" : image)
                        .font(.system(size: 18, weight: .medium))
                    if tab == .messages && messagesBadge > 0 {
                        Text(messagesBadge > 99 ? "99+" : "\(messagesBadge)")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(WorkerV43.danger)
                            .clipShape(Capsule())
                            .offset(x: 10, y: -6)
                    }
                }
                Text(title)
                    .font(.system(size: 11, weight: on ? .semibold : .regular))
                Capsule()
                    .fill(on ? WorkerV43.yellow : .clear)
                    .frame(width: 22, height: 3)
            }
            .foregroundStyle(on ? WorkerV43.yellow : WorkerV43.textSecondary)
            .frame(maxWidth: .infinity)
            .frame(minHeight: WorkerV43.fieldTouch)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : .isButton)
        .accessibilityIdentifier("pilot_worker_tab_\(tab.rawValue)")
    }
}
