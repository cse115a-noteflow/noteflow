import { useCallback, useEffect, useState } from 'react';
import Note from '../../lib/Note';
import Toolbar from './Toolbar/Toolbar';
import '../NoteEditor.css';
import Quill from 'quill';
import QuillEditor from './QuillEditor';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';

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
  const quillRef = useCallback((quill: Quill | null) => {
    setQuill(quill);
  }, []);
  const [editorMode, setEditorMode] = useState<'text' | 'scribble'>('text');
  const { editor, onReady } = useFabricJSEditor();

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
        }
      });
      return () => note.destroySession();
    }
  }, [quill, note.documentRef]);

  return (
    <main>
      <Toolbar
        note={note}
        quill={quill}
        fabric={editor ?? null}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        setShareShown={setShareShown}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
      />
      <QuillEditor
        key={note.id}
        placeholder="Write something new..."
        defaultValue={note.import()}
        ref={quillRef}
      />
      <FabricJSCanvas className="fabric-canvas" onReady={onReady} />
    </main>
  );
}

export default Editor;
