import Note from '../../../lib/Note';
import type { ScribbleBlock as ScribbleBlockType } from '../../../lib/types';
import '../Block.css';

function ScribbleBlock({ note, block }: { note: Note; block: ScribbleBlockType }) {
  return (
    <div className="block block-scribble">
      <span>TODO: scribble</span>
    </div>
  );
}

export default ScribbleBlock;
