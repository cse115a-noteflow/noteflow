import { Add, Edit, Menu, TextFields } from '@mui/icons-material';
import API from '../../lib/API';
import Note from '../../lib/Note';
import './Toolbar.css';
import { useState } from 'react';

function Toolbar({ note, api }: { note: Note; api: API }) {
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function studyWithAI() {
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Talk about AI study tools' })
      });

      const data = await response.json();
      console.log("AI API Response:", data);
      if (data.success) {
        note.addTextBlockWithString(data.response); // Add AI's response as a text block
      } else {
        note.addTextBlockWithString('Error: Failed to get AI response');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      note.addTextBlockWithString('Error: Could not reach AI');
    } finally {
      setLoading(false);
    }
  }

  async function summarizeNote() {
    setLoading(true);
    await note.summarizeTextBlocks();
    setLoading(false);
  }

  async function flashcards() {
    setLoading(true);
    await note.generateFlashCards();
    setLoading(false);
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
        <button onClick={studyWithAI} disabled={loading}>
          {loading ? 'Thinking...' : 'Study'}
        </button>
        <button onClick={summarizeNote} disabled={loading}>
          {loading ? "Summarizing..." : "Summarize"}
        </button>
        <button onClick={flashcards} disabled={loading}>
          {loading ? "Flashing..." : "Flashcards"}
        <button>Study</button>
        <button onClick={save} disabled={isSaving}>
          Save
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
