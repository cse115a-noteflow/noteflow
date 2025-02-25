import {
  Add,
  Edit,
  Menu,
  TextFields,
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight
} from '@mui/icons-material';
import Note from '../../../lib/Note';
import './Toolbar.css';
import { useEffect, useState } from 'react';
import getAuthToken from '../../../services/getAuthToken';
import Quill from 'quill';

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
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');

  useEffect(() => {
    if (quill) {
      const updateFormats = () => {
        const formats = quill.getFormat();
        console.log(quill.getContents());
        setActiveFormats(Object.keys(formats));
        if (formats.align) {
          setAlign(formats.align as 'left' | 'center' | 'right');
        } else {
          setAlign('left');
        }
      };
      quill.on('editor-change', updateFormats);
      quill.container.addEventListener('keydown', updateFormats);

      return () => {
        quill.off('editor-change', updateFormats);
        quill.container.removeEventListener('keydown', updateFormats);
      };
    }
  }, [quill]);

  async function save() {
    setIsSaving(true);
    await note.save();
    setIsSaving(false);
  }

  function addText() {
    const newBlock = note.addTextBlock();
    setTimeout(() => note.emit('focus', { id: newBlock.id }), 0);
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

  function toggleFormat(format: string) {
    if (quill) {
      const range = quill.getSelection();
      const formats = quill.getFormat(range ?? undefined);
      if (formats[format]) {
        quill.format(format, false);
        setActiveFormats(activeFormats.filter((f) => f !== format));
      } else {
        quill.format(format, true);
        setActiveFormats([...activeFormats, format]);
      }
    }
  }

  function justify(align: 'left' | 'center' | 'right') {
    if (quill) {
      if (align === 'left') {
        quill.format('align', false);
      } else {
        quill.format('align', align);
      }
    }
  }

  return (
    <div className="toolbar">
      <button className="transparentBtn" onClick={toggleSidebarCollapsed}>
        <Menu />
      </button>
      <hr />
      <p>{note.documentRef ? 'Connected' : 'Disconnected'}</p>
      <div className="tools text">
        <button onClick={addText}>
          <TextFields />
        </button>
        <div className="group">
          <button
            onClick={() => toggleFormat('bold')}
            className={'format ' + (activeFormats.includes('bold') ? 'active' : '')}
          >
            <FormatBold />
          </button>
          <button
            onClick={() => toggleFormat('italic')}
            className={'format ' + (activeFormats.includes('italic') ? 'active' : '')}
          >
            <FormatItalic />
          </button>
          <button
            onClick={() => toggleFormat('underline')}
            className={'format ' + (activeFormats.includes('underline') ? 'active' : '')}
          >
            <FormatUnderlined />
          </button>
          <button
            onClick={() => toggleFormat('strike')}
            className={'format ' + (activeFormats.includes('strike') ? 'active' : '')}
          >
            <FormatStrikethrough />
          </button>
        </div>
        <div className="group">
          <button
            onClick={() => justify('left')}
            className={'format ' + (align === 'left' ? 'active' : '')}
          >
            <FormatAlignLeft />
          </button>
          <button
            onClick={() => justify('center')}
            className={'format ' + (align === 'center' ? 'active' : '')}
          >
            <FormatAlignCenter />
          </button>
          <button
            onClick={() => justify('right')}
            className={'format ' + (align === 'right' ? 'active' : '')}
          >
            <FormatAlignRight />
          </button>
        </div>
      </div>
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
