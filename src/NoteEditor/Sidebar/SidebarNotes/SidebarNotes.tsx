import './Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add } from '@mui/icons-material';
import Note from '../../../lib/Note';

function SidebarNotes({ note, api }: { note: Note; api: API }) {
  return (
    <div className="note-cards">
      <div className="note-filters">
        <div className="search">
          <input type="text" placeholder="Search notes" />
          <Search />
        </div>
        <button style={{ flexGrow: 0 }}>
          <FilterAltOutlined />
        </button>
        <button style={{ flexGrow: 0 }}>
          <Add />
        </button>
      </div>
    </div>
  );
}

export default SidebarNotes;
