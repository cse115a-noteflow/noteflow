import Note from '../../lib/Note';
import './Study.css';

function Study({ note }: { note: Note }) {
  // Write logic here
  // You can also create other components and import them, for cleaner code.
  // Here's an example function that may help.
  // Note that it is asynchronous (it takes time to generate!), so
  // you'll need to take that into account.
  async function generate() {
    const flashcards = await note.generateStudyMaterials();
    if (flashcards === null) {
      // failure response
    } else {
      // do something with the list of flashcards
    }
  }


  return (
    <div className="study">
      <p>Your code here</p>
    </div>
  );
}

export default Study;
