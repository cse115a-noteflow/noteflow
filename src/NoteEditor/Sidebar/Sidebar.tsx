import './Sidebar.css';
import type API from '../../lib/API';
import Note from '../../lib/Note';
import SidebarDetails from './SidebarDetails/SidebarDetails';
import SidebarNotes from './SidebarNotes/SidebarNotes';

function Sidebar({
  note,
  setId,
  api
}: {
  note: Note | null;
  setId: (id: string | null) => void;
  api: API;
}) {
  return (
    <div className="sidebar">
      {note && <SidebarDetails note={note} />}
      <SidebarNotes setId={setId} api={api} />
    </div>
  );
}

export default Sidebar;
