//
//  QRScannerView.swift
//  AiStroykaWorker
//

import AVFoundation
import SwiftUI

struct QRScannerView: View {
    var onToken: (String) -> Void
    var onInvalid: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var denied = false

    var body: some View {
        ZStack {
            QRScannerRepresentable(
                onCode: { value in
                    if let token = WorkerV43Formatters.inviteToken(fromScan: value) {
                        onToken(token)
                        dismiss()
                    } else {
                        onInvalid(NSLocalizedString("wrk_v43_qr_invalid", comment: ""))
                    }
                },
                onDenied: { denied = true }
            )
            .ignoresSafeArea()
            VStack {
                HStack {
                    Button(NSLocalizedString("worker_cancel", comment: "")) { dismiss() }
                        .foregroundStyle(WorkerV43.textPrimary)
                        .padding()
                    Spacer()
                }
                Spacer()
                Text(NSLocalizedString("wrk_v43_qr_hint", comment: ""))
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(WorkerV43.textPrimary)
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding()
            }
            if denied {
                WorkerV43EmptyState(
                    title: NSLocalizedString("wrk_v43_camera_denied", comment: ""),
                    detail: NSLocalizedString("wrk_v43_camera_denied_detail", comment: ""),
                    systemImage: "camera.badge.ellipsis"
                )
                .background(WorkerV43.bg.ignoresSafeArea())
            }
        }
        .preferredColorScheme(.dark)
    }
}

private struct QRScannerRepresentable: UIViewControllerRepresentable {
    var onCode: (String) -> Void
    var onDenied: () -> Void

    func makeUIViewController(context: Context) -> ScannerController {
        let vc = ScannerController()
        vc.onCode = onCode
        vc.onDenied = onDenied
        return vc
    }

    func updateUIViewController(_ uiViewController: ScannerController, context: Context) {}

    final class ScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
        var onCode: ((String) -> Void)?
        var onDenied: (() -> Void)?
        private let session = AVCaptureSession()
        private var handled = false

        override func viewDidLoad() {
            super.viewDidLoad()
            view.backgroundColor = .black
            switch AVCaptureDevice.authorizationStatus(for: .video) {
            case .authorized:
                configure()
            case .notDetermined:
                AVCaptureDevice.requestAccess(for: .video) { [weak self] ok in
                    DispatchQueue.main.async {
                        if ok { self?.configure() } else { self?.onDenied?() }
                    }
                }
            default:
                onDenied?()
            }
        }

        private func configure() {
            guard let device = AVCaptureDevice.default(for: .video),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input) else {
                onDenied?()
                return
            }
            session.addInput(input)
            let output = AVCaptureMetadataOutput()
            guard session.canAddOutput(output) else { return }
            session.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.qr]
            let preview = AVCaptureVideoPreviewLayer(session: session)
            preview.videoGravity = .resizeAspectFill
            preview.frame = view.bounds
            view.layer.addSublayer(preview)
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.session.startRunning()
            }
        }

        func metadataOutput(
            _ output: AVCaptureMetadataOutput,
            didOutput metadataObjects: [AVMetadataObject],
            from connection: AVCaptureConnection
        ) {
            guard !handled,
                  let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
                  let value = object.stringValue else { return }
            handled = true
            session.stopRunning()
            onCode?(value)
        }
    }
}
