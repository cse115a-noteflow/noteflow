import { useState, useEffect } from 'react';
import { Edit, Draw, Backspace } from '@mui/icons-material';
import { EditorTool, InteractiveInkEditor } from 'iink-ts';

function ScribbleToolbar({ iink }: { iink: InteractiveInkEditor }) {
  const [tool, setTool] = useState<EditorTool>(EditorTool.Write);

  useEffect(() => {
    if (!iink) return;
    iink.tool = tool;
  }, [iink, tool]);

  return (
    <div className="tools text">
      <div className="tool-label">
        <Edit />
      </div>
      <div className="group">
        <button
          onClick={() => setTool(EditorTool.Write)}
          className={'format ' + (tool === EditorTool.Write ? 'active' : '')}
        >
          <Draw />
        </button>
        <button
          onClick={() => setTool(EditorTool.Erase)}
          className={'format ' + (tool === EditorTool.Erase ? 'active' : '')}
        >
          <Backspace />
        </button>
      </div>
    </div>
  );
}

export default ScribbleToolbar;
