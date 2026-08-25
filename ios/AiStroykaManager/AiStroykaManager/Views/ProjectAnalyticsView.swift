//
//  ProjectAnalyticsView.swift
//  AiStroykaManager
//

import SwiftUI
import Charts
import UIKit
import Shared

struct ProjectAnalyticsView: View {
    var projectId: String?
    var projectName: String?
    @State private var estimate: ProjectEstimateSummaryDTO?
    @State private var summary: ProjectSummaryDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var range: RangeKind = .month
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var lastSync: Date?
    @State private var didLoad = false

    enum RangeKind: String, CaseIterable { case week, month, quarter }

    var body: some View {
        Group {
            if isLoading && !didLoad && estimate == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_v43_loading_analytics", comment: ""))
                    .accessibilityIdentifier("pilot_manager_analytics_loading")
            } else if let err = errorMessage, estimate == nil {
                ErrorStateView(message: err, retry: { load() })
            } else {
                content
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_v43_analytics", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                ShareLink(item: pdfURL) {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel(NSLocalizedString("mgr_v43_export_pdf", comment: ""))
            }
        }
        .onAppear { loadIfNeeded() }
        .refreshable { await loadAsync() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                }
                HStack {
                    Text(projectName ?? NSLocalizedString("mgr_tab_projects", comment: ""))
                        .font(.headline)
                        .foregroundStyle(ManagerV43.textPrimary)
                    Spacer()
                    if ManagerV43Preview.isEnabled {
                        Picker("", selection: $range) {
                            Text(NSLocalizedString("mgr_v43_week", comment: "")).tag(RangeKind.week)
                            Text(NSLocalizedString("mgr_v43_month", comment: "")).tag(RangeKind.month)
                            Text(NSLocalizedString("mgr_v43_quarter", comment: "")).tag(RangeKind.quarter)
                        }
                        .pickerStyle(.segmented)
                        .frame(maxWidth: 220)
                    }
                }

                HStack {
                    kpi(NSLocalizedString("mgr_v43_readiness", comment: ""), readinessLabel)
                    kpi(NSLocalizedString("mgr_v43_project_budget", comment: ""), budgetLabel)
                    kpi(varianceTitle, delayLabel)
                }

                ManagerV43Card {
                    Text(NSLocalizedString("mgr_v43_execution", comment: ""))
                        .font(.headline)
                        .foregroundStyle(ManagerV43.textPrimary)
                    if samplePoints.isEmpty {
                        Text(NSLocalizedString("mgr_v43_chart_summary", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    } else {
                        Chart(samplePoints, id: \.label) { point in
                            LineMark(x: .value("x", point.label), y: .value("y", point.actual))
                                .foregroundStyle(ManagerV43.dataBlue)
                            LineMark(x: .value("x", point.label), y: .value("y", point.plan))
                                .foregroundStyle(ManagerV43.textSecondary)
                                .lineStyle(StrokeStyle(dash: [4]))
                        }
                        .frame(height: 160)
                        .accessibilityLabel(NSLocalizedString("mgr_v43_execution", comment: ""))
                        Text(NSLocalizedString("mgr_v43_chart_summary", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    }
                }

                ShareLink(item: pdfURL) {
                    Label(NSLocalizedString("mgr_v43_export_pdf", comment: ""), systemImage: "doc.richtext")
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: ManagerV43.touch)
                        .foregroundStyle(ManagerV43.yellowInk)
                        .background(ManagerV43.yellow)
                        .clipShape(RoundedRectangle(cornerRadius: ManagerV43.radiusControl, style: .continuous))
                }
                .accessibilityLabel(NSLocalizedString("mgr_v43_share_report", comment: ""))
            }
            .padding(ManagerV43.screenX)
        }
        .accessibilityIdentifier("pilot_manager_analytics")
    }

    private var budgetLabel: String {
        if let planned = estimate?.budgetSummary?.plannedTotal {
            return ManagerV43Formatters.compactCurrency(planned, currencyCode: estimate?.budgetSummary?.currency ?? "RUB")
        }
        return ManagerV43Preview.isEnabled ? ManagerV43Formatters.compactCurrency(ManagerDemoCatalog.featuredBudget, currencyCode: "RUB") : "—"
    }

