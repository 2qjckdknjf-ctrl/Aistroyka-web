//
//  ProjectPickerView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct ProjectPickerView: View {
    let projects: [ProjectDTO]
    @Binding var selected: ProjectDTO?
    
    var body: some View {
        List(projects, id: \.id) { p in
            Button(action: { selected = p }) {
                HStack {
                    Text(p.name ?? p.id)
                    Spacer()
                    if selected?.id == p.id { Image(systemName: "checkmark") }
                }
            }
        }
        .navigationTitle("Select project")
    }
}
