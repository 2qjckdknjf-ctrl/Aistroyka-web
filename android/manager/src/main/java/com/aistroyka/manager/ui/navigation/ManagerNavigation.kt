package com.aistroyka.manager.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aistroyka.manager.ui.screens.dashboard.DashboardScreen
import com.aistroyka.manager.ui.screens.projects.ProjectsScreen
import com.aistroyka.manager.ui.screens.tasks.TasksScreen
import com.aistroyka.manager.ui.screens.reports.ReportsScreen
import com.aistroyka.manager.ui.screens.team.TeamScreen
import com.aistroyka.manager.ui.screens.ai.AiScreen
import com.aistroyka.manager.ui.screens.login.LoginScreen

sealed class ManagerScreen(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Login : ManagerScreen("login", "Login", Icons.Default.Login)
    object Dashboard : ManagerScreen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Projects : ManagerScreen("projects", "Projects", Icons.Default.Folder)
    object Tasks : ManagerScreen("tasks", "Tasks", Icons.Default.Assignment)
    object Reports : ManagerScreen("reports", "Reports", Icons.Default.Description)
    object Team : ManagerScreen("team", "Team", Icons.Default.People)
    object Ai : ManagerScreen("ai", "AI", Icons.Default.SmartToy)
}

@Composable
fun ManagerNavigation(
    navController: androidx.navigation.NavHostController = rememberNavController()
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    val bottomNavItems = listOf(
        ManagerScreen.Dashboard,
        ManagerScreen.Projects,
        ManagerScreen.Tasks,
        ManagerScreen.Reports,
        ManagerScreen.Team,
        ManagerScreen.Ai
    )
    
    Scaffold(
        bottomBar = {
            if (currentDestination?.route != ManagerScreen.Login.route) {
                NavigationBar {
                    bottomNavItems.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = ManagerScreen.Login.route,
            modifier = androidx.compose.ui.Modifier.padding(padding)
        ) {
            composable(ManagerScreen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(ManagerScreen.Dashboard.route) {
                            popUpTo(ManagerScreen.Login.route) { inclusive = true }
                        }
                    }
                )
            }
            
            composable(ManagerScreen.Dashboard.route) {
                DashboardScreen()
            }
            
            composable(ManagerScreen.Projects.route) {
                ProjectsScreen(
                    onProjectClick = { projectId ->
                        // Navigate to project detail
                    }
                )
            }
            
            composable(ManagerScreen.Tasks.route) {
                TasksScreen(
                    onTaskClick = { taskId ->
                        // Navigate to task detail
                    }
                )
            }
            
            composable(ManagerScreen.Reports.route) {
                ReportsScreen(
                    onReportClick = { reportId ->
                        // Navigate to report detail
                    }
                )
            }
            
            composable(ManagerScreen.Team.route) {
                TeamScreen()
            }
            
            composable(ManagerScreen.Ai.route) {
                AiScreen()
            }
        }
    }
}
