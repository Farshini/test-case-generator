import './ErrorBanner.css';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__message">{message}</span>
      <div className="error-banner__actions">
        {onRetry && (
          <button type="button" className="btn btn--sm btn--secondary" onClick={onRetry}>
            Retry
          </button>
        )}
        <button type="button" className="btn btn--sm btn--ghost" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
