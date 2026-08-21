//
//  AistroykaViewChrome.swift
//  Shared
//
//  Canon v4 graphite page chrome helpers for List/Form surfaces.
//

import SwiftUI

public enum AistroykaCanonColors {
    public static let pageBackground = Color(red: 11.0 / 255.0, green: 15.0 / 255.0, blue: 25.0 / 255.0)
    public static let surfaceMuted = Color(red: 31.0 / 255.0, green: 41.0 / 255.0, blue: 55.0 / 255.0)
    public static let onPrimary = Color(red: 11.0 / 255.0, green: 15.0 / 255.0, blue: 25.0 / 255.0)
}

#if os(iOS)
@available(iOS 16.0, *)
extension View {
    /// Full-screen graphite canvas behind scrollable content.
    public func aistroykaPageBackground(_ color: Color) -> some View {
        background(color.ignoresSafeArea())
    }

    /// Hides UIKit list fill and applies canon page + muted row surfaces.
    public func aistroykaListChrome(pageBackground: Color, surfaceMuted: Color) -> some View {
        scrollContentBackground(.hidden)
            .background(pageBackground)
            .listRowBackground(surfaceMuted)
    }

    /// Same chrome treatment for Form-based screens (login, settings, create flows).
    public func aistroykaFormChrome(pageBackground: Color, surfaceMuted: Color) -> some View {
        scrollContentBackground(.hidden)
            .background(pageBackground)
            .listRowBackground(surfaceMuted)
    }
}
#endif
