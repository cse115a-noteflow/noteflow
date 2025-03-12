import { DescriptionOutlined } from '@mui/icons-material';
import { PartialNote } from '../../../lib/types';

function NoteItem({
  note,
  selected,
  owned,
  onDelete,
  setId
}: {
  note: PartialNote;
  selected: boolean;
  owned: boolean;
  onDelete: () => void;
  setId: (id: string) => void;
}) {
  return (
    <div className={`note-card ${selected ? 'selected' : ''}`} onClick={() => setId(note.id)}>
      <DescriptionOutlined />
      <div className="text">
        <h3>{note.title}</h3>
        <p>{note.description}</p>
      </div>
      {owned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

export default NoteItem;
