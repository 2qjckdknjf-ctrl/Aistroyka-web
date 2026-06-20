/**
 * Non-interactive ambient field for public marketing shell (demo blob parity).
 * Decorative only — no glass, no content. Respects reduced motion via CSS.
 */
export function PublicAmbientField() {
  return (
    <div className="public-ambient-field" aria-hidden>
      <div className="public-ambient-field__blob public-ambient-field__blob--1" />
      <div className="public-ambient-field__blob public-ambient-field__blob--2" />
      <div className="public-ambient-field__blob public-ambient-field__blob--3" />
    </div>
  );
}
