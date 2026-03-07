package com.aistroyka.worker.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.aistroyka.worker.ui.screens.home.HomeScreen
import com.aistroyka.worker.ui.screens.login.LoginScreen
import com.aistroyka.worker.ui.screens.report.ReportCreateScreen
import com.aistroyka.worker.ui.screens.task.TaskDetailScreen

sealed class WorkerScreen(val route: String) {
    object Login : WorkerScreen("login")
    object Home : WorkerScreen("home")
    object TaskDetail : WorkerScreen("task_detail/{taskId}") {
        fun createRoute(taskId: String) = "task_detail/$taskId"
    }
    object ReportCreate : WorkerScreen("report_create")
}

@Composable
fun WorkerNavigation(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = WorkerScreen.Login.route
    ) {
        composable(WorkerScreen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(WorkerScreen.Home.route) {
                        popUpTo(WorkerScreen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(WorkerScreen.Home.route) {
            HomeScreen(
                onTaskClick = { taskId ->
                    navController.navigate(WorkerScreen.TaskDetail.createRoute(taskId))
                },
                onCreateReport = {
                    navController.navigate(WorkerScreen.ReportCreate.route)
                }
            )
        }
        
        composable(WorkerScreen.TaskDetail.route) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId") ?: ""
            TaskDetailScreen(
                taskId = taskId,
                onBack = { navController.popBackStack() },
                onCreateReport = {
                    navController.navigate(WorkerScreen.ReportCreate.route)
                }
            )
        }
        
        composable(WorkerScreen.ReportCreate.route) {
            ReportCreateScreen(
                onBack = { navController.popBackStack() },
                onReportCreated = { navController.popBackStack() }
            )
        }
    }
}
