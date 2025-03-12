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
  const [studyMode, setStudyMode] = useState<StudyMode>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareShown, setShareShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preventRefetch, setPreventRefetch] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'; // Persist theme
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); // Save to localStorage
  }, [isDark]);

  // routing
  const handleSetId = (newId: string | null) => {
    if (newId) {
      navigate(`/note/${newId}`);
    } else {
      // make a new note
      note?.destroySession();
      setNote(new Note(null, api));
      navigate('/note');
    }
  };

  useEffect(() => {
    const loadNote = async () => {
      if (preventRefetch) {
        setPreventRefetch(false);
        return;
      }
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
        }
      } catch (error) {
        console.error('Error loading note:', error);
        navigate('/note');
      }
      setIsLoading(false);
    };

    loadNote();
  }, [params.id, api]);

  useEffect(() => {
    const onNoteSaved = () => {
      if (note?.id && params.id !== note.id) {
        // Don't refetch the note when it saves
        setPreventRefetch(true);
        navigate(`/note/${note.id}`, { replace: true });
      }
    };
    document.addEventListener('noteSaved', onNoteSaved);
    return () => document.removeEventListener('noteSaved', onNoteSaved);
  });

  return (
    <div className="note-editor" data-theme={isDark ? 'dark' : 'light'}>
      <Sidebar
        note={isLoading ? null : note}
        setStudyMode={setStudyMode}
        setId={handleSetId}
        api={api}
        collapsed={sidebarCollapsed}
        isDarkMode={isDark}
        setIsDarkMode={setIsDark}
      />
      {note !== null && studyMode && (
        <Study note={note} mode={studyMode} setStudyMode={setStudyMode} />
      )}
      {note !== null && shareShown && <Share note={note} setShareShown={setShareShown} />}
      {isLoading && (
        <main>
          <div className="toolbar"></div>
          <div className="ql-wrapper">
            <div className="ql-container ql-snow">
              <div className="ql-editor">
                <div
                  className="skeleton"
                  style={{ height: '2em', width: '75%', margin: '0.5em 0' }}
                />
                <div className="skeleton" style={{ height: '1em', margin: '0.5em 0' }} />
                <div className="skeleton" style={{ height: '1em', margin: '0.5em 0' }} />
                <div className="skeleton" style={{ height: '1em', width: '50%' }} />
              </div>
            </div>
          </div>
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
