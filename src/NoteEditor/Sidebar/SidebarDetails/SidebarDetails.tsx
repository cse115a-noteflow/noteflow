import API from '../../../lib/API';
import Note from '../../../lib/Note';
import { DescriptionOutlined, Send, ArrowBack, Settings, School } from '@mui/icons-material';
import '../Sidebar.css';
import { useEffect, useState } from 'react';

function SidebarDetails({ note, api }: { note: Note; api: API }) {
  const [_, forceUpdate] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(note.title);

  const submitName = () => {
    note?.setTitle(draftName);
    setEditing(false);
  };

  useEffect(() => {
    const update = (type: string) => {
      if (type === 'noteUpdate') forceUpdate((prev) => prev + 1);
    };

    note.addListener(update);
    return () => note.removeListener(update);
  }, []);

  useEffect(() => {
    if (editing) {
      const input: HTMLInputElement | null = document.querySelector('.sidebar-details input.title');
      if (input) {
        input.focus();
        input.addEventListener('blur', () => setEditing(false));
      }
    }
  }, [editing]);

  return (
    <div className="sidebar-details">
      <div className="sidebar-header">
        <DescriptionOutlined fontSize="large" />
        <div className="text">
          {!editing && <h2 onClick={() => setEditing(true)}>{note.title}</h2>}
          {editing && (
            <input
              className="title"
              defaultValue={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={submitName}
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
            />
          )}
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
