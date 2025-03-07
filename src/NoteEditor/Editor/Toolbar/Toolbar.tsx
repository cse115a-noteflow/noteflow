import { Add, Edit, TextFields, Menu, Wifi, WifiOff } from '@mui/icons-material';
import Note from '../../../lib/Note';
import './Toolbar.css';
import { useEffect, useState } from 'react';
import Quill from 'quill';
import TextToolbar from './TextToolbar/TextToolbar';
import ScribbleToolbar from './ScribbleToolbar/ScribbleToolbar';
import { InteractiveInkEditor } from 'iink-ts';

function Toolbar({
  note,
  quill,
  iink,
  editorMode,
  setEditorMode,
  setShareShown,
  toggleSidebarCollapsed
}: {
  note: Note;
  quill: Quill | null;
  iink: InteractiveInkEditor | null;
  editorMode: 'text' | 'scribble';
  setEditorMode: (value: 'text' | 'scribble') => void;
  setShareShown: (value: boolean) => void;
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
  }

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
      <p>{note.documentRef ? <Wifi /> : <WifiOff />}</p>
      {quill && editorMode === 'text' && <TextToolbar quill={quill} />}
      {(editorMode !== 'text' || !quill) && (
        <div className="tools text">
          <button onClick={() => setEditorMode('text')}>
            <TextFields />
          </button>
        </div>
      )}
      {iink && editorMode === 'scribble' && <ScribbleToolbar iink={iink} />}
      {editorMode !== 'scribble' && (
        <div className="tools scribble">
          <button onClick={() => setEditorMode('scribble')}>
            <Edit />
          </button>
        </div>
      )}
      <div className="tools media">
        <button onClick={addMedia}>
          <Add />
        </button>
      </div>
      <div style={{ flexGrow: '1' }} />
      <div className="tools-share">
        {isSharable && (
          <button disabled={!note.documentRef} onClick={() => setShareShown(true)}>
            Share
          </button>
        )}
        <button onClick={save} disabled={isSaving}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
