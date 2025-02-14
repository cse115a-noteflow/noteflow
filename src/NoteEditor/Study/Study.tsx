import Note from '../../lib/Note';
import Flashcards from './Flashcards/Flashcards';
import './Study.css';
import { useState } from 'react';
import Summary from './Summary/Summary';

function Study({ note, setStudyShown }: { note: Note; setStudyShown: (value: boolean) => void }) {
  const [mode, setMode] = useState<null | 'flashcards' | 'summary'>(null);

  return (
    <div className="modal" onClick={() => setStudyShown(false)}>
      <div className="study modal-inner" onClick={(e) => e.stopPropagation()}>
        {mode === null && (
          <>
            <h2>Choose a study method</h2>
            <div className="btn-row">
              <button onClick={() => setMode('flashcards')}>Flashcards</button>
              <button onClick={() => setMode('summary')}>Summary</button>
            </div>
          </>
        )}
        {mode === 'flashcards' && <Flashcards note={note} />}
        {mode === 'summary' && <Summary note={note} />}
      </div>
    </div>
  );
}

export default Study;
