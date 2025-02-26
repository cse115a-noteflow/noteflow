import { Add, Edit, Menu, TextFields } from '@mui/icons-material';
import Note from '../../lib/Note';
import './Toolbar.css';
import { useState } from 'react';
import getAuthToken from '../../services/getAuthToken';

function Toolbar({ note, setStudyShown }: { note: Note; setStudyShown: (value: boolean) => void }) {
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    await note.save();
    setIsSaving(false);
  }

  function addText() {
    const newBlock = note.addTextBlock();
    setTimeout(() => note.emit('focus', { id: newBlock.id }), 0);
  }

  async function addMedia() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*, video/*';
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      /*
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.uploadMedia(formData);
      if (response.success) {
        note.addMediaBlock(
          api.getMediaURL(response.id),
          response.type,
          response.width,
          response.height
        );
      }
      */
      // local for now
      note.addMediaBlock(URL.createObjectURL(file), file.type, 0, 0);
      input.remove();
    };
  }

  async function shareNote() {
    const userId = note.api.user?.uid;
    if (!userId) return false;
    if (
      note.owner != userId &&
      note.permissions?.[userId] != 'edit' &&
      !note.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    const recipientEmail = prompt('Enter the email of the user you want to share this note with:');
    if (!recipientEmail) return;

    const permission = confirm('Click OK to share as an EDITOR, or Cancel to share as a VIEWER')
      ? 'edit'
      : 'view';

    try {
      const authToken = await getAuthToken(); // Implement this function to get the Firebase token
      const response = await fetch(`http://localhost:5000/notes/${note.id}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: recipientEmail, permission })
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
      <button className="transparentBtn">
        <Menu />
      </button>
      <hr />
      <div className="tools-text">
        <button onClick={addText}>
          <TextFields />
        </button>
      </div>
      <div className="tools-scribble">
        <button onClick={() => note.addScribbleBlock()}>
          <Edit />
        </button>
      </div>
      <div className="tools-media">
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
