import { useEffect, useState } from 'react';
import API from '../lib/API';
import Note from '../lib/Note';
import Sidebar from './Sidebar/Sidebar';
import './NoteEditor.css';
import Study, { type StudyMode } from './Study/Study';
import Share from './Share/Share';
import Editor from './Editor/Editor';

// routing
import { useParams, useNavigate } from 'react-router-dom';

function NoteEditor({ api }: { api: API }) {
  // routing
  const params = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState<null | Note>(null);
  const [id, setId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareShown, setShareShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   if (id !== null && note && note.id !== id) {
  //     setNote(null);
  //     api.getNote(id).then(setNote).catch(console.error);
  //   } else if (id === null && note === null) {
  //     setNote(new Note(null, api));
  //   } else if (id === null && note && note.id !== null) {
  //     setNote(new Note(null, api));
  //   }
  // }, [id, api]);

  // routing
  const handleSetId = (newId: string | null) => {
    setId(newId);
    if (newId) {
      navigate(`/note/${newId}`);
    } else {
      navigate('/note');
    }
  };

  // routing (update note id to match url)
  // before adding note check:
  // if the user already has permission just display note
  // else if link to the doc is shared (view or edit) then add user to note
  // else might be empty note so return new note
  // otherwise throw error note not loaded
  // useEffect(() => {
  //   async function loadNote() {
  //     console.log('Starting loadNote function');
  //     console.log('params.id:', params.id);
  //     if (params.id !== null) {
  //       console.log('Attempting to load note');
  //       setIsLoading(true);
  //       try {
  //         const loadedNote = await api.getNote(params.id ?? '');
  //         console.log('Loaded note:', loadedNote);
  //         setNote(loadedNote);
  //       } catch (error) {
  //         console.error('Failed to load note:', error);
  //         console.log('Attempting to add from shared link');
  //         try {
  //           const result = await api.addNoteFromSharedLink(params.id ?? '');
  //           console.log('Result from addNoteFromSharedLink:', result);
  //           if (result) {
  //             const sharedNote = await api.getNote(params.id ?? '');
  //             console.log('Shared note loaded:', sharedNote);
  //             setNote(sharedNote);
  //           } else {
  //             console.error('Failed to add shared note');
  //             // Handle the case where the shared link is invalid or expired
  //             setNote(null);
  //           }
  //         } catch (sharedError) {
  //           console.error('Error adding note from shared link:', sharedError);
  //           // Handle the error, maybe set an error state
  //           setNote(null);
  //         }
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     } else {
  //       console.log('Creating new note');
  //       setNote(new Note(null, api));
  //     }
  //   }
  //   loadNote();
  // }, [params.id, api]);
  useEffect(() => {
    const loadNote = async () => {
      // if there isnt an id specified make new note
      if (!params.id) {
        setNote(new Note(null, api));
        return;
      }

      setIsLoading(true);

      try {
        const loadedNote = await api.getNote(params.id);
        if (loadedNote) {
          setNote(loadedNote);
          return;
        }
      } catch (error) {
        console.error('Error loading note attempting share from link:', error);
        // if note is null user has no permissions

        try {
          const result = await api.addNoteFromSharedLink(params.id);
          if (result) {
            const sharedNote = await api.getNote(params.id);
            if (sharedNote) {
              alert('Note shared via link!');
              setNote(sharedNote);
              return;
            } else {
              throw new Error('Failed to display note after adding to user.');
            }
          } else {
            alert('The link is invalid or has expired.');
            setNote(null);
          }
        } catch (shareError) {
          console.error('Unexpected error while sharing from link:', error);
          alert('An internal error occurred while attempting to share from link.');
        }
        console.error('Unexpected error while loading note:', error);
        setNote(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadNote();
  }, [params.id, api]);

  return (
    <div className="note-editor">
      <Sidebar
        note={note}
        setStudyMode={setStudyMode}
        setId={handleSetId}
        api={api}
        collapsed={sidebarCollapsed}
      />
      {note !== null && studyMode && (
        <Study note={note} mode={studyMode} setStudyMode={setStudyMode} />
      )}
      {note !== null && shareShown && <Share note={note} setShareShown={setShareShown} />}
      {note === null && !isLoading && (
        <main>
          <div className="toolbar"></div>
          <p style={{ marginLeft: 16 }}>Loading...</p>
        </main>
      )}
      {note !== null && !isLoading && (
        <Editor
          note={note}
          setShareShown={setShareShown}
          toggleSidebarCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
    </div>
  );
}

export default NoteEditor;