    private func kpi(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundStyle(ManagerV43.textSecondary)
            Text(value).font(.headline).foregroundStyle(ManagerV43.textPrimary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private struct Point { var label: String; var actual: Double; var plan: Double }
    private var samplePoints: [Point] {
        if let planned = estimate?.budgetSummary?.plannedTotal,
           let actual = estimate?.budgetSummary?.actualTotal {
            return [
                Point(label: "plan", actual: actual, plan: planned),
            ]
        }
        if ManagerV43Preview.isEnabled {
            let all = [
                Point(label: "M1", actual: 42, plan: 40),
                Point(label: "M2", actual: 55, plan: 52),
                Point(label: "M3", actual: 68, plan: 64),
                Point(label: "M4", actual: 78, plan: 72),
            ]
            switch range {
            case .week: return Array(all.suffix(1))
            case .month: return Array(all.prefix(3))
            case .quarter: return all
            }
        }
        return []
    }

    private var varianceTitle: String {
        if !ManagerV43Preview.isEnabled, estimate?.budgetSummary?.varianceAmount != nil {
            return NSLocalizedString("mgr_v43_budget_variance", comment: "")
        }
        return NSLocalizedString("mgr_due", comment: "")
    }

    private var delayLabel: String {
        if ManagerV43Preview.isEnabled {
            return ManagerV43Formatters.delayLabel(days: ManagerDemoCatalog.featuredDelayDays)
        }
        if let variance = estimate?.budgetSummary?.varianceAmount {
            return ManagerV43Formatters.compactCurrency(variance, currencyCode: estimate?.budgetSummary?.currency ?? "RUB")
        }
        return "—"
    }

    private var readinessLabel: String {
        if let planned = estimate?.budgetSummary?.plannedTotal, planned > 0,
           let actual = estimate?.budgetSummary?.actualTotal {
            return ManagerV43Formatters.percentLabel(actual / planned)
        }
        return ManagerV43Preview.isEnabled ? "78%" : "—"
    }

    private var pdfURL: URL {
        ManagerAnalyticsPDF.write(
            projectName: projectName ?? NSLocalizedString("mgr_tab_projects", comment: ""),
            budget: budgetLabel,
            readiness: readinessLabel,
            workers: summary?.activeWorkers,
            reports: summary?.openReports,
            points: samplePoints.map { ($0.label, $0.plan, $0.actual) }
        )
    }

    private func load() { Task { await loadAsync() } }
    private func loadIfNeeded() {
        if didLoad { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                estimate = nil
                lastSync = Date()
            }
        ) {
            if let projectId {
                estimate = try? await ManagerAPI.projectEstimate(projectId: projectId)
                summary = try? await ManagerAPI.projectSummary(projectId: projectId)
            } else if let first = try? await ManagerAPI.projects().first {
                estimate = try? await ManagerAPI.projectEstimate(projectId: first.id)
                summary = try? await ManagerAPI.projectSummary(projectId: first.id)
            }
            lastSync = Date()
        }
        didLoad = true
    }
}

enum ManagerAnalyticsPDF {
    static func write(
        projectName: String,
        budget: String,
        readiness: String,
        workers: Int?,
        reports: Int?,
        points: [(String, Double, Double)]
    ) -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("aistroyka-manager-analytics.pdf")
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 612, height: 792))
        let generated = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short)
        try? renderer.writePDF(to: url) { context in
            context.beginPage()
            let cg = context.cgContext
            UIColor(red: 0.07, green: 0.08, blue: 0.10, alpha: 1).setFill()
            cg.fill(CGRect(x: 0, y: 0, width: 612, height: 792))
            UIColor(red: 1, green: 0.77, blue: 0, alpha: 1).setFill()
            cg.fill(CGRect(x: 0, y: 0, width: 612, height: 8))

            let title = NSLocalizedString("mgr_v43_pdf_title", comment: "") as NSString
            title.draw(at: CGPoint(x: 36, y: 28), withAttributes: [
                .font: UIFont.systemFont(ofSize: 22, weight: .semibold),
                .foregroundColor: UIColor.white,
            ])
            (projectName as NSString).draw(at: CGPoint(x: 36, y: 58), withAttributes: [
                .font: UIFont.systemFont(ofSize: 16, weight: .medium),
                .foregroundColor: UIColor(white: 0.85, alpha: 1),
            ])
            let generatedLine = String(format: NSLocalizedString("mgr_v43_pdf_generated_fmt", comment: ""), generated) as NSString
            generatedLine.draw(at: CGPoint(x: 36, y: 82), withAttributes: [
                .font: UIFont.systemFont(ofSize: 11),
                .foregroundColor: UIColor(white: 0.65, alpha: 1),
            ])

            drawKPI(title: NSLocalizedString("mgr_v43_readiness", comment: ""), value: readiness, rect: CGRect(x: 36, y: 112, width: 170, height: 64))
            drawKPI(title: NSLocalizedString("mgr_v43_project_budget", comment: ""), value: budget, rect: CGRect(x: 221, y: 112, width: 170, height: 64))
            let workforce = workers.map(String.init) ?? "—"
            drawKPI(title: NSLocalizedString("mgr_v43_workers", comment: ""), value: workforce, rect: CGRect(x: 406, y: 112, width: 170, height: 64))

            if !points.isEmpty {
                let chartRect = CGRect(x: 36, y: 200, width: 540, height: 180)
                UIColor(white: 0.14, alpha: 1).setFill()
                UIBezierPath(roundedRect: chartRect, cornerRadius: 10).fill()
                let maxY = max(points.map(\.1).max() ?? 1, points.map(\.2).max() ?? 1, 1)
                func point(at index: Int, value: Double) -> CGPoint {
                    let x = chartRect.minX + 24 + CGFloat(index) / CGFloat(max(points.count - 1, 1)) * (chartRect.width - 48)
                    let y = chartRect.maxY - 24 - CGFloat(value / maxY) * (chartRect.height - 48)
                    return CGPoint(x: x, y: y)
                }
                let plan = UIBezierPath()
                let actual = UIBezierPath()
                for (index, item) in points.enumerated() {
                    let planPoint = point(at: index, value: item.1)
                    let actualPoint = point(at: index, value: item.2)
                    if index == 0 {
                        plan.move(to: planPoint)
                        actual.move(to: actualPoint)
                    } else {
                        plan.addLine(to: planPoint)
                        actual.addLine(to: actualPoint)
                    }
                }
                UIColor(white: 0.55, alpha: 1).setStroke()
                plan.lineWidth = 2
                plan.setLineDash([4, 3], count: 2, phase: 0)
                plan.stroke()
                UIColor(red: 0.23, green: 0.51, blue: 0.96, alpha: 1).setStroke()
                actual.lineWidth = 2.5
                actual.stroke()
                let legend = "\(NSLocalizedString("mgr_v43_pdf_plan", comment: "")) / \(NSLocalizedString("mgr_v43_pdf_actual", comment: ""))" as NSString
                legend.draw(at: CGPoint(x: 48, y: 208), withAttributes: [
                    .font: UIFont.systemFont(ofSize: 11),
                    .foregroundColor: UIColor(white: 0.75, alpha: 1),
                ])
            }

            let reportsLine = String(format: NSLocalizedString("mgr_v43_pdf_reports_fmt", comment: ""), reports ?? 0) as NSString
            reportsLine.draw(at: CGPoint(x: 36, y: 400), withAttributes: [
                .font: UIFont.systemFont(ofSize: 12),
                .foregroundColor: UIColor(white: 0.7, alpha: 1),
            ])
            (NSLocalizedString("mgr_v43_chart_summary", comment: "") as NSString).draw(
                in: CGRect(x: 36, y: 424, width: 540, height: 60),
                withAttributes: [
                    .font: UIFont.systemFont(ofSize: 11),
                    .foregroundColor: UIColor(white: 0.6, alpha: 1),
                ]
            )
        }
        return url
    }

    private static func drawKPI(title: String, value: String, rect: CGRect) {
        UIColor(white: 0.14, alpha: 1).setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: 10).fill()
        (title as NSString).draw(at: CGPoint(x: rect.minX + 12, y: rect.minY + 10), withAttributes: [
            .font: UIFont.systemFont(ofSize: 11),
            .foregroundColor: UIColor(white: 0.65, alpha: 1),
        ])
        (value as NSString).draw(at: CGPoint(x: rect.minX + 12, y: rect.minY + 28), withAttributes: [
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold),
            .foregroundColor: UIColor.white,
        ])
    }
}
