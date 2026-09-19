import { useRef, useState, type DragEvent } from 'react';
import { FileIcon, TrashIcon, UploadIcon } from './Icons';
import './RequirementInputCard.css';

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface RequirementInputCardProps {
  onSubmit: (input: { title: string; content?: string; file?: File }) => void;
  disabled?: boolean;
}

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function RequirementInputCard({ onSubmit, disabled }: RequirementInputCardProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: File | undefined) => {
    if (!selected) return;
    if (!isAcceptedFile(selected)) {
      setValidationError(
        `Unsupported file type. Please upload one of: ${ACCEPTED_EXTENSIONS.join(', ')}`,
      );
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('File is too large. Maximum size is 5 MB.');
      return;
    }
    setValidationError(null);
    setFile(selected);
    setContent('');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    setValidationError(null);
    if (!file && content.trim().length < 10) {
      setValidationError(
        'Enter at least 10 characters describing the requirement, or attach a file.',
      );
      return;
    }
    onSubmit({ title: title.trim(), content: content.trim() || undefined, file: file ?? undefined });
  };

  return (
    <div className="requirement-card">
      <div className="requirement-card__header">
        <h2>Associate Context</h2>
        <p className="requirement-card__subtitle">
          Describe the software requirement or user story, or upload a document.
        </p>
      </div>

      <label className="requirement-card__field-label" htmlFor="req-title">
        Project / requirement title (optional)
      </label>
      <input
        id="req-title"
        className="requirement-card__input"
        type="text"
        placeholder="e.g. Login feature"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={disabled}
      />

      <div
        className={`requirement-card__dropzone ${isDragging ? 'requirement-card__dropzone--dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a requirement document"
      >
        {file ? (
          <div className="requirement-card__file-chip">
            <FileIcon size={16} />
            <span className="requirement-card__file-name">{file.name}</span>
            <span className="requirement-card__file-size">
              {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              className="requirement-card__file-remove"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              aria-label="Remove file"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadIcon size={20} className="requirement-card__upload-icon" />
            <span>
              Drag & drop a file, or <span className="requirement-card__browse-link">browse</span>
            </span>
            <span className="requirement-card__dropzone-hint">
              .txt, .md, .pdf, .docx — up to 5 MB
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="visually-hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          disabled={disabled}
        />
      </div>

      {!file && (
        <>
          <label className="requirement-card__field-label" htmlFor="req-content">
            Or describe the requirement / user story
          </label>
          <textarea
            id="req-content"
            className="requirement-card__textarea"
            placeholder='e.g. "As a user, I want to reset my password via email so that I can regain access to my account without contacting support..."'
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={disabled}
          />
        </>
      )}

      {validationError && <div className="requirement-card__error">{validationError}</div>}

      <div className="requirement-card__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={disabled}
        >
          Generate Test Cases
        </button>
      </div>
    </div>
  );
}
