//
//  DesignPreviewRoot.swift
//  Shared
//
//  DEBUG/UITest-only design gallery with deterministic mock states.
//  Activated by launch argument: -DesignPreview <screenId>
//  Optional: -DesignPreviewA11y to force Dynamic Type accessibility3 (no auth bypass).
//

import SwiftUI

public enum DesignPreviewScreen: String, CaseIterable {
    case login
    case first_run
    case home
    case projects
    case tasks
    case reports
    case settings
    case empty
    case error
    case loading
    case offline
    case media
}

public enum DesignPreview {
    public static var screen: DesignPreviewScreen? {
        let args = ProcessInfo.processInfo.arguments
        guard let idx = args.firstIndex(of: "-DesignPreview"), args.indices.contains(idx + 1) else {
            return nil
        }
        return DesignPreviewScreen(rawValue: args[idx + 1])
    }

    /// Forces a large accessibility Dynamic Type size for evidence captures.
    public static var forceAccessibilityType: Bool {
        ProcessInfo.processInfo.arguments.contains("-DesignPreviewA11y")
    }

    public static var isActive: Bool { screen != nil }
}

/// Deterministic branded surfaces for screenshot matrix (no network).
public struct DesignPreviewRoot: View {
    public let screen: DesignPreviewScreen
    public let appTitle: String

    public init(screen: DesignPreviewScreen, appTitle: String) {
        self.screen = screen
        self.appTitle = appTitle
    }

    public var body: some View {
        Group {
            switch screen {
            case .login:
                login
            case .first_run:
                firstRun
            case .home:
                home
            case .projects, .tasks, .reports:
                listSurface(title: screen.rawValue.capitalized)
            case .settings:
                settings
            case .empty:
                BrandEmptyState(title: "Nothing here yet", subtitle: "Deterministic empty state")
            case .error:
                BrandErrorState(
                    message: "Something went wrong (preview)",
                    retryTitle: "Retry (preview)"
                ) {}
            case .loading:
                BrandLoadingState("Loading preview…")
            case .offline:
                VStack {
                    BrandOfflineBanner("You are offline (preview)")
                    Spacer()
                }
                .padding()
            case .media:
                media
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .brandPageChrome()
        .accessibilityIdentifier("design_preview_\(screen.rawValue)")
        .accessibilityElement(children: .contain)
        .environment(
            \.dynamicTypeSize,
            DesignPreview.forceAccessibilityType ? .accessibility3 : .large
        )
        .overlay(alignment: .topTrailing) {
            Text(appTitle)
                .font(.caption2)
                .foregroundStyle(BrandTokens.textTertiary)
                .padding(8)
                .accessibilityIdentifier("design_preview_app_identity")
        }
    }

    private var login: some View {
        VStack(spacing: BrandTokens.space5) {
            BrandMark(size: 72)
            Text(appTitle).font(.title2).foregroundStyle(BrandTokens.textPrimary)
            Text("email@example.com").brandFieldChrome()
            Text("••••••••").brandFieldChrome()
            BrandPrimaryButton(disabled: false, action: {}) { Text("Sign in") }
            BrandPrimaryButton(disabled: true, action: {}) { Text("Sign in (disabled)") }
            BrandSecondaryButton(width: .compact, action: {}) { Text("Toolbar") }
        }
        .padding(BrandTokens.space6)
    }

    private var firstRun: some View {
        BrandCard {
            Text("Welcome").font(.title3).foregroundStyle(BrandTokens.textPrimary)
            Text("First-run guide (separate from clean login)")
                .foregroundStyle(BrandTokens.textSecondary)
            Text("1. Review queues")
            Text("2. Open projects")
            Text("3. Use AI statuses")
            BrandPrimaryButton(action: {}) { Text("Start working") }
        }
        .padding(BrandTokens.space6)
    }

    private var home: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: BrandTokens.space4) {
                Text("Dashboard").font(.title2).foregroundStyle(BrandTokens.textPrimary)
                BrandCard {
                    Text("KPI card").foregroundStyle(BrandTokens.textSecondary)
                    Text("12").font(.title).foregroundStyle(BrandTokens.textPrimary)
                }
                BrandCard {
                    Text("Needs attention").font(.headline)
                    Text("2 overdue tasks").foregroundStyle(BrandTokens.textSecondary)
                }
            }
            .padding()
        }
    }

    private func listSurface(title: String) -> some View {
        List {
            Section(title) {
                ForEach(0..<4, id: \.self) { i in
                    Text("Row \(i + 1)")
                        .foregroundStyle(BrandTokens.textPrimary)
                        .brandListRowSurface()
                }
            }
        }
        .brandScrollChrome()
        .navigationTitle(title)
    }

    private var settings: some View {
        List {
            Section("Account") {
                Text("Signed in").foregroundStyle(BrandTokens.stateSuccess).brandListRowSurface()
            }
            Section("Diagnostics") {
                Text("Client profile").foregroundStyle(BrandTokens.textSecondary).brandListRowSurface()
            }
        }
        .brandScrollChrome()
    }

    private var media: some View {
        VStack(spacing: BrandTokens.space4) {
            BrandMediaFrame {
                ZStack {
                    BrandTokens.surfaceMuted
                    BrandMark(size: 48)
                }
                .frame(height: 180)
            }
            Text("Photo frame preview").foregroundStyle(BrandTokens.textSecondary)
            BrandBadge("Pending review", tone: .warning)
        }
        .padding()
    }
}
