import API from '../../../lib/API';
import Note from '../../../lib/Note';
import { DescriptionOutlined, Send, ArrowBack, Settings, School } from '@mui/icons-material';
import '../Sidebar.css';
import { useEffect, useState } from 'react';

function SidebarDetails({ note, api }: { note: Note; api: API }) {
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    const update = (type: string) => {
      if (type === 'noteUpdate') forceUpdate((prev) => prev + 1);
    };

    note.addListener(update);
    return () => note.removeListener(update);
  }, []);

  return (
    <div className="sidebar-details">
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
    </div>
  );
}

export default SidebarDetails;
