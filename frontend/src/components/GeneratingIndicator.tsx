import './GeneratingIndicator.css';

export function GeneratingIndicator({ label }: { label: string }) {
  return (
    <div className="generating-indicator card">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
