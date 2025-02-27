import Quill from 'quill';
import { useState, useEffect } from 'react';
import {
  TextFields,
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight
} from '@mui/icons-material';

function TextToolbar({ quill }: { quill: Quill }) {
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');

  useEffect(() => {
    if (quill) {
      const updateFormats = () => {
        if (quill.getSelection() === null) {
          // Not focused - don't call quill methods, as this will refocus the editor
          setActiveFormats([]);
          setAlign('left');
          return;
        }
        const formats = quill.getFormat();
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
    <div className="tools text">
      <div className="tool-label">
        <TextFields />
      </div>
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
  );
}

export default TextToolbar;
