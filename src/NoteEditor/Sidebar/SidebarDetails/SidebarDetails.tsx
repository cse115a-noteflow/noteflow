import Note from '../../../lib/Note';
import API from '../../../lib/API';
import {
  DescriptionOutlined,
  Send,
  Settings,
  School,
  ContentCopy,
  Close,
  Notes
} from '@mui/icons-material';
import '../Sidebar.css';
import { useEffect, useState } from 'react';
import { type StudyMode } from '../../Study/Study';
import SettingsMenu from '../../Settings/Settings';

function SidebarDetails({
  note,
  setStudyMode,
  api
}: {
  note: Note | null;
  setStudyMode: (value: StudyMode) => void;
  api: API;
}) {
  const [_, forceUpdate] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(note?.title ?? 'Untitled Note');
  // RAG search
  const [isSaved, setIsSaved] = useState(false);
  const [query, setQuery] = useState('');
  const [loadingResult, setLoadingResult] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [settingsShown, setSettingsShown] = useState(false);

  function submitName() {
    note?.setTitle(draftName);
    setEditing(false);
  }

  async function search() {
    if (note && query && !loadingResult) {
      setLoadingResult(true);
      const result = await note.search(query);
      setSearchResult(result);
      setLoadingResult(false);
    }
  }

  function closeSearchResult() {
    setSearchResult(null);
  }

  function copySearchResult() {
    if (searchResult) {
      navigator.clipboard.writeText(searchResult);
    }
  }

  useEffect(() => {
    if (!note) {
      // reset ai stuff
      setLoadingResult(false);
      setSearchResult(null);
      return;
    }
    const update = (type: string) => {
      if (type === 'noteUpdate') {
        forceUpdate((prev) => prev + 1);
      }
      if (type === 'save') {
        setIsSaved(!!note.id);
      }
    };
    setIsSaved(!!note.id);

    note.addListener(update);
    return () => note.removeListener(update);
  }, [note]);

  useEffect(() => {
    setDraftName(note?.title ?? 'Untitled Note');
  }, [note?.title]);

  useEffect(() => {
    if (editing) {
      const input: HTMLInputElement | null = document.querySelector('.sidebar-details input.title');
      if (input) {
        input.focus();
        input.addEventListener('blur', () => setEditing(false));
      }
    }
  }, [editing]);

  return (
    <div className="sidebar-details">
      <div className="sidebar-header">
        <DescriptionOutlined fontSize="large" />
        {note === null && <div style={{ height: '2em' }} className="skeleton" />}
        {note !== null && (
          <div className="text">
            {!editing && <h2 onClick={() => setEditing(true)}>{note?.title}</h2>}
            {editing && (
              <input
                className="title"
                defaultValue={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={submitName}
                onKeyDown={(e) => e.key === 'Enter' && submitName()}
              />
            )}
            <p>{note ? note.description : ''}</p>
          </div>
        )}
      </div>
      <div className="sidebar-actions">
        {(loadingResult || searchResult) && (
          <div className="search-result">
            {!loadingResult ? (
              <>
                <div className="btn-row search-actions">
                  <b>NoteFlow AI</b>
                  <span style={{ flexGrow: 1 }} />
                  <button onClick={copySearchResult}>
                    <ContentCopy />
                  </button>
                  <button onClick={closeSearchResult}>
                    <Close />
                  </button>
                </div>
                <p>{searchResult}</p>
              </>
            ) : (
              <>
                <div className="btn-row search-actions">
                  <b>NoteFlow AI</b>
                  <span style={{ flexGrow: 1 }} />
                </div>
                <span className="skeleton" />
                <span className="skeleton" style={{ animationDelay: '0.2s' }} />
                <span className="skeleton" style={{ animationDelay: '0.4s', width: '50%' }} />
              </>
            )}
          </div>
        )}
        {!isSaved && (
          <div className="search disabled">
            <span>Save your note to search it</span>
            <button>
              <Send />
            </button>
          </div>
        )}
        {isSaved && (
          <div className={'search ' + (loadingResult || note === null ? 'disabled' : '')}>
            <input
              type="text"
              defaultValue={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && search()}
              placeholder="Ask about your note..."
            />
            <button onClick={search} disabled={loadingResult}>
              <Send />
            </button>
          </div>
        )}
        <div className="btn-row">
          <button onClick={() => setSettingsShown(true)}>
            <Settings />
          </button>
          {api !== null && settingsShown && (
            <SettingsMenu api={api} setSettingsShown={setSettingsShown} />
          )}
          <button
            title="Generate flashcards"
            onClick={() => setStudyMode('flashcards')}
            disabled={note === null || !isSaved}
          >
            <School />
          </button>
          <button
            title="Generate a summary"
            onClick={() => setStudyMode('summary')}
            disabled={note === null || !isSaved}
          >
            <Notes />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SidebarDetails;
