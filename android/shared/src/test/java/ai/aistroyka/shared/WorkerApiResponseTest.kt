package ai.aistroyka.shared

import org.junit.Assert.assertEquals
import org.junit.Test

class WorkerApiResponseTest {
    @Test
    fun decodesWorkerDayIdFromStartDayResponse() {
        val json = """{"data":{"id":"8b9b2bd4-0f33-43fd-a8b4-c540c4597486","day_date":"2026-05-22"}}"""

        val response = ApiClient.json.decodeFromString(
            WorkerDayResponse.serializer(),
            json,
        )

        assertEquals("8b9b2bd4-0f33-43fd-a8b4-c540c4597486", response.data?.id)
    }
}
