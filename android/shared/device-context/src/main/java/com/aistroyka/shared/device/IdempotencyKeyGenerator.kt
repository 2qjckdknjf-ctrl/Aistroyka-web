package com.aistroyka.shared.device

import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Generates idempotency keys for write operations
 * Matching iOS idempotency key generation
 */
@Singleton
class IdempotencyKeyGenerator @Inject constructor() {
    fun generate(): String {
        return UUID.randomUUID().toString()
    }
}
