import Note from '../../lib/Note';
import Flashcards from './Flashcards/Flashcards';
import './Study.css';
import Summary from './Summary/Summary';

export type StudyMode = 'flashcards' | 'summary' | null;

function Study({
  note,
  setStudyMode,
  mode
}: {
  note: Note;
  setStudyMode: (value: StudyMode) => void;
  mode: StudyMode;
}) {
  return (
    <div className="modal" onClick={() => setStudyMode(null)}>
      <div className="study modal-inner" onClick={(e) => e.stopPropagation()}>
        {mode === 'flashcards' && <Flashcards note={note} />}
        {mode === 'summary' && <Summary note={note} />}
      </div>
    </div>
  );
}

export default Study;
