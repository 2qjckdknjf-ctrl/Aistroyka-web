//
//  ManagerSettingsView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ManagerSettingsView: View {
    var body: some View {
        List {
            Section("Environment") {
                Text("API: \(Config.baseURL)")
                    .font(.caption)
            }
        }
        .navigationTitle("Settings")
    }
}
