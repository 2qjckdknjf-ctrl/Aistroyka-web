package com.aistroyka.shared.repository.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.aistroyka.shared.repository.database.dao.OperationDao
import com.aistroyka.shared.repository.database.dao.AppStateDao
import com.aistroyka.shared.repository.database.entity.OperationEntity
import com.aistroyka.shared.repository.database.entity.AppStateEntity

@Database(
    entities = [OperationEntity::class, AppStateEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun operationDao(): OperationDao
    abstract fun appStateDao(): AppStateDao
}
