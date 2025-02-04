import { useEffect, useState } from 'react';
import Note from '../../lib/Note';
import './Block.css';

function DebugPreview({ note }: { note: Note }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => forceUpdate((prev) => prev + 1);

    note.addListener(update);
    return () => note.removeListener(update);
  });

  return (
    <div className="debug-preview">
      <span>{JSON.stringify(note.content, null, 2)}</span>
    </div>
  );
}

export default DebugPreview;
