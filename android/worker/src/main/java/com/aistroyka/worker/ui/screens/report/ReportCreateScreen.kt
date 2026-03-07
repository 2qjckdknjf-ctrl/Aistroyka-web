package com.aistroyka.worker.ui.screens.report

import android.Manifest
import android.graphics.Bitmap
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.shouldShowRationale

@Composable
fun ReportCreateScreen(
    taskId: String? = null,
    onBack: () -> Unit,
    onReportCreated: () -> Unit,
    viewModel: ReportCreateViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        bitmap?.let { viewModel.captureBeforePhoto(it) }
    }
    
    val beforePhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        bitmap?.let { viewModel.captureBeforePhoto(it) }
    }
    
    val afterPhotoLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        bitmap?.let { viewModel.captureAfterPhoto(it) }
    }
    
    LaunchedEffect(uiState.isReportSubmitted) {
        if (uiState.isReportSubmitted) {
            onReportCreated()
        }
    }
    
    // Auto-create report if taskId provided
    LaunchedEffect(taskId) {
        if (taskId != null && !uiState.isReportCreated) {
            viewModel.createReport(taskId)
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Report") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Report status
            if (uiState.isReportCreated) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Report created. Add photos to continue.")
                    }
                }
            }
            
            // Before photo section
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Before Photo",
                        style = MaterialTheme.typography.titleMedium
                    )
                    
                    when (uiState.beforePhotoPhase) {
                        PhotoUploadService.UploadPhase.QUEUED -> {
                            Button(
                                onClick = {
                                    if (cameraPermissionState.status.isGranted) {
                                        beforePhotoLauncher.launch(null)
                                    } else {
                                        cameraPermissionState.launchPermissionRequest()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Take Before Photo")
                            }
                        }
                        PhotoUploadService.UploadPhase.CREATING_SESSION,
                        PhotoUploadService.UploadPhase.UPLOADING,
                        PhotoUploadService.UploadPhase.FINALIZING,
                        PhotoUploadService.UploadPhase.ATTACHING -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Uploading...")
                            }
                        }
                        PhotoUploadService.UploadPhase.DONE -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Before photo uploaded")
                            }
                        }
                        PhotoUploadService.UploadPhase.FAILED -> {
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Error,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.error
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = uiState.beforePhotoError ?: "Upload failed",
                                        color = MaterialTheme.colorScheme.error
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        // Retry would need the bitmap - for now just show retry option
                                        // In full implementation, store bitmap and retry
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                }
            }
            
            // After photo section
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "After Photo",
                        style = MaterialTheme.typography.titleMedium
                    )
                    
                    when (uiState.afterPhotoPhase) {
                        PhotoUploadService.UploadPhase.QUEUED -> {
                            Button(
                                onClick = {
                                    if (cameraPermissionState.status.isGranted) {
                                        afterPhotoLauncher.launch(null)
                                    } else {
                                        cameraPermissionState.launchPermissionRequest()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Take After Photo")
                            }
                        }
                        PhotoUploadService.UploadPhase.CREATING_SESSION,
                        PhotoUploadService.UploadPhase.UPLOADING,
                        PhotoUploadService.UploadPhase.FINALIZING,
                        PhotoUploadService.UploadPhase.ATTACHING -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Uploading...")
                            }
                        }
                        PhotoUploadService.UploadPhase.DONE -> {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("After photo uploaded")
                            }
                        }
                        PhotoUploadService.UploadPhase.FAILED -> {
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Error,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.error
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = uiState.afterPhotoError ?: "Upload failed",
                                        color = MaterialTheme.colorScheme.error
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        // Retry
                                    },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                }
            }
            
            // Submit button
            Button(
                onClick = { viewModel.submitReport() },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState.canSubmit && !uiState.isSubmitting
            ) {
                if (uiState.isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Submit Report")
                }
            }
            
            uiState.errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
