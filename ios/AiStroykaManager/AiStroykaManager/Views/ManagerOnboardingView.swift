//
//  ManagerOnboardingView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerOnboardingView: View {
    let onComplete: () -> Void

    @State private var page = 0

    init(onComplete: @escaping () -> Void = {}) {
        self.onComplete = onComplete
    }

    var body: some View {
        VStack(spacing: 0) {
            TabView(selection: $page) {
                onboardingPage(
                    tag: 0,
                    titleKey: "mgr_onboard_p1_title",
                    bodyKey: "mgr_onboard_p1_body"
                )
                onboardingPage(
                    tag: 1,
                    titleKey: "mgr_onboard_p2_title",
                    bodyKey: "mgr_onboard_p2_body"
                )
                onboardingPage(
                    tag: 2,
                    titleKey: "mgr_onboard_p3_title",
                    bodyKey: "mgr_onboard_p3_body"
                )
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .frame(maxHeight: .infinity)

            VStack(spacing: 12) {
                Button(action: {
                    ManagerOnboardingPreferences.markIntroCompleted()
                    onComplete()
                }) {
                    Text(NSLocalizedString("mgr_onboard_continue", comment: ""))
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(BrandTokens.actionPrimary)
                        .foregroundStyle(BrandTokens.textOnPrimary)
                        .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard))
                }
                .accessibilityIdentifier("manager_onboarding_continue")

                Button {
                    page = min(page + 1, 2)
                } label: {
                    Text(NSLocalizedString("mgr_onboard_next", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(BrandTokens.textSecondary)
                }
                .disabled(page >= 2)
                .opacity(page >= 2 ? 0 : 1)
            }
            .padding()
        }
        .background(BrandTokens.bgPage)
    }

    private func onboardingPage(tag: Int, titleKey: String, bodyKey: String) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString(titleKey, comment: ""))
                    .font(.title2.bold())
                Text(NSLocalizedString(bodyKey, comment: ""))
                    .font(.body)
                    .foregroundStyle(BrandTokens.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(24)
        }
        .tag(tag)
    }
}

struct ManagerHowItWorksView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Group {
                    bullet("mgr_how_bullet_1")
                    bullet("mgr_how_bullet_2")
                    bullet("mgr_how_bullet_3")
                    bullet("mgr_how_bullet_4")
                    bullet("mgr_how_bullet_5")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
        }
        .background(BrandTokens.bgPage)
        .navigationTitle(NSLocalizedString("mgr_how_title", comment: ""))
        .brandScrollChrome()
        .navigationBarTitleDisplayMode(.inline)
    }

    private func bullet(_ key: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
            Text(NSLocalizedString(key, comment: ""))
                .fixedSize(horizontal: false, vertical: true)
        }
        .font(.subheadline)
    }
}
