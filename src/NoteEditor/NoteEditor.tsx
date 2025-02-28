import { useEffect, useState } from 'react';
import API from '../lib/API';
import Note from '../lib/Note';
import Sidebar from './Sidebar/Sidebar';
import './NoteEditor.css';
import Study from './Study/Study';
import Share from './Share/Share';
import Editor from './Editor/Editor';

function NoteEditor({ api }: { api: API }) {
  const [note, setNote] = useState<null | Note>(null);
  const [id, setId] = useState<string | null>(null);
  const [studyShown, setStudyShown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareShown, setShareShown] = useState(false);

  useEffect(() => {
    if (id !== null && note && note.id !== id) {
      setNote(null);
      api.getNote(id).then(setNote).catch(console.error);
    } else if (id === null && note === null) {
      setNote(new Note(null, api));
    } else if (id === null && note && note.id !== null) {
      setNote(new Note(null, api));
    }
  }, [id]);

  return (
    <div className="note-editor">
      <Sidebar note={note} setId={setId} api={api} collapsed={sidebarCollapsed} />
      {note !== null && studyShown && <Study note={note} setStudyShown={setStudyShown} />}
      {note !== null && shareShown && <Share note={note} setShareShown={setShareShown} />}
      {note === null && (
        <main>
          <div className="toolbar"></div>
          <p style={{ marginLeft: 16 }}>Loading...</p>
        </main>
      )}
      {note !== null && (
        <Editor
          note={note}
          setShareShown={setShareShown}
          setStudyShown={setStudyShown}
          toggleSidebarCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
    </div>
  );
}

export default NoteEditor;
