import Note from '../../../lib/Note';
import type { MediaBlock as MediaBlockType } from '../../../lib/types';

function MediaBlock({ note, block }: { note: Note; block: MediaBlockType }) {
  return (
    <div className="block block-media">
      <img src={block.contentUrl} alt={block.value} />
    </div>
  );
}

export default MediaBlock;
