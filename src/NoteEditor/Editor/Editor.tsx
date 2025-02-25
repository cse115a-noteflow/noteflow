import { useCallback, useEffect, useRef, useState } from 'react';
import Note from '../../lib/Note';
import Toolbar from './Toolbar/Toolbar';
import '../NoteEditor.css';
import Quill from 'quill';
import QuillEditor from './QuillEditor';
import { throttle } from 'lodash';
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';

function Editor({
  note,
  setStudyShown,
  toggleSidebarCollapsed
}: {
  note: Note;
  setStudyShown: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
}) {
  // Need to use useCallback here so that we know when the Ref is updated
  const [quill, setQuill] = useState<Quill | null>(null);
  const quillRef = useCallback((quill: Quill | null) => {
    setQuill(quill);
  }, []);

  // Real time features
  const [isEditing, setIsEditing] = useState(false);

  const isLocalChange = useRef(false);

  // Save content to Firestore with throttle
  const saveContent = throttle(() => {
    if (quill && isLocalChange.current && note.documentRef) {
      const content = quill.getContents();
      console.log('Saving content to Firestore:', content);
      setDoc(note.documentRef, { content: content.ops }, { merge: true })
        .then(() => console.log('Content saved successfully'))
        .catch(console.error);
      isLocalChange.current = false; // Reset local change flag after saving
    }
  }, 1000);

  useEffect(() => {
    if (quill && note.documentRef) {
      // Load initial content from Firestore
      getDoc(note.documentRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const savedContent = docSnap.data().content;
            if (savedContent) {
              quill.setContents(savedContent);
            }
          } else {
            console.log('No document found, starting with empty editor.');
          }
        })
        .catch(console.error);

      // Listen for Firestore document updates in real-time
      const unsubscribe = onSnapshot(note.documentRef, (snapshot) => {
        if (snapshot.exists()) {
          const newContent = snapshot.data().content;

          if (!isEditing) {
            const currentCursorPosition = quill.getSelection()?.index || 0; // Get the current cursor position

            // Apply content update silently to avoid triggering `text-change`
            quill.setContents(newContent, 'silent');

            // Restore cursor position after content update
            quill.setSelection(currentCursorPosition);
          }
        }
      });

      // Listen for local text changes and save to Firestore
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          isLocalChange.current = true; // Mark change as local
          setIsEditing(true);
          saveContent();

          // Reset editing state after 5 seconds of inactivity
          setTimeout(() => setIsEditing(false), 5000);
        }
      });

      return () => {
        unsubscribe();
        quill.off('text-change');
      };
    }
  }, []);

  return (
    <main>
      <Toolbar
        note={note}
        quill={quill}
        setStudyShown={setStudyShown}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
      />
      <QuillEditor ref={quillRef} />
    </main>
  );
}

export default Editor;
