import Note from '../../lib/Note';
import './Study.css';
import React, { useState } from 'react'

function Study({ note }: { note: Note }) {
  // Write logic here
  // You can also create other components and import them, for cleaner code.
  // Here's an example function that may help.
  // Note that it is asynchronous (it takes time to generate!), so
  // you'll need to take that into account.
  const[currentIndex, setCurrentIndex] = useState(0);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  async function generate() {
    const flashcards = await note.generateStudyMaterials();
    if (flashcards === null) {

    } else {
      setFlashcards(flashcards);
    }
  }
  generate();
  // card.onclick = function(){card.classList.toggle("flip")}
  function nextCard(){
    setCurrentIndex((currentIndex)=>((currentIndex + 1) % flashcards.length));
  }
  function prevCard(){
    setCurrentIndex((currentIndex)=>((currentIndex - 1) % flashcards.length));
  }

  const toggleFlip =()=>{
    const card = document.getElementById('card');
    if (card) {
      card.classList.toggle('flip');
    }
  };
  
  return (
    <div className="study">
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="card" id="card" onClick={toggleFlip}>
            <div className="front">
              <h2>{flashcards[currentIndex].term}</h2>
            </div>
            <div className="back">
              <h2>{flashcards[currentIndex].definition}</h2>
            </div>
          </div>
            <div className="nav-content">
                <button onClick={prevCard}> &lt </button>
                <h2> {currentIndex}/{flashcards.length} </h2>
                <button onClick={nextCard}> &gt </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Study;
