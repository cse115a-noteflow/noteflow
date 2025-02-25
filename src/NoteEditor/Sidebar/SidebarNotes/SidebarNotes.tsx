import '../Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add, DescriptionOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { PartialNote } from '../../../lib/types';



function SidebarNotes({ setId, api }: { setId: (id: string | null) => void; api: API }) {
  const [notes, setNotes] = useState<PartialNote[]>([]); // Store all notes
  const [filteredNotes, setFilteredNotes] = useState<PartialNote[]>([]); // Store notes based on search/filter
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load more notes from API
  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.getNotes(searchQuery, cursor ?? undefined);
      if (result) {
        const newNotes = result.results.filter(
          (note) => api.hasPermission(note.id, "view") || api.hasPermission(note.id, "edit") || note.owner === api.user?.uid
        );

        // Merge notes while keeping existing ones
        setNotes((prevNotes) => [
          ...prevNotes,
          ...newNotes.filter((n) => !prevNotes.some((note) => note.id === n.id)) // Remove duplicates
        ]);

        setCursor(result.cursor);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
    setLoading(false);
  }

  // Filter notes based on searchQuery
  useEffect(() => {
    if (!searchQuery) {
      setFilteredNotes(notes); // Reset to all notes if search is empty
    } else {
      setFilteredNotes(notes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery, notes]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div className="note-cards">
      <div className="note-filters">
        <div className="search">
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
        {loading && notes.length === 0 && <div>Loading...</div>}
        {filteredNotes.length === 0 && !loading && <div>No notes found</div>}
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="note-card"
            onClick={() => setId(note.id)}
          >
            <DescriptionOutlined />
            <div className="text">
              <h3>{note.title}</h3>
              <p>{note.description}</p>
            </div>
          </div>
        ))}
        {!loading && cursor && (
          <button onClick={loadMore} className="load-more-btn">Load More</button>
        )}
      </div>
    </div>
  );
}

export default SidebarNotes;
