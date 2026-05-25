package ai.aistroyka.shared

import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** JSON body for POST /api/v1/worker/report/create — omits optional fields when absent (Zod rejects null). */
fun buildCreateReportJson(dayId: String?, taskId: String?): String =
    buildJsonObject {
        val d = dayId?.trim()
        if (!d.isNullOrEmpty()) put("day_id", d)
        val t = taskId?.trim()
        if (!t.isNullOrEmpty()) put("task_id", t)
    }.toString()

/** JSON body for POST /api/v1/worker/report/submit — omits `task_id` / `worker_note` when absent (Zod rejects null). */
fun buildSubmitReportJson(reportId: String, taskId: String?, workerNote: String? = null): String =
    buildJsonObject {
        put("report_id", reportId)
        val t = taskId?.trim()
        if (!t.isNullOrEmpty()) put("task_id", t)
        val n = workerNote?.trim()
        if (!n.isNullOrEmpty()) put("worker_note", n)
    }.toString()
