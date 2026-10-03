import SwiftUI

struct CustomerStatusView: View {
    enum Kind { case loading, unauthorized, error }

    let kind: Kind
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?
    var secondaryActionTitle: String?
    var secondaryAction: (() -> Void)?

    var body: some View {
        VStack(spacing: 16) {
            if kind == .loading {
                ProgressView()
                    .tint(.white)
            }
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.white)
                .padding(.horizontal, 24)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
            }
            if let secondaryActionTitle, let secondaryAction {
                Button(secondaryActionTitle, action: secondaryAction)
                    .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.ignoresSafeArea())
    }
}
