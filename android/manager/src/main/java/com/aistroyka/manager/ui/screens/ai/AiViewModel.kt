package com.aistroyka.manager.ui.screens.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.dto.AnalysisResult
import com.aistroyka.shared.error.ApiException
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AiViewModel @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AiUiState())
    val uiState: StateFlow<AiUiState> = _uiState.asStateFlow()
    
    fun updateImageUrl(url: String) {
        _uiState.value = _uiState.value.copy(imageUrl = url)
    }
    
    fun analyzeImage() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null,
                analysisResult = null
            )
            
            val token = tokenStorage.getToken()
            val request = com.aistroyka.shared.dto.AnalyzeImageRequest(_uiState.value.imageUrl, null)
            
            try {
                val response = apiClient.analyzeImage(token?.let { "Bearer $it" }, request)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        analysisResult = response.body()!!.data
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Analysis failed"
                    )
                }
            } catch (e: ApiException) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.error.message
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = e.message ?: "Unknown error"
                )
            }
        }
    }
}

data class AiUiState(
    val imageUrl: String = "",
    val isLoading: Boolean = false,
    val analysisResult: AnalysisResult? = null,
    val errorMessage: String? = null
)
