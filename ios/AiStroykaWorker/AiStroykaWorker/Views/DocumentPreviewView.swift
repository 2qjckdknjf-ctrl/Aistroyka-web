//
//  DocumentPreviewView.swift
//  AiStroykaWorker
//

import QuickLook
import SwiftUI
import UIKit

struct DocumentPreviewView: View {
    let document: WorkerDocumentDTO
    @State private var localURL: URL?
    @State private var loading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(document.title)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
            Text("\(WorkerV43Copy.documentType(document.type)) · \(WorkerV43Copy.documentOfflineLabel(document))")
                .font(.system(size: 14))
                .foregroundStyle(WorkerV43.cyan)
            if let errorMessage {
                Text(errorMessage)
                    .font(.system(size: 14))
                    .foregroundStyle(WorkerV43.warning)
            }
            if loading {
                ProgressView().tint(WorkerV43.yellow)
            }
            if let localURL {
                WorkerQuickLook(url: localURL)
                    .frame(maxWidth: .infinity, minHeight: 360)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else {
                WorkerV43EmptyState(
                    title: NSLocalizedString("wrk_v43_doc_preview_pending", comment: ""),
                    detail: NSLocalizedString("wrk_v43_doc_preview_pending_detail", comment: ""),
                    systemImage: "doc.richtext",
                    retry: document.previewURL == nil ? nil : load
                )
            }
            Spacer()
        }
        .padding(WorkerV43.screenX)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(WorkerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("wrk_v43_documents", comment: ""))
        .onAppear { load() }
    }

    private func load() {
        guard let remote = document.previewURL else {
            if let cached = WorkerDocumentPinStore.cachedFileURL(for: document) {
                localURL = cached
            }
            return
        }
        if remote.isFileURL {
            localURL = remote
            WorkerDocumentPinStore.pinLocalFile(document)
            return
        }
        if let cached = WorkerDocumentPinStore.cachedFileURL(for: document),
           !WorkerDocumentPinStore.isOutdated(document) {
            localURL = cached
            return
        }
        loading = true
        errorMessage = nil
        Task {
            do {
                let (data, response) = try await URLSession.shared.data(from: remote)
                let ext = (response.url?.pathExtension).flatMap { $0.isEmpty ? nil : $0 } ?? "pdf"
                let file = try WorkerDocumentPinStore.persistFile(data: data, document: document, ext: ext)
                await MainActor.run {
                    localURL = file
                    loading = false
                }
            } catch {
                await MainActor.run {
                    if let cached = WorkerDocumentPinStore.cachedFileURL(for: document) {
                        localURL = cached
                    }
                    errorMessage = WorkerV43Copy.userFacing(error)
                    loading = false
                }
            }
        }
    }
}

struct WorkerQuickLook: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: QLPreviewController, context: Context) {
        context.coordinator.url = url
        uiViewController.reloadData()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        var url: URL
        init(url: URL) { self.url = url }
        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as QLPreviewItem
        }
    }
}
