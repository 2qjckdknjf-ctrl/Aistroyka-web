export default function OwnerCabinetPage() {
  return (
    <div>
      <h1 className="text-aistroyka-title2 font-semibold tracking-tight">Owner cabinet</h1>
      <p className="mt-aistroyka-3 text-aistroyka-body text-aistroyka-text-secondary">
        Platform OWNER access only. Entry is not linked from the public site or standard dashboard. Enforcement:
        middleware, layout, and <code className="text-aistroyka-caption">/api/v1/owner/*</code> handlers.
      </p>
    </div>
  );
}
