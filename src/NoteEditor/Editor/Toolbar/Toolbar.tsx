import { Add, Menu, Wifi, WifiOff } from '@mui/icons-material';
import Note from '../../../lib/Note';
import './Toolbar.css';
import { useEffect, useState } from 'react';
import Quill from 'quill';
import TextToolbar from './TextToolbar/TextToolbar';

function Toolbar({
  note,
  quill,
  setShareShown,
  hasEditPermissions,
  toggleSidebarCollapsed
}: {
  note: Note;
  quill: Quill | null;
  setShareShown: (value: boolean) => void;
  hasEditPermissions: boolean;
  toggleSidebarCollapsed: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharable, setIsSharable] = useState(false);

  async function save() {
    if (!quill) return;
    setIsSaving(true);
    note.export(quill.getContents());
    await note.save();
    setIsSaving(false);
    setIsSharable(true);

    document.dispatchEvent(new CustomEvent('noteSaved'));
  }

  function detectSave(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      e.stopPropagation();
      if (!isSaving) save();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', detectSave);
    return () => {
      document.removeEventListener('keydown', detectSave);
    };
  });

  useEffect(() => {
    if (note.owner === note.api.user?.uid) {
      setIsSharable(true);
    } else {
      setIsSharable(false);
    }
  }, [note.id]);

  function addMedia() {
    if (!quill) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !note || !quill) return;
      const response = await note.uploadMedia(file);
      if (response !== null) {
        quill.insertEmbed(quill.getSelection()?.index ?? 0, 'image', response, 'user');
      } else {
        alert('Failed to upload media. Try again later.');
      }
      input.remove();
    };
  }

  return (
    <div className="toolbar">
      <button className="transparentBtn" onClick={toggleSidebarCollapsed}>
        <Menu />
      </button>
      <hr />
      {hasEditPermissions && (
        <>
          {quill && <TextToolbar quill={quill} />}
          <div className="tools media">
            <button onClick={addMedia}>
              <Add />
            </button>
          </div>
        </>
      )}
      <div style={{ flexGrow: '1' }} />
      <span>{note.documentRef ? <Wifi /> : <WifiOff />}</span>
      <div className="tools-share">
        {isSharable && (
          <button disabled={!note.documentRef} onClick={() => setShareShown(true)}>
            Share
          </button>
        )}
        <button onClick={save} disabled={isSaving || !hasEditPermissions}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
