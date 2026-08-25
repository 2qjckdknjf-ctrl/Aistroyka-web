//
//  CameraEvidenceView.swift
//  AiStroykaWorker
//

import SwiftUI
import UIKit
import Shared

struct CameraEvidenceView: View {
    let kind: WorkerPhotoKind
    let task: TaskDTO
    let projectId: String
    let dayId: String?
    @ObservedObject private var location = WorkerLocationService.shared
    @State private var image: UIImage?
    @State private var showCamera = false
    @State private var showLibrary = false
    @State private var showReport = false
    @State private var showWIP = false
    @State private var cameraDenied = false
    @State private var lowStorage = false
    @State private var beforeReference: UIImage?

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text(kind == .after
                         ? NSLocalizedString("wrk_v43_photo_after_title", comment: "")
                         : NSLocalizedString("wrk_v43_photo_before_title", comment: ""))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Text(kind == .after ? "2 / 3" : "1 / 3")
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                Spacer()
            }
            ZStack {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    WorkerV43.cardStrong
                    VStack(spacing: 8) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 28))
                            .foregroundStyle(WorkerV43.yellow)
                        Text(kind == .after
                             ? NSLocalizedString("wrk_v43_repeat_angle", comment: "")
                             : NSLocalizedString("wrk_v43_capture_overview", comment: ""))
                            .foregroundStyle(WorkerV43.textPrimary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                }
            }
            .frame(maxWidth: .infinity, minHeight: 280)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(WorkerV43.border, lineWidth: 1)
            )
            HStack {
                Image(systemName: "mappin")
                Text(task.title)
                Spacer()
                Image(systemName: gpsReady ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                    .foregroundStyle(gpsReady ? WorkerV43.success : WorkerV43.warning)
                Text(gpsReady
                     ? NSLocalizedString("wrk_v43_gps_ok", comment: "")
                     : NSLocalizedString("wrk_v43_location_unavailable", comment: ""))
            }
            .font(.caption)
            .foregroundStyle(WorkerV43.textSecondary)
            .padding(10)
            .background(WorkerV43.card)
            .clipShape(Capsule())

            check(NSLocalizedString("wrk_v43_angle_ok", comment: ""), ok: angleOK == true, warning: angleOK == false)
            check(NSLocalizedString("wrk_v43_sharp_ok", comment: ""), ok: WorkerPhotoEvidence.isSharp(image))
            if kind == .after {
                check(NSLocalizedString("wrk_v43_need_closeup", comment: ""), ok: image != nil, warning: image == nil)
            }
            if cameraDenied {
                Text(NSLocalizedString("wrk_v43_camera_denied", comment: ""))
                    .font(.caption)
                    .foregroundStyle(WorkerV43.warning)
            }
            if lowStorage {
                Text(NSLocalizedString("wrk_v43_low_storage", comment: ""))
                    .font(.caption)
                    .foregroundStyle(WorkerV43.warning)
            }
            HStack {
                Button { showLibrary = true } label: {
                    Image(systemName: "photo").frame(width: 48, height: 48)
                }
                Spacer()
                Button { showCamera = true } label: {
                    Circle()
                        .stroke(WorkerV43.yellow, lineWidth: 6)
                        .frame(width: 72, height: 72)
                        .overlay(Circle().fill(Color.white).padding(8))
                }
                .accessibilityIdentifier(kind == .before ? "pilot_worker_photo_before_pick" : "pilot_worker_photo_after_pick")
                Spacer()
                Color.clear.frame(width: 48, height: 48)
            }
            WorkerV43PrimaryButton(
                title: image == nil
                    ? NSLocalizedString("worker_take_photo", comment: "")
                    : NSLocalizedString("wrk_v43_save_photos", comment: ""),
                enabled: image != nil
            ) { savePhotos() }
            .accessibilityIdentifier("pilot_worker_save_photos")
            Button(NSLocalizedString("wrk_v43_retake", comment: "")) { image = nil }
                .foregroundStyle(WorkerV43.yellow)
                .frame(minHeight: WorkerV43.touch)
        }
        .padding(WorkerV43.screenX)
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier(kind == .after ? "pilot_worker_camera_after" : "pilot_worker_camera_before")
        .onAppear {
            location.requestIfNeeded(scope: WorkerSettingsStore.load().geoScope)
            cameraDenied = WorkerPhotoEvidence.cameraDenied
            lowStorage = WorkerPhotoEvidence.isLowStorage()
            beforeReference = WorkerPhotoEvidence.loadReference(taskId: task.id, kind: .before)
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(image: $image)
        }
        .sheet(isPresented: $showLibrary) {
            ImagePicker(image: $image)
        }
        .background(
            ZStack {
                NavigationLink(
                    destination: WorkInProgressView(task: task, projectId: projectId, dayId: dayId),
                    isActive: $showWIP
                ) { EmptyView() }
                NavigationLink(
                    destination: DailyReportFormView(
                        projectId: projectId,
                        dayId: dayId,
                        draftReportId: nil,
                        taskId: task.id,
                        taskTitle: task.title
                    ),
                    isActive: $showReport
                ) { EmptyView() }
            }
            .hidden()
        )
    }

    private var gpsReady: Bool {
        location.snapshotEvidence() != nil || WorkerV43Preview.isEnabled
    }

    private var angleOK: Bool? {
        if kind == .after {
            return WorkerPhotoEvidence.angleMatch(current: image, reference: beforeReference)
        }
        return image == nil ? nil : true
    }

    private func savePhotos() {
        guard let image else { return }
        var progress = WorkerTaskProgressStore.load(taskId: task.id)
        if progress.completedStepIndexes.isEmpty {
            progress.completedStepIndexes = [0]
        }
        WorkerTaskProgressStore.save(progress)
        WorkerPhotoEvidence.persistPending(image: image, purpose: kind.rawValue, taskId: task.id)
        WorkerPhotoEvidence.saveReference(taskId: task.id, kind: kind, image: image)
        if kind == .after {
            showReport = true
        } else {
            showWIP = true
        }
    }

    private func check(_ title: String, ok: Bool, warning: Bool = false) -> some View {
        HStack {
            Image(systemName: ok ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundStyle(ok ? WorkerV43.success : (warning ? WorkerV43.warning : WorkerV43.textSecondary))
            Text(title).foregroundStyle(WorkerV43.textPrimary)
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(WorkerV43.textSecondary)
        }
        .padding(.vertical, 6)
    }
}
