package com.aistroyka.manager.ui.screens.tasks

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun TaskDetailScreen(
    taskId: String,
    onBack: () -> Unit,
    viewModel: TaskDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(taskId) {
        viewModel.loadTask(taskId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Task Details") },
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
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            } else {
                uiState.task?.let { task ->
                    // Task info
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.headlineMedium
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Status: ${task.status}")
                            task.projectId?.let {
                                Text("Project ID: $it")
                            }
                            task.dueDate?.let {
                                Text("Due: $it")
                            }
                            task.assignedTo?.let {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.Person,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Assigned to: $it")
                                }
                            }
                        }
                    }
                    
                    // Assign task section
                    if (uiState.canAssign) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Assign Task",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                OutlinedTextField(
                                    value = uiState.assignToUserId,
                                    onValueChange = viewModel::updateAssignToUserId,
                                    label = { Text("User ID") },
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Button(
                                    onClick = { viewModel.assignTask(taskId) },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = uiState.assignToUserId.isNotBlank()
                                ) {
                                    Text("Assign")
                                }
                            }
                        }
                    }
                }
            }
            
            uiState.errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
