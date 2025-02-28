import '../Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add, DescriptionOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { PartialNote } from '../../../lib/types';
import Note from '../../../lib/Note';

function SidebarNotes({
  setId,
  note,
  api
}: {
  setId: (id: string | null) => void;
  note: Note | null;
  api: API;
}) {
  const [notes, setNotes] = useState<PartialNote[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    const result = await api.getNotes(undefined, cursor ?? undefined);
    console.log('Fetched notes:', result);
    if (result) {
      // permission filtering is already done on backend
      setNotes(
        [...(notes || []), ...result.results].filter(
          // Remove duplicates
          (note, index, self) => self.findIndex((n) => n.id === note.id) === index
        )
      );
      setCursor(result.cursor);
    }
    setLoading(false);
  }

  useEffect(() => {
    console.log('Loading notes');
    setNotes(null);
    loadMore();
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
        <button
          className={note && note.id === '' ? 'active' : ''}
          style={{ flexGrow: 0 }}
          onClick={() => setId(null)}
        >
          <Add />
        </button>
      </div>
      <div className="note-list">
        {(notes === null || loading) && <div>Loading...</div>}
        {notes !== null &&
          !loading &&
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-card ${note.id === (note?.id || null) ? 'selected' : ''}`}
              onClick={() => setId(note.id)}
            >
              <DescriptionOutlined />
              <div className="text">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SidebarNotes;
