import { Add, Edit, Menu } from '@mui/icons-material';
import Note from '../../../lib/Note';
import './Toolbar.css';
import { useState } from 'react';
import Quill from 'quill';
import TextToolbar from './TextToolbar/TextToolbar';

function Toolbar({
  note,
  quill,
  setStudyShown,
  setShareShown,
  toggleSidebarCollapsed
}: {
  note: Note;
  quill: Quill | null;
  setStudyShown: (value: boolean) => void;
  setShareShown: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    await note.save();
    setIsSaving(false);
  }

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
        quill.insertEmbed(quill.getSelection()?.index ?? 0, 'image', response);
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
      <p>{note.documentRef ? 'Connected' : 'Disconnected'}</p>
      {quill && <TextToolbar quill={quill} />}
      <div className="tools scribble">
        <button onClick={() => note.addScribbleBlock()}>
          <Edit />
        </button>
      </div>
      <div className="tools media">
        <button onClick={addMedia}>
          <Add />
        </button>
      </div>
      <div style={{ flexGrow: '1' }} />
      <div className="tools-share">
        <button onClick={() => setShareShown(true)}>Share</button>
        <button onClick={() => setStudyShown(true)}>Study</button>
        <button onClick={save} disabled={isSaving}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
