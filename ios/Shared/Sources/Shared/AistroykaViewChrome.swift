//
//  AistroykaViewChrome.swift
//  Shared
//
//  Canon v4 graphite page chrome helpers for List/Form surfaces.
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

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

    /// Apply muted surface on a List/Form **row** (not the List container).
    public func aistroykaListRowSurface(_ color: Color = AistroykaCanonColors.surfaceMuted) -> some View {
        listRowBackground(color)
    }

    /// Hides UIKit list fill and applies canon page background.
    /// Row fills use UIKit appearance + optional `aistroykaListRowSurface` on rows.
    public func aistroykaListChrome(pageBackground: Color, surfaceMuted: Color) -> some View {
        scrollContentBackground(.hidden)
            .background(pageBackground)
            .onAppear {
                Self.applyCanonListAppearance(pageBackground: pageBackground, surfaceMuted: surfaceMuted)
            }
    }

    /// Same chrome treatment for Form-based screens (login, settings, create flows).
    public func aistroykaFormChrome(pageBackground: Color, surfaceMuted: Color) -> some View {
        scrollContentBackground(.hidden)
            .background(pageBackground)
            .onAppear {
                Self.applyCanonListAppearance(pageBackground: pageBackground, surfaceMuted: surfaceMuted)
            }
    }

    private static func applyCanonListAppearance(pageBackground: Color, surfaceMuted: Color) {
        #if canImport(UIKit)
        UITableView.appearance().backgroundColor = UIColor(pageBackground)
        UITableViewCell.appearance().backgroundColor = UIColor(surfaceMuted)
        #endif
    }
}
#endif
