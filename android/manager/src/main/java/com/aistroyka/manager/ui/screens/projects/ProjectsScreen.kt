package com.aistroyka.manager.ui.screens.projects

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aistroyka.shared.dto.ProjectDto

@Composable
fun ProjectsScreen(
    onProjectClick: (String) -> Unit,
    viewModel: ProjectsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadProjects()
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Projects",
                style = MaterialTheme.typography.headlineLarge
            )
            Button(onClick = { viewModel.showCreateDialog() }) {
                Text("+ New")
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        if (uiState.isLoading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.projects) { project ->
                    ProjectCard(
                        project = project,
                        onClick = { onProjectClick(project.id) }
                    )
                }
            }
        }
        
        if (uiState.showCreateDialog) {
            CreateProjectDialog(
                onDismiss = { viewModel.hideCreateDialog() },
                onCreate = { name ->
                    viewModel.createProject(name)
                }
            )
        }
    }
}

@Composable
fun ProjectCard(
    project: ProjectDto,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = project.name,
                style = MaterialTheme.typography.titleLarge
            )
            project.createdAt?.let {
                Text(
                    text = "Created: $it",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
fun CreateProjectDialog(
    onDismiss: () -> Unit,
    onCreate: (String) -> Unit
) {
    var projectName by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Project") },
        text = {
            OutlinedTextField(
                value = projectName,
                onValueChange = { projectName = it },
                label = { Text("Project Name") },
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(
                onClick = {
                    if (projectName.isNotBlank()) {
                        onCreate(projectName)
                        onDismiss()
                    }
                }
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
