import './Sidebar.css';
import type API from '../../lib/API';
import Note from '../../lib/Note';
import SidebarDetails from './SidebarDetails/SidebarDetails';
import SidebarNotes from './SidebarNotes/SidebarNotes';
import { type StudyMode } from '../Study/Study';

function Sidebar({
  note,
  setId,
  setStudyMode,
  api,
  collapsed
}: {
  note: Note | null;
  setId: (id: string | null) => void;
  setStudyMode: (value: StudyMode) => void;
  api: API;
  collapsed: boolean;
}) {
  return (
    <div className={'sidebar-wrapper ' + (collapsed ? 'collapsed' : '')}>
      <div className="sidebar">
        <SidebarDetails note={note} setStudyMode={setStudyMode} />
        <SidebarNotes setId={setId} note={note} api={api} />
      </div>
    </div>
  );
}

export default Sidebar;
