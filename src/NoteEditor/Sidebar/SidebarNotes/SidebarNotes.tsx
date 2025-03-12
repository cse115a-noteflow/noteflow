import '../Sidebar.css';
import type API from '../../../lib/API';
import { Search, FilterAltOutlined, Add, DescriptionOutlined, Delete } from '@mui/icons-material';
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
  const [deleteShown, setDeleteShown] = useState(false);

  async function loadMore(reset = false) {
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.getNotes(undefined, reset ? undefined : cursor ?? undefined);
      if (result) {
        console.log('Fetched notes:', result);

        setNotes(prevNotes => reset ? result.results : [...prevNotes, ...result.results]
          .filter((note, index, self) => self.findIndex(n => n.id === note.id) === index) // Remove duplicates
        );

        setCursor(result.cursor);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
    setLoading(false);
  }

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
    loadMore(true);
  }, []);

  useEffect(() => {
    function handleNoteSaved() {
      console.log("Note saved, reloading notes...");
      setNotes([]);
      setCursor(null);
      loadMore(true);
    }
    document.addEventListener("noteSaved", handleNoteSaved);
    return () => document.removeEventListener("noteSaved", handleNoteSaved);
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
            <button onClick = {() => setDeleteShown(true)}><Delete/></button>
          </div>
        ))}
        {!loading && cursor && (
          <button onClick={() => loadMore()} className="load-more-btn">Load More</button>
        )}
        
        {note && note.owner === api.user?.uid && deleteShown &&(
          <div className="modal" onClick={() => setDeleteShown(false)}>
            <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
              <h2>Delete "{note.title}"?</h2>
              <p>This action cannot be undone.</p>
              <div className="button-container">
                <button onClick = {()=> setDeleteShown(false)}>Cancel</button>
                <button onClick={(e) => {e.preventDefault(); note.destroySession(); api.deleteNote(note.id); setDeleteShown(false); loadMore(true)}}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SidebarNotes;

