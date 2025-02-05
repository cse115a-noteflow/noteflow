import { useEffect, useState } from 'react';
import API from '../lib/API';
import Note from '../lib/Note';
import Sidebar from './Sidebar/Sidebar';
import Toolbar from './Toolbar/Toolbar';
import BlockRenderer from './BlockRenderer/BlockRenderer';
import './NoteEditor.css';

function NoteEditor({ id, api }: { id: string; api: API }) {
  const [note, setNote] = useState<null | Note>(null);

  useEffect(() => {
    api.getNoteById(id).then(setNote).catch(console.error);
  }, [id]);

  if (note === null) {
    // loading state
    return <div>Loading...</div>;
  }

  return (
    <div className="note-editor">
      <Sidebar note={note} api={api} />
      <main>
        <Toolbar note={note} api={api} />
        <div className="main-inner">
          <BlockRenderer note={note} />
        </div>
      </main>
    </div>
  );
}

export default NoteEditor;
