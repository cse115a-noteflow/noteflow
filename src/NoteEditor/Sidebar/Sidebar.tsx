import './Sidebar.css';
import type API from '../../lib/API';
import {
  DescriptionOutlined,
  Send,
  ArrowBack,
  Settings,
  School,
  Search,
  FilterAltOutlined,
  Add
} from '@mui/icons-material';
import Note from '../../lib/Note';

function Sidebar({ note, api }: { note: Note; api: API }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <DescriptionOutlined fontSize="large" />
        <div className="text">
          <h2>{note.title}</h2>
          <p>{note.description}</p>
        </div>
      </div>
      <div className="sidebar-actions">
        <div className="search">
          <input type="text" placeholder="Ask about your note..." />
          <Send />
        </div>
        <div className="btn-row">
          <button>
            <ArrowBack />
          </button>
          <button>
            <Settings />
          </button>
          <button>
            <School />
          </button>
        </div>
      </div>
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
    </div>
  );
}

export default Sidebar;
