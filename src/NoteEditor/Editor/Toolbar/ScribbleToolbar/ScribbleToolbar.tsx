import { useState } from 'react';
import { Edit, FormatBold } from '@mui/icons-material';
import { FabricJSEditor } from 'fabricjs-react';

interface BrushSettings {
  width: number;
  color: string;
  opacity: number; // Determines the opacity
  pressureSensitive: boolean; // Determines if pressure sensitivity is enabled (iPad)
  removesFullStrokes: boolean; // Determines if the brush should remove full strokes
}
interface BrushSettingsOptions {
  width?: number;
  color?: string;
  opacity?: number; // Determines the opacity
  pressureSensitive?: boolean; // Determines if pressure sensitivity is enabled (iPad)
  removesFullStrokes?: boolean;
}
interface TextSettings {
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}
interface TextSettingsOptions {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}
type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text';
type BrushTool = 'pen' | 'highlighter' | 'eraser';

type Events = 'undo' | 'redo' | 'update';

const settings: { [key: string]: BrushSettings } = {
  pen: {
    width: 5,
    color: '#000000',
    opacity: 1,
    pressureSensitive: false,
    removesFullStrokes: false
  },
  highlighter: {
    width: 10,
    color: '#ffeb3b',
    opacity: 0.5,
    pressureSensitive: false,
    removesFullStrokes: false
  },
  eraser: {
    width: 10,
    color: '#ffffff',
    opacity: 1,
    pressureSensitive: false,
    removesFullStrokes: true
  }
};

function ScribbleToolbar({ fabric }: { fabric: FabricJSEditor }) {
  const [tool, setTool] = useState<string>('pen');

  return (
    <div className="tools text">
      <div className="tool-label">
        <Edit />
      </div>
      <div className="group">
        <button
          onClick={() => setTool('pen')}
          className={'format ' + (tool === 'pen' ? 'active' : '')}
        >
          <FormatBold />
        </button>
      </div>
    </div>
  );
}

export default ScribbleToolbar;
