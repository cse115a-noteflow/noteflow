import './Sidebar.css';
import type API from '../../lib/API';
import Note from '../../lib/Note';
import SidebarDetails from './SidebarDetails/SidebarDetails';
import SidebarNotes from './SidebarNotes/SidebarNotes';

function Sidebar({
  note,
  setId,
  api,
  collapsed
}: {
  note: Note | null;
  setId: (id: string | null) => void;
  api: API;
  collapsed: boolean;
}) {
  return (
    <div className="sidebar" style={{ width: collapsed ? '0' : '350px' }}>
      {note && <SidebarDetails note={note} />}
      <SidebarNotes setId={setId} api={api} />
    </div>
  );
}

export default Sidebar;
