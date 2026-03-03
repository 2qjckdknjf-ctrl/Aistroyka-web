export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-aistroyka-border-subtle ${className}`.trim()} />;
}
