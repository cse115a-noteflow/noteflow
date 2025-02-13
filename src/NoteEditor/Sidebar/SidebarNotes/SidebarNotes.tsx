import '../Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add } from '@mui/icons-material';
import Note from '../../../lib/Note';
import { useEffect, useState } from 'react';

function SidebarNotes({
  note,
  setId,
  api
}: {
  note: Note | null;
  setId: (id: string | null) => void;
  api: API;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);

  useEffect(() => {
    api.getNotes().then(setNotes).catch(console.error);
  }, []);

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
        <button style={{ flexGrow: 0 }} onClick={() => setId(null)}>
          <Add />
        </button>
      </div>
      <div className="note-list">
        {notes === null && <div>Loading...</div>}
        {notes !== null &&
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-card ${note.id === (note?.id || null) ? 'selected' : ''}`}
              onClick={() => setId(note.id)}
            >
              <h3>{note.title}</h3>
              <p>{note.description}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SidebarNotes;
