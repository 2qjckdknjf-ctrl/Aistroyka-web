package com.aistroyka.shared.tenant

import com.aistroyka.shared.dto.AuthUser

/**
 * Tenant context matching backend TenantContext
 * Extracted from JWT and config
 */
data class TenantContext(
    val tenantId: String,
    val userId: String,
    val role: Role,
    val subscriptionTier: String?,
    val clientProfile: String, // "android_full" | "android_lite"
    val traceId: String?,
    val user: AuthUser
)

enum class Role {
    OWNER,
    ADMIN,
    MEMBER,
    VIEWER
}

fun Role.canManageProjects(): Boolean {
    return this == Role.OWNER || this == Role.ADMIN || this == Role.MEMBER
}

fun Role.canManageTasks(): Boolean {
    return this == Role.OWNER || this == Role.ADMIN || this == Role.MEMBER
}

fun Role.canCreateReports(): Boolean {
    return this != Role.VIEWER
}

fun Role.canReviewReports(): Boolean {
    return this == Role.OWNER || this == Role.ADMIN || this == Role.MEMBER
}
