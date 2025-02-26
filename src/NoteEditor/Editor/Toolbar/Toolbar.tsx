import { Add, Edit, Menu } from '@mui/icons-material';
import Note from '../../../lib/Note';
import './Toolbar.css';
import { useEffect, useState } from 'react';
import getAuthToken from '../../../services/getAuthToken';
import Quill from 'quill';
import TextToolbar from './TextToolbar/TextToolbar';

function Toolbar({
  note,
  quill,
  setStudyShown,
  toggleSidebarCollapsed
}: {
  note: Note;
  quill: Quill | null;
  setStudyShown: (value: boolean) => void;
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

  async function shareNote() {
    const recipientEmail = prompt('Enter the email of the user you want to share this note with:');
    if (!recipientEmail) return;

    try {
      const authToken = await getAuthToken(); // Implement this function to get the Firebase token
      const response = await fetch(`http://localhost:5000/notes/${note.id}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: recipientEmail, permission: 'editor' })
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Note shared successfully with ${recipientEmail}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      alert('An unexpected error occurred.');
    }
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
        <button onClick={shareNote}>Share</button>
        <button onClick={() => setStudyShown(true)}>Study</button>
        <button onClick={save} disabled={isSaving}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
