package com.aistroyka.shared.repository.database

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "aistroyka_database"
        )
            .fallbackToDestructiveMigration() // For development
            .build()
    }
    
    @Provides
    fun provideOperationDao(database: AppDatabase) = database.operationDao()
    
    @Provides
    fun provideAppStateDao(database: AppDatabase) = database.appStateDao()
}
