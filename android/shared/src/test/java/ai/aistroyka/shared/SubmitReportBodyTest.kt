package ai.aistroyka.shared

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SubmitReportBodyTest {
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
}
