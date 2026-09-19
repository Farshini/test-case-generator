import { ClipboardIcon, MenuIcon, SearchIcon, SparkleIcon } from './Icons';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand" aria-hidden="true">
        <SparkleIcon size={20} className="sidebar__brand-icon" />
      </div>
      <nav className="sidebar__nav">
        <button className="sidebar__icon-button" type="button" title="Menu" aria-label="Menu">
          <MenuIcon size={18} />
        </button>
        <button className="sidebar__icon-button" type="button" title="Search" aria-label="Search">
          <SearchIcon size={18} />
        </button>
        <button
          className="sidebar__icon-button sidebar__icon-button--active"
          type="button"
          title="Test Case Generator"
          aria-label="Test Case Generator"
          aria-current="page"
        >
          <ClipboardIcon size={18} />
        </button>
      </nav>
    </aside>
  );
}
