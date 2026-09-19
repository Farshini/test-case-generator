import type { ReactNode } from 'react';
import './SystemMessage.css';

interface SystemMessageProps {
  children: ReactNode;
}

export function SystemMessage({ children }: SystemMessageProps) {
  return (
    <div className="system-message">
      <span className="system-message__avatar" aria-hidden="true" />
      <div className="system-message__text">{children}</div>
    </div>
  );
}
