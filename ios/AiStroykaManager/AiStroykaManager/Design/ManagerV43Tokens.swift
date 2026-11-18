//
//  ManagerV43Tokens.swift
//  AiStroykaManager
//
//  iOS Manager V4.3 visual tokens (DESIGN_SYSTEM.md). Manager-only; Worker keeps Shared chrome.
//

import SwiftUI

enum ManagerV43 {
    static let bg = Color(red: 3 / 255, green: 11 / 255, blue: 22 / 255)
    static let elevated = Color(red: 7 / 255, green: 20 / 255, blue: 37 / 255)
    static let card = Color(red: 9 / 255, green: 24 / 255, blue: 42 / 255)
    static let cardStrong = Color(red: 13 / 255, green: 32 / 255, blue: 54 / 255)
    static let border = Color(red: 32 / 255, green: 54 / 255, blue: 80 / 255).opacity(0.7)
    static let textPrimary = Color(red: 244 / 255, green: 247 / 255, blue: 252 / 255)
    static let textSecondary = Color(red: 154 / 255, green: 168 / 255, blue: 188 / 255)
    static let yellow = Color(red: 255 / 255, green: 196 / 255, blue: 0 / 255)
    static let yellowInk = Color(red: 5 / 255, green: 11 / 255, blue: 28 / 255)
    static let dataBlue = Color(red: 37 / 255, green: 151 / 255, blue: 255 / 255)
    static let cyan = Color(red: 34 / 255, green: 199 / 255, blue: 242 / 255)
    static let aiViolet = Color(red: 139 / 255, green: 92 / 255, blue: 246 / 255)
    static let success = Color(red: 39 / 255, green: 211 / 255, blue: 107 / 255)
    static let warning = Color(red: 255 / 255, green: 159 / 255, blue: 10 / 255)
    static let danger = Color(red: 255 / 255, green: 69 / 255, blue: 58 / 255)

    static let space1: CGFloat = 4
    static let space2: CGFloat = 8
    static let space3: CGFloat = 12
    static let space4: CGFloat = 16
    static let space5: CGFloat = 20
    static let space6: CGFloat = 24
    static let space8: CGFloat = 32
    static let screenX: CGFloat = 16
    static let touch: CGFloat = 44
    static let radiusCard: CGFloat = 16
    static let radiusLarge: CGFloat = 20
    static let radiusControl: CGFloat = 14
    static let radiusChip: CGFloat = 10
    static let motion: Double = 0.22
}
