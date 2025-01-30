import { useEffect, useState } from 'react';
import Note from '../../lib/Note';
import MediaBlock from './blocks/MediaBlock';
import ScribbleBlock from './blocks/ScribbleBlock';
import TextBlock from './blocks/TextBlock';

function BlockRenderer({ note }: { note: Note }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => {
      forceUpdate((prev) => prev + 1);
    };

    note.addListener(update);
    return () => note.removeListener(update);
  });

  return (
    <div className="blocks">
      {note.content.map((block) => {
        switch (block.type) {
          case 'text':
            return <TextBlock key={block.id} note={note} block={block} />;
          case 'scribble':
            return <ScribbleBlock key={block.id} note={note} block={block} />;
          case 'media':
            return <MediaBlock key={block.id} note={note} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default BlockRenderer;
