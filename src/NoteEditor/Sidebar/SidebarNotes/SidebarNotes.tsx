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
  const [notes, setNotes] = useState<PartialNote[]>([]); // Store all notes
  const [filteredNotes, setFilteredNotes] = useState<PartialNote[]>([]); // Store notes based on search/filter
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.getNotes(undefined, cursor ?? undefined);
      if (result) {
        console.log('Fetched notes:', result);
        setNotes(
          [...notes, ...result.results].filter(
            (note, index, self) => self.findIndex((n) => n.id === note.id) === index // Remove duplicates
          )
        );
        setCursor(result.cursor);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
    setLoading(false);
  }

  // Filter notes based on searchQuery and sort order
  useEffect(() => {
    let sortedNotes = [...notes];

    if (searchQuery) {
      sortedNotes = sortedNotes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    sortedNotes.sort((a, b) =>
      sortOrder === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title)
    );

    setFilteredNotes(sortedNotes);
  }, [searchQuery, notes, sortOrder]);

  useEffect(() => {
    console.log('Loading notes');
    setNotes([]);
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
        <button
          style={{ flexGrow: 0 }}
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
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
        {(filteredNotes.length === 0 && loading) && <div>Loading...</div>}
        {filteredNotes.length === 0 && !loading && <div>No notes found</div>}
        {filteredNotes.map((note) => (
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
        {!loading && cursor && (
          <button onClick={loadMore} className="load-more-btn">Load More</button>
        )}
      </div>
    </div>
  );
}

export default SidebarNotes;
