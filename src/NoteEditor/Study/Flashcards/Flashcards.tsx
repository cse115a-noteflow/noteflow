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
    setCurrentIndex((currentIndex) => (currentIndex + 1) % flashcards.length);
  }
  function prevCard() {
    if (flashcards === null) return;
    setCurrentIndex((currentIndex) => (currentIndex - 1) % flashcards.length);
  }

  const toggleFlip = () => {
    const card = document.getElementById('card');
    if (card) {
      card.classList.toggle('flip');
    }
  };

  if (flashcards === null) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flashcards">
      <div className="card" id="card" onClick={toggleFlip}>
        <div className="front">
          <h2>{flashcards[currentIndex].term}</h2>
        </div>
        <div className="back">
          <h2>{flashcards[currentIndex].definition}</h2>
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
