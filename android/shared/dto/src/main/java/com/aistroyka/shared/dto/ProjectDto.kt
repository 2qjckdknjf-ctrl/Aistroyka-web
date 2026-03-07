package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Project DTO matching backend contract
 */
data class ProjectDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("created_at")
    val createdAt: String?
)

data class ProjectsListResponse(
    @SerializedName("data")
    val data: List<ProjectDto>
)

data class CreateProjectRequest(
    @SerializedName("name")
    val name: String
)

data class CreateProjectResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: ProjectIdResponse
)

data class ProjectIdResponse(
    @SerializedName("id")
    val id: String
)
