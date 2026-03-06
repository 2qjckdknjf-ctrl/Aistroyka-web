//
//  ProjectPickerView.swift
//  WorkerLite
//

import SwiftUI

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
