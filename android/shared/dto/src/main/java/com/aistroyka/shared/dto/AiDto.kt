package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * AI DTOs matching backend contract
 */
data class AnalyzeImageRequest(
    @SerializedName("image_url")
    val imageUrl: String,
    @SerializedName("prompt")
    val prompt: String?
)

data class AnalysisResult(
    @SerializedName("analysis")
    val analysis: String,
    @SerializedName("confidence")
    val confidence: Double?,
    @SerializedName("tags")
    val tags: List<String>?
)

data class AnalyzeImageResponse(
    @SerializedName("data")
    val data: AnalysisResult
)
