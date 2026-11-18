//
//  CustomerAuthGate.swift
//  Shared
//
//  Pure role gate for AiStroyka Customer. Contractor roles belong in Manager.
//

import Foundation

public enum CustomerAuthGate: Sendable {
    public static let allowedRoles: Set<String> = ["stakeholder"]

    /// Customer app may continue only for an active customer/stakeholder role from GET /api/v1/me.
    public static func allowsCustomerSession(role: String?) -> Bool {
        guard let role else { return false }
        return allowedRoles.contains(role.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
    }

    public static func contractorRoleUsingWrongApp(_ role: String?) -> Bool {
        guard let role else { return false }
        let normalized = role.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return ["owner", "admin", "member"].contains(normalized)
    }
}
