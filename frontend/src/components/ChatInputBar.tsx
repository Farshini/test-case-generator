import { useState, type KeyboardEvent } from 'react';
import { MicIcon, PaperclipIcon, SendIcon } from './Icons';
import './ChatInputBar.css';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-bar-wrap">
      <div className="chat-input-bar">
        <textarea
          className="chat-input-bar__textarea"
          placeholder="What would you like to do today?"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="chat-input-bar__footer">
          <span className="chat-input-bar__attachment">
            <PaperclipIcon size={13} /> Attachment
          </span>
          <div className="chat-input-bar__footer-right">
            <button type="button" className="chat-input-bar__icon-button" aria-label="Voice input" disabled>
              <MicIcon size={16} />
            </button>
            <button
              type="button"
              className="chat-input-bar__send"
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              aria-label="Send"
            >
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
