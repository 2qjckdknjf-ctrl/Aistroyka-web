package ai.aistroyka.shared

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SubmitReportBodyTest {
    @Test
    fun createReportOmitsNullOrBlankOptionals() {
        assertFalse(buildCreateReportJson("20260525", null).contains("task_id"))
        assertFalse(buildCreateReportJson("20260525", "   ").contains("task_id"))
        assertFalse(buildCreateReportJson(null, "task-1").contains("day_id"))
    }

    @Test
    fun createReportIncludesPresentFields() {
        val j = buildCreateReportJson(" 20260525 ", " task-1 ")
        assertTrue(j.contains("\"day_id\":\"20260525\""))
        assertTrue(j.contains("\"task_id\":\"task-1\""))
    }

    @Test
    fun omitsTaskIdWhenNullOrBlank() {
        assertFalse(buildSubmitReportJson("r1", null).contains("task_id"))
        assertFalse(buildSubmitReportJson("r1", "   ").contains("task_id"))
    }

    @Test
    fun includesTaskIdWhenPresent() {
        val j = buildSubmitReportJson("r1", "t-42")
        assertTrue(j.contains("\"task_id\":\"t-42\""))
        assertTrue(j.contains("\"report_id\":\"r1\""))
    }

    @Test
    fun omitsWorkerNoteWhenNullOrBlank() {
        assertFalse(buildSubmitReportJson("r1", null, null).contains("worker_note"))
        assertFalse(buildSubmitReportJson("r1", null, "   ").contains("worker_note"))
    }

    @Test
    fun includesWorkerNoteWhenPresent() {
        val j = buildSubmitReportJson("r1", null, " Fixed grout ")
        assertTrue(j.contains("\"worker_note\":\"Fixed grout\""))
    }
}
