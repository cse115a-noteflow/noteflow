import { useEffect, useState } from 'react';
import API from '../lib/API';
import Note from '../lib/Note';
import Sidebar from './Sidebar/Sidebar';
import Toolbar from './Toolbar/Toolbar';
import BlockRenderer from './BlockRenderer/BlockRenderer';
import './NoteEditor.css';

function NoteEditor({ api }: { api: API }) {
  const [note, setNote] = useState<null | Note>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (id !== null && note && note.id !== id) {
      api.getNote(id).then(setNote).catch(console.error);
    } else if (id === null && note === null) {
      setNote(new Note(null, api));
      setTimeout(() => {
        // Focus first note block
        const block = document.querySelector('.note-editor .block.block-text');
        if (block) (block as HTMLElement).focus();
      }, 0);
    }
  }, [id]);

  return (
    <div className="note-editor">
      <Sidebar note={note} setId={setId} api={api} />
      {note === null && <div>Loading...</div>}
      {note !== null && (
        <main>
          <Toolbar note={note} api={api} />
          <div className="main-inner">
            <BlockRenderer note={note} />
          </div>
        </main>
      )}
    </div>
  );
}

export default NoteEditor;
