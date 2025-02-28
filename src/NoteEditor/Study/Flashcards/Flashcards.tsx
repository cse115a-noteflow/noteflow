import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import Note from '../../../lib/Note';
import '../Study.css';
import { useEffect, useState } from 'react';

function Flashcards({ note }: { note: Note }) {
  // Write logic here
  // You can also create other components and import them, for cleaner code.
  // Here's an example function that may help.
  // Note that it is asynchronous (it takes time to generate!), so
  // you'll need to take that into account.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flashcards, setFlashcards] = useState<{ term: string; definition: string }[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  async function generate() {
    const flashcards = await note.generateFlashcards();
    if (flashcards !== null) {
      setFlashcards(flashcards);
    }
  }

  useEffect(() => {
    generate();
  }, [note]);

  // card.onclick = function(){card.classList.toggle("flip")}
  function nextCard() {
    if (flashcards === null) return;
    setFlipped(false);
    setCurrentIndex((currentIndex) => (currentIndex + 1) % flashcards.length);
  }
  function prevCard() {
    if (flashcards === null) return;
    setFlipped(false);
    setCurrentIndex((currentIndex) => (currentIndex - 1 + flashcards.length) % flashcards.length);
  }

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  if (flashcards === null) {
    return <p>Loading...</p>;
  }

  if (flashcards.length === 0) {
    return (
      <div className="flashcards">
        <div className="card disabled">
          <div className="front">
            <h2>Couldn't make any flashcards.</h2>
            <p>Add more to your note to study it!</p>
          </div>
        </div>
        <div className="nav-content">
          <button disabled>
            <ChevronLeft />
          </button>
          <h2>0/{flashcards.length}</h2>
          <button disabled>
            <ChevronRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards">
      <div key={currentIndex} className={'card ' + (flipped ? 'flip' : '')} onClick={toggleFlip}>
        <div className="front">
          <h2>{flashcards[currentIndex].term}</h2>
        </div>
        <div className="back">
          <p>{flashcards[currentIndex].definition}</p>
        </div>
      </div>
      <div className="nav-content">
        <button onClick={prevCard}>
          <ChevronLeft />
        </button>
        <h2>
          {currentIndex + 1}/{flashcards.length}
        </h2>
        <button onClick={nextCard}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Flashcards;
