//
//  BrandAppleSignInStyle.swift
//  Shared
//

import AuthenticationServices
import SwiftUI

public struct BrandAppleSignInStyle: ViewModifier {
    public init() {}

    public func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.signInWithAppleButtonStyle(.whiteOutline)
        } else {
            // Official dark-background style on iOS 16.
            content.signInWithAppleButtonStyle(.white)
        }
    }
}

public extension View {
    func brandAppleSignInStyle() -> some View {
        modifier(BrandAppleSignInStyle())
    }
}
