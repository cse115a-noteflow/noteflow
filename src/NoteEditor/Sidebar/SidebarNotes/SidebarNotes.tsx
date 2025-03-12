import '../Sidebar.css';
import type API from '../../../lib/API';
import {
  Search,
  VerticalAlignTop,
  VerticalAlignBottom,
  Add,
  Close,
  EditOffOutlined
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { PartialNote } from '../../../lib/types';
import Note from '../../../lib/Note';
import { throttle } from 'lodash';
import NoteItem from './NoteItem';

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
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [attemptDelete, setAttemptDelete] = useState<PartialNote | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function loadMore(reset = false) {
    console.log('Loading notes');
    let oldNotes = notes;
    let oldCursor = cursor;
    if (reset) {
      oldNotes = [];
      setNotes([]);
      oldCursor = null;
      setCursor(null);
    }
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.getNotes(searchQuery, sortOrder, oldCursor);
      if (result) {
        setNotes([...oldNotes, ...result.results]);
        setCursor(result.cursor);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
    setLoading(false);
  }

  async function handleDelete(noteToDelete: PartialNote) {
    setLoadingDelete(true);
    if (note?.id === noteToDelete.id) {
      setId(null);
    }
    if (noteToDelete.id) {
      try {
        await api.deleteNote(noteToDelete.id);
        setAttemptDelete(null);
        loadMore(true);
      } catch {
        alert("Couldn't delete the note.");
      }
    }
    setLoadingDelete(false);
  }

  const throttleLoad = throttle(() => loadMore(true), 2000, {
    leading: true,
    trailing: false
  });

  useEffect(() => {
    throttleLoad();
  }, [sortOrder, searchQuery]);

  useEffect(() => {
    function handleNoteSaved() {
      loadMore(true);
    }
    document.addEventListener('noteSaved', handleNoteSaved);
    return () => document.removeEventListener('noteSaved', handleNoteSaved);
  }, []);

  return (
    <div className="note-cards">
      <div className="note-filters">
        <div className="search">
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => {
              if (e.target.value !== searchQuery) setSearchQuery(e.target.value);
            }}
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')}>
              <Close />
            </button>
          ) : (
            <Search />
          )}
        </div>
        <button
          style={{ flexGrow: 0 }}
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <VerticalAlignTop /> : <VerticalAlignBottom />}
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
        {notes.length === 0 && !loading && (
          <div className="initial">
            <EditOffOutlined fontSize="large" />
            When you save a note to the cloud, it'll show up here.
          </div>
        )}
        {notes.map((noteItem) => (
          <NoteItem
            key={noteItem.id}
            note={noteItem}
            setId={setId}
            selected={note?.id === noteItem.id}
            owned={noteItem.owner === api.user?.uid}
            onDelete={() => setAttemptDelete(noteItem)}
          />
        ))}
        {!loading && cursor && (
          <button onClick={() => loadMore()} className="load-more-btn">
            Load More
          </button>
        )}
        {loading && (
          <>
            <div className="skeleton" style={{ height: 75, borderRadius: 20 }} />
            <div className="skeleton" style={{ height: 75, borderRadius: 20 }} />
            <div className="skeleton" style={{ height: 75, borderRadius: 20 }} />
          </>
        )}
        {/* Delete */}
        {attemptDelete && (
          <div className="modal" onClick={() => setAttemptDelete(null)}>
            <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
              <h2>Delete "{attemptDelete.title}"?</h2>
              <p>This action cannot be undone.</p>
              <div className="btn-row">
                <button onClick={() => setAttemptDelete(null)}>Cancel</button>
                <button
                  className="danger-btn"
                  disabled={loadingDelete}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(attemptDelete);
                  }}
                >
                  Yes, I really want to delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SidebarNotes;
