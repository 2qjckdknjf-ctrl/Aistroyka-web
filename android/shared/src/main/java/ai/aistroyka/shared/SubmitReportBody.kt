package ai.aistroyka.shared

import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** JSON body for POST /api/v1/worker/report/submit — omits `task_id` when absent (Zod `.optional()` rejects null). */
fun buildSubmitReportJson(reportId: String, taskId: String?): String =
    buildJsonObject {
        put("report_id", reportId)
        val t = taskId?.trim()
        if (!t.isNullOrEmpty()) put("task_id", t)
    }.toString()
