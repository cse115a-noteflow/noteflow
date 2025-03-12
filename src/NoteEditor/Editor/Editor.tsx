import { useCallback, useEffect, useState } from 'react';
import Note from '../../lib/Note';
import Toolbar from './Toolbar/Toolbar';
import '../NoteEditor.css';
import Quill from 'quill';
import QuillEditor from './QuillEditor';

function Editor({
  note,
  setShareShown,
  toggleSidebarCollapsed
}: {
  note: Note;
  setShareShown: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
}) {
  // Need to use useCallback here so that we know when the Ref is updated
  const [quill, setQuill] = useState<Quill | null>(null);
  const [hasEditPermissions, setHasEditPermissions] = useState(false);
  const quillRef = useCallback((quill: Quill | null) => {
    setQuill(quill);
  }, []);

  useEffect(() => {
    setHasEditPermissions(note.hasEditPermissions());
  }, [note.permissions.global, note.permissions.edit, note.owner]);

  function focusFirstLine() {
    if (!quill) return;
    console.log('Focusing first line');
    const firstLine = quill.getLines(0, 1);
    quill.setSelection(Math.max(0, firstLine[0].length() - 1), 'silent');
    console.log(firstLine[0]);
    quill.focus();
  }

  useEffect(() => {
    if (quill) {
      note.quill = quill;
      note.createSession();
      note.addListener((type) => {
        if (type === 'realtime-start') {
          focusFirstLine();
        } else if (type === 'noteUpdate') {
          setHasEditPermissions(note.hasEditPermissions());
        }
      });
      return () => note.destroySession();
    }
  }, [quill, note.documentRef]);

  return (
    <main key={note.id}>
      <Toolbar
        note={note}
        quill={quill}
        hasEditPermissions={hasEditPermissions}
        setShareShown={setShareShown}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
      />
      <QuillEditor
        key={note.id}
        placeholder="Write something new..."
        defaultValue={note.import()}
        readOnly={!hasEditPermissions}
        ref={quillRef}
      />
    </main>
  );
}

export default Editor;
