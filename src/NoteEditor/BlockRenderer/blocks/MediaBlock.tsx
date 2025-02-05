import { useEffect, useRef } from 'react';
import Note from '../../../lib/Note';
import type { MediaBlock as MediaBlockType } from '../../../lib/types';
import '../Block.css';

function MediaBlock({ note, block }: { note: Note; block: MediaBlockType }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (type: string, params?: any) => {
      if (params && params.id === block.id) {
        switch (type) {
          case 'focus':
            ref.current?.focus();
            break;
        }
      }
    };
    note.addListener(fn);
    return () => note.removeListener(fn);
  }, [note, block]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      note.deleteBlock(block);
    }
  }

  return (
    <div
      ref={ref}
      className="block block-media"
      onClick={focus}
      tabIndex={0}
      onFocus={(e) => e.target.focus()}
      onKeyDown={handleKeyDown}
    >
      <img src={block.contentUrl} alt={block.value} />
    </div>
  );
}

export default MediaBlock;
