//
//  ManagerV43Components.swift
//  AiStroykaManager
//

import SwiftUI
import Shared

struct ManagerProgressRing: View {
    var progress: Double
    var lineWidth: CGFloat = 10
    var size: CGFloat = 88
    var tint: Color = ManagerV43.dataBlue
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let clamped = ManagerV43Formatters.clampedProgress(progress)
        ZStack {
            Circle()
                .stroke(ManagerV43.border, lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: clamped)
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(reduceMotion ? nil : .easeOut(duration: 0.7), value: clamped)
            VStack(spacing: 2) {
                Text(ManagerV43Formatters.percentLabel(clamped))
                    .font(.system(size: size > 80 ? 22 : 16, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(NSLocalizedString("mgr_v43_progress", comment: ""))
        .accessibilityValue(ManagerV43Formatters.percentLabel(clamped))
    }
}

struct ManagerV43Card<Content: View>: View {
    var padding: CGFloat = ManagerV43.space4
    var radius: CGFloat = ManagerV43.radiusCard
    var borderColor: Color = ManagerV43.border
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(ManagerV43.card)
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(borderColor, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
    }
}

struct ManagerV43Chip: View {
    let title: String
    var selected: Bool
    var tint: Color = ManagerV43.yellow
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(selected ? ManagerV43.yellowInk : ManagerV43.textPrimary)
                .padding(.horizontal, 12)
                .frame(minHeight: 36)
                .background(selected ? tint : ManagerV43.cardStrong)
                .overlay(
                    Capsule().stroke(selected ? tint : ManagerV43.border, lineWidth: 1)
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .frame(minHeight: ManagerV43.touch)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

struct ManagerV43StatusPill: View {
    enum Kind { case success, warning, danger, info, ai, neutral }
    let text: String
    var kind: Kind = .neutral

    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(foreground)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(foreground.opacity(0.16))
            .clipShape(Capsule())
            .accessibilityLabel(text)
    }

    private var foreground: Color {
        switch kind {
        case .success: return ManagerV43.success
        case .warning: return ManagerV43.warning
        case .danger: return ManagerV43.danger
        case .info: return ManagerV43.dataBlue
        case .ai: return ManagerV43.aiViolet
        case .neutral: return ManagerV43.textSecondary
        }
    }
}

struct ManagerV43PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var enabled: Bool = true
    var loading: Bool = false
    var fill: Color = ManagerV43.yellow
    var ink: Color = ManagerV43.yellowInk
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
            }
            .foregroundStyle(ink)
            .frame(maxWidth: .infinity)
            .frame(minHeight: ManagerV43.touch)
            .background(enabled ? fill : fill.opacity(0.45))
            .clipShape(RoundedRectangle(cornerRadius: ManagerV43.radiusControl, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!enabled || loading)
        .opacity((enabled && !loading) ? 1 : 0.7)
    }
}

struct ManagerV43OfflineBanner: View {
    var lastSync: Date?
    var retry: (() -> Void)?

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "wifi.slash")
                .foregroundStyle(ManagerV43.warning)
            VStack(alignment: .leading, spacing: 2) {
                Text(NSLocalizedString("mgr_v43_offline", comment: ""))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                if let lastSync {
                    Text(String(format: NSLocalizedString("mgr_v43_last_sync_fmt", comment: ""), ManagerV43Formatters.relativeTime(lastSync)))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
            Spacer()
            if let retry {
                Button(NSLocalizedString("mgr_retry", comment: ""), action: retry)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ManagerV43.yellow)
                    .frame(minHeight: ManagerV43.touch)
            }
        }
        .padding(12)
        .background(ManagerV43.warning.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

struct ManagerSiteImage: View {
    var name: String = "DemoSiteNight"
    var height: CGFloat = 168
    var allowDemoOnLive: Bool = false

    var body: some View {
        Group {
            if ManagerV43Preview.isEnabled || allowDemoOnLive {
                Image(name)
                    .resizable()
                    .scaledToFill()
            } else {
                LinearGradient(
                    colors: [ManagerV43.cardStrong, ManagerV43.bg],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .overlay {
                    Image(systemName: "building.2.fill")
                        .font(.largeTitle)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .clipped()
        .overlay(
            LinearGradient(
                colors: [.black.opacity(0.15), .black.opacity(0.72)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .accessibilityHidden(true)
    }
}

struct ManagerSiteThumb: View {
    var size: CGSize = CGSize(width: 72, height: 72)
    var corner: CGFloat = 12

    var body: some View {
        Group {
            if ManagerV43Preview.isEnabled {
                Image("DemoSiteNight")
                    .resizable()
                    .scaledToFill()
            } else {
                ZStack {
                    ManagerV43.cardStrong
                    Image(systemName: "building.2.fill")
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
        }
        .frame(width: size.width, height: size.height)
        .clipShape(RoundedRectangle(cornerRadius: corner, style: .continuous))
        .accessibilityHidden(true)
    }
}

struct ManagerAIBadge: View {
    var size: CGFloat = 36
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Text("AI")
            .font(.system(size: size * 0.32, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(
                Circle().fill(
                    LinearGradient(colors: [ManagerV43.aiViolet, ManagerV43.dataBlue], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
            )
            .overlay(Circle().stroke(ManagerV43.aiViolet.opacity(0.7), lineWidth: 1))
            .opacity(reduceMotion ? 1 : 1)
            .accessibilityLabel(NSLocalizedString("mgr_tab_ai", comment: ""))
    }
}

struct ManagerScreenHeader: View {
    let title: String
    var subtitle: String? = nil
    var showsAvatar: Bool = true
    var showsBell: Bool = false
    var unread: Int = 0
    var onBell: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .minimumScaleFactor(0.8)
                    .lineLimit(1)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 13))
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
            Spacer()
            if showsBell {
                Button(action: { onBell?() }) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bell")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ManagerV43.textPrimary)
                            .frame(width: ManagerV43.touch, height: ManagerV43.touch)
                        if unread > 0 {
                            Text(unread > 9 ? "9+" : "\(unread)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(4)
                                .background(ManagerV43.danger)
                                .clipShape(Circle())
                                .offset(x: -6, y: 6)
                        }
                    }
                }
                .accessibilityLabel(NSLocalizedString("mgr_notifications", comment: ""))
            }
            if showsAvatar {
                Circle()
                    .fill(ManagerV43.cardStrong)
                    .frame(width: 36, height: 36)
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundStyle(ManagerV43.textSecondary)
                    )
                    .accessibilityHidden(true)
            }
        }
        .padding(.horizontal, ManagerV43.screenX)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }
}

struct ManagerDateStrip: View {
    let days: [Date]
    @Binding var selected: Date
    private let calendar = Calendar.current

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(days, id: \.self) { day in
                    let isOn = calendar.isDate(day, inSameDayAs: selected)
                    Button {
                        withAnimation(.easeInOut(duration: ManagerV43.motion)) { selected = day }
                    } label: {
                        VStack(spacing: 4) {
                            Text(weekday(day))
                                .font(.system(size: 12, weight: .medium))
                            Text(dayNumber(day))
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundStyle(isOn ? ManagerV43.yellowInk : ManagerV43.textPrimary)
                        .frame(width: 56, height: 64)
                        .background(isOn ? ManagerV43.yellow : ManagerV43.card)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(day.formatted(date: .complete, time: .omitted))
                    .accessibilityAddTraits(isOn ? .isSelected : [])
                }
            }
            .padding(.horizontal, ManagerV43.screenX)
        }
    }

    private func weekday(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = .current
        f.dateFormat = "EEE"
        return f.string(from: date)
    }

    private func dayNumber(_ date: Date) -> String {
        "\(calendar.component(.day, from: date))"
    }
}

struct ManagerSkeletonBlock: View {
    var height: CGFloat = 88
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false

    var body: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(ManagerV43.cardStrong)
            .frame(height: height)
            .opacity(reduceMotion ? 0.7 : (pulse ? 0.55 : 0.9))
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
            .accessibilityLabel(NSLocalizedString("mgr_loading", comment: ""))
    }
}

struct ManagerV43TabBar: View {
    @Binding var selection: ManagerTab
    var tasksBadge: Int = 0

    var body: some View {
        HStack(spacing: 0) {
            tab(.home, NSLocalizedString("mgr_tab_home", comment: ""), "house.fill", "pilot_manager_tab_home")
            tab(.projects, NSLocalizedString("mgr_tab_projects", comment: ""), "folder.fill", "pilot_manager_tab_projects")
            tab(.tasks, NSLocalizedString("mgr_tab_tasks", comment: ""), "checkmark.circle.fill", "pilot_manager_tab_tasks", badge: tasksBadge)
            aiTab
            tab(.more, NSLocalizedString("mgr_tab_more", comment: ""), "ellipsis", "pilot_manager_tab_more")
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .background(ManagerV43.elevated)
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(ManagerV43.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.28), radius: 16, y: 6)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("pilot_manager_tab_shell")
    }

    private func tab(_ value: ManagerTab, _ title: String, _ icon: String, _ identifier: String, badge: Int = 0) -> some View {
        let selected = selection == value
        return Button {
            withAnimation(.easeInOut(duration: ManagerV43.motion)) { selection = value }
        } label: {
            VStack(spacing: 4) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .frame(width: ManagerV43.touch, height: 28)
                    if badge > 0 {
                        Text(badge > 9 ? "9+" : "\(badge)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .background(ManagerV43.danger)
                            .clipShape(Capsule())
                            .offset(x: 8, y: -4)
                    }
                }
                Text(title)
                    .font(.system(size: 11, weight: selected ? .semibold : .regular))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Rectangle()
                    .fill(selected ? ManagerV43.yellow : Color.clear)
                    .frame(height: 2)
                    .padding(.horizontal, 10)
            }
            .foregroundStyle(selected ? ManagerV43.yellow : ManagerV43.textSecondary)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 56)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
        .accessibilityIdentifier(identifier)
    }

    private var aiTab: some View {
        let selected = selection == .ai
        return Button {
            withAnimation(.easeInOut(duration: ManagerV43.motion)) { selection = .ai }
        } label: {
            VStack(spacing: 4) {
                ManagerAIBadge(size: 26)
                    .opacity(selected ? 1 : 0.78)
                    .accessibilityHidden(true)
                Text(NSLocalizedString("mgr_tab_ai", comment: ""))
                    .font(.system(size: 11, weight: selected ? .semibold : .regular))
                    .lineLimit(1)
                Rectangle()
                    .fill(selected ? ManagerV43.yellow : Color.clear)
                    .frame(height: 2)
                    .padding(.horizontal, 10)
            }
            .foregroundStyle(selected ? ManagerV43.yellow : ManagerV43.textSecondary)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 56)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(NSLocalizedString("mgr_tab_ai", comment: ""))
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
        .accessibilityIdentifier("pilot_manager_tab_ai")
    }
}
