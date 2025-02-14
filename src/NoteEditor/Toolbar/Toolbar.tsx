import { Add, Edit, Menu, TextFields } from '@mui/icons-material';
import Note from '../../lib/Note';
import './Toolbar.css';
import { useState } from 'react';

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
        <button>Share</button>
        <button onClick={() => setStudyShown(true)}>Study</button>
        <button onClick={save} disabled={isSaving}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
