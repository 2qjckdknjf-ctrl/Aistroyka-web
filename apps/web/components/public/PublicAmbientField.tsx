/**
 * Non-interactive ambient field for public marketing shell (LG-2A).
 * Decorative only — no glass, no content. Respects reduced motion via CSS.
 */
export function PublicAmbientField() {
  return (
    <div className="public-ambient-field" aria-hidden>
      <div className="public-ambient-field__glow public-ambient-field__glow--core" />
      <div className="public-ambient-field__glow public-ambient-field__glow--accent" />
    </div>
  );
}
