//
//  LoadingStateView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct LoadingStateView: View {
    var message: String = NSLocalizedString("mgr_loading", comment: "")

    var body: some View {
        BrandLoadingState(message)
    }
}
