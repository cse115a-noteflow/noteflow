import '../Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add, DescriptionOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { PartialNote } from '../../../lib/types';


function SidebarNotes({ setId, api }: { setId: (id: string | null) => void; api: API }) {
  const [notes, setNotes] = useState<PartialNote[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState<"title"|"created"|"modified">("modified")

  async function loadMore() {
    
    if (loading) return;
    setLoading(true);
    const result = await api.getNotes(undefined, cursor ?? undefined);
    console.log("Fetched notes:", result);
    if (result) {
      const filteredNotes = result.results.filter((note) =>
        api.hasPermission(note.id, "view") || api.hasPermission(note.id, "edit") || note.owner === api.user?.uid
      );
      
      setNotes(
        [...(notes || []), ...filteredNotes].filter(
          // Remove duplicates
          (note, index, self) => self.findIndex((n) => n.id === note.id) === index
        )
      );
      setCursor(result.cursor);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMore();
  }, []);

  const sortedNotes = notes
    ? [...notes].sort((a, b) => {
        if (sortOption === "title") {
          return a.title.localeCompare(b.title);
        } else if (sortOption === "created") {
          return (a.createdAt || 0) - (b.createdAt || 0);
        } else {
          return (b.modifiedAt || 0) - (a.modifiedAt || 0);
        }
      })
    : [];

  return (
    <div className="note-cards">
      <div className="note-filters">
        <div className="search">
          <input type="text" placeholder="Search notes" />
          <Search />
        </div>
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value as "title" | "created" | "modified")}>
          <option value="modified">Last Modified</option>
          <option value="created">Creation Date</option>
          <option value="title">Title</option>
        </select>
        <button style={{ flexGrow: 0 }}>
          <FilterAltOutlined />
        </button>
        <button style={{ flexGrow: 0 }} onClick={() => setId(null)}>
          <Add />
        </button>
      </div>
      <div className="note-list">
        {(notes === null || loading) && <div>Loading...</div>}
        {notes !== null &&
          !loading &&
          sortedNotes.map((note) => (
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
