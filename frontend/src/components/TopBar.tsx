import { BellIcon, ChevronDownIcon, HeartIcon, PlusIcon } from './Icons';
import './TopBar.css';

interface TopBarProps {
  projectName?: string;
  onStartOver?: () => void;
}

export function TopBar({ projectName, onStartOver }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__breadcrumb">
        <span className="topbar__breadcrumb-tag">TC</span>
        <span className="topbar__breadcrumb-sep">/</span>
        <span className="topbar__breadcrumb-name">
          {projectName || 'Test Case Generator'}
        </span>
      </div>
      <div className="topbar__actions">
        {onStartOver && (
          <button className="btn btn--sm btn--secondary" type="button" onClick={onStartOver}>
            <PlusIcon size={14} /> <span>New requirement</span>
          </button>
        )}
        <button className="topbar__icon-button" type="button" aria-label="Favorites">
          <HeartIcon size={18} />
        </button>
        <button className="topbar__icon-button" type="button" aria-label="Notifications">
          <BellIcon size={18} />
        </button>
        <div className="topbar__user">
          <span className="topbar__avatar" aria-hidden="true" />
          <span className="topbar__user-name">Farshini</span>
          <ChevronDownIcon size={14} />
        </div>
      </div>
    </header>
  );
}
