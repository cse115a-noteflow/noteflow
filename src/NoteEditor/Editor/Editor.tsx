import { useCallback, useEffect, useState } from 'react';
import Note from '../../lib/Note';
import Toolbar from './Toolbar/Toolbar';
import '../NoteEditor.css';
import Quill from 'quill';
import QuillEditor from './QuillEditor';
import IinkEditor from './IinkEditor';
import { InteractiveInkEditor } from 'iink-ts';

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
  // Fabric
  const [editorMode, setEditorMode] = useState<'text' | 'scribble'>('text');
  const [iink, setIink] = useState<InteractiveInkEditor | null>(null);
  const iinkRef = useCallback((editor: InteractiveInkEditor | null) => {
    setIink(editor);
  }, []);
  const [editorHeight, setEditorHeight] = useState(62);

  function focusFirstLine() {
    if (!quill) return;
    console.log('Focusing first line');
    const firstLine = quill.getLines(0, 1);
    quill.setSelection(Math.max(0, firstLine[0].length() - 1), 'silent');
    console.log(firstLine[0]);
    quill.focus();
  }

  function calculateHeight() {
    let height = 62;
    if (!quill) return height;
    const quillContainer = quill.container;
    if (quillContainer) {
      height = quillContainer.getBoundingClientRect().height || 62;
    }

    if (note.iink) {
      console.log(note.iink.model.height);
      height = Math.max(height, note.iink.model.height);
    }
    return height;
  }

  useEffect(() => {
    if (quill) {
      note.quill = quill;
      note.createSession();
      note.addListener((type) => {
        if (type === 'realtime-start') {
          focusFirstLine();
        }
        setEditorHeight(calculateHeight());
      });
      return () => note.destroySession();
    }
  }, [quill, note.documentRef]);

  useEffect(() => {
    if (iink) {
      note.initializeIink(iink);
    }
  }, [iink]);

  return (
    <main>
      <Toolbar
        note={note}
        quill={quill}
        iink={iink}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        setShareShown={setShareShown}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
      />
      <div className="editor-wrapper" style={{ height: editorHeight }}>
        <QuillEditor
          key={note.id}
          placeholder="Write something new..."
          defaultValue={note.import()}
          readOnly={editorMode === 'scribble'}
          ref={quillRef}
        />
        <IinkEditor
          style={{ pointerEvents: editorMode === 'scribble' ? 'all' : 'none' }}
          height={window.innerHeight - 100}
          width={700}
          ref={iinkRef}
        />
      </div>
    </main>
  );
}

export default Editor;
