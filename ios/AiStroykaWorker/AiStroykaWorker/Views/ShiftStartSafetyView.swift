//
//  ShiftStartSafetyView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct ShiftStartSafetyView: View {
    let project: ProjectDTO
    var onFinished: () -> Void
    @ObservedObject private var store = AppStateStoreManager.shared
    @ObservedObject private var opStore = OperationQueueStore.shared
    @ObservedObject private var executor = OperationQueueExecutor.shared
    @ObservedObject private var location = WorkerLocationService.shared
    @State private var safety: WorkerSafetyCheckState
    @State private var starting = false
    @State private var errorMessage: String?
    @State private var showBriefing = false

    init(project: ProjectDTO, onFinished: @escaping () -> Void) {
        self.project = project
        self.onFinished = onFinished
        let day = ISO8601DateFormatter().string(from: Date()).prefix(10)
        _safety = State(initialValue: WorkerSafetyStore.load(dayKey: String(day)))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(NSLocalizedString("wrk_v43_shift_start_title", comment: ""))
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Text(project.name ?? project.id)
                        .font(.system(size: 15))
                        .foregroundStyle(WorkerV43.textSecondary)
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                        Text("\(WorkerV43Formatters.dayTitle(Date())) · \(WorkerV43Formatters.clock(Date()))")
                    }
                    .font(.system(size: 14))
                    .foregroundStyle(WorkerV43.cyan)

                    WorkerV43HeroPhoto(height: 148, systemImage: "building.2.fill") {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "mappin.and.ellipse")
                                Text(project.name ?? "")
                                Spacer()
                                Circle().fill(WorkerV43.success).frame(width: 8, height: 8)
                                Text(NSLocalizedString("wrk_v43_on_site", comment: ""))
                                    .foregroundStyle(WorkerV43.success)
                            }
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(WorkerV43.textPrimary)
                            if location.authorization == .denied {
                                Text(NSLocalizedString("wrk_v43_location_denied", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(WorkerV43.warning)
                            }
                        }
                    }

                    Text(NSLocalizedString("wrk_v43_safety_title", comment: ""))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    checkRow("helmet", title: NSLocalizedString("wrk_v43_safety_helmet", comment: ""), image: "shield.checkered", bound: $safety.helmet)
                    checkRow("harness", title: NSLocalizedString("wrk_v43_safety_harness", comment: ""), image: "figure.climbing", bound: $safety.harness)
                    checkRow("tools", title: NSLocalizedString("wrk_v43_safety_tools", comment: ""), image: "wrench.and.screwdriver", bound: $safety.tools)
                    checkRow("zone", title: NSLocalizedString("wrk_v43_safety_zone", comment: ""), image: "cone.fill", bound: $safety.zone)

                    Button { showBriefing = true } label: {
                        WorkerV43Card(borderColor: WorkerV43.warning.opacity(0.4)) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "checkmark.shield")
                                        .foregroundStyle(WorkerV43.warning)
                                    Text(NSLocalizedString("wrk_v43_briefing_title", comment: ""))
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundStyle(WorkerV43.textPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundStyle(WorkerV43.textSecondary)
                                }
                                Text(NSLocalizedString("wrk_v43_briefing_body", comment: ""))
                                    .font(.system(size: 14))
                                    .foregroundStyle(WorkerV43.textSecondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(NSLocalizedString("wrk_v43_briefing_title", comment: ""))

                    if let errorMessage {
                        Text(errorMessage).font(.caption).foregroundStyle(WorkerV43.danger)
                    }

                    Toggle(isOn: $safety.confirmed) {
                        Text(NSLocalizedString("wrk_v43_safety_confirm", comment: ""))
                            .font(.system(size: 15))
                            .foregroundStyle(WorkerV43.textPrimary)
                    }
                    .tint(WorkerV43.yellow)
                    .accessibilityIdentifier("pilot_worker_safety_confirm")

                    WorkerV43PrimaryButton(
                        title: NSLocalizedString("worker_start_shift", comment: ""),
                        enabled: safety.allRequired && !starting,
                        loading: starting,
                        action: startShift
                    )
                    .accessibilityIdentifier("pilot_worker_start_shift")

                    Text(NSLocalizedString("wrk_v43_shift_privacy", comment: ""))
                        .font(.system(size: 12))
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                .padding(WorkerV43.screenX)
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .accessibilityIdentifier("pilot_worker_shift_start")
            .background(
                NavigationLink(
                    destination: DocumentsDrawingsView(project: project, initialTab: .instructions),
                    isActive: $showBriefing
                ) { EmptyView() }
                .hidden()
            )
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { onFinished() } label: { Image(systemName: "chevron.left") }
                        .foregroundStyle(WorkerV43.textPrimary)
                }
            }
        }
        .onAppear {
            location.requestIfNeeded(scope: WorkerSettingsStore.load().geoScope)
        }
        .onChange(of: safety) { value in
            WorkerSafetyStore.save(value)
        }
    }

    private func checkRow(_ id: String, title: String, image: String, bound: Binding<Bool>) -> some View {
        Button {
            bound.wrappedValue.toggle()
        } label: {
            HStack {
                Image(systemName: image)
                    .foregroundStyle(WorkerV43.cyan)
                    .frame(width: 28)
                Text(title)
                    .foregroundStyle(WorkerV43.textPrimary)
                Spacer()
                Image(systemName: bound.wrappedValue ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(bound.wrappedValue ? WorkerV43.success : WorkerV43.yellow)
            }
            .padding(14)
            .background(WorkerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .frame(minHeight: WorkerV43.fieldTouch)
        .accessibilityIdentifier("pilot_worker_safety_\(id)")
        .accessibilityAddTraits(bound.wrappedValue ? .isSelected : [])
    }

    private func startShift() {
        guard safety.allRequired else { return }
        starting = true
        errorMessage = nil
        let day = todayDayId()
        var keys = store.state.shiftIdempotencyKeys[day] ?? ShiftIdempotencyKeys(startKey: nil, endKey: nil)
        if keys.startKey == nil { keys.startKey = DeviceContext.newIdempotencyKey() }
        store.save { $0.shiftIdempotencyKeys[day] = keys }
        let op = QueuedOperation(
            id: UUID().uuidString,
            type: .startShift,
            payload: OperationPayload(dayId: day, taskId: nil, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil),
            idempotencyKey: keys.startKey ?? DeviceContext.newIdempotencyKey(),
            dependsOn: [],
            state: .queued,
            attemptCount: 0,
            nextAttemptAt: nil,
            lastErrorCode: nil,
            lastErrorMessage: nil,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            updatedAt: ISO8601DateFormatter().string(from: Date()),
            resultReportId: nil,
            resultSessionId: nil,
            resultUploadPath: nil
        )
        opStore.add(op)
        executor.runLoop()
        store.save {
            $0.shift.startedAt = ISO8601DateFormatter().string(from: Date())
            $0.shift.endedAt = nil
            $0.shift.dayId = day
        }
        var evidence = WorkerShiftEvidenceStore.load()
        evidence.startedAt = ISO8601DateFormatter().string(from: Date())
        if let snap = location.snapshotEvidence() {
            evidence.latitude = snap.lat
            evidence.longitude = snap.lon
            evidence.locationAccuracy = snap.accuracy
        }
        WorkerShiftEvidenceStore.save(evidence)
        starting = false
        onFinished()
    }

    private func todayDayId() -> String {
        ISO8601DateFormatter().string(from: Date()).prefix(10).replacingOccurrences(of: "-", with: "")
    }
}
