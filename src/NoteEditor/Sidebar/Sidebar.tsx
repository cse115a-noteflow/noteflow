import './Sidebar.css';
import type API from '../../lib/API';
import Note from '../../lib/Note';
import SidebarDetails from './SidebarDetails/SidebarDetails';
import SidebarNotes from './SidebarNotes/SidebarNotes';

function Sidebar({ note, api }: { note: Note; api: API }) {
  return (
    <div className="sidebar">
      <SidebarDetails note={note} api={api} />
      <SidebarNotes note={note} api={api} />
    </div>
  );
}

export default Sidebar;
