//
//  PublicLegalLinks.swift
//  Shared
//

import SwiftUI

/// Tappable Privacy / Terms links to the live public site. Does not invent legal copy.
public struct PublicLegalLinks: View {
    let privacyTitle: String
    let termsTitle: String

    public init(privacyTitle: String, termsTitle: String) {
        self.privacyTitle = privacyTitle
        self.termsTitle = termsTitle
    }

    public var body: some View {
        HStack(spacing: 16) {
            if let url = Config.privacyPolicyURL {
                Link(privacyTitle, destination: url)
                    .accessibilityIdentifier("pilot_legal_privacy")
            }
            if let url = Config.termsOfServiceURL {
                Link(termsTitle, destination: url)
                    .accessibilityIdentifier("pilot_legal_terms")
            }
        }
        .font(.system(size: 12, weight: .medium))
    }
}
