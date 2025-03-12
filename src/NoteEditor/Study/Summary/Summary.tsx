import Note from '../../../lib/Note';
import '../Study.css';
import { useEffect, useState } from 'react';

function Summary({ note }: { note: Note }) {
  // Write logic here
  // You can also create other components and import them, for cleaner code.
  // Here's an example function that may help.
  // Note that it is asynchronous (it takes time to generate!), so
  // you'll need to take that into account.
  const [summary, setSummary] = useState<string | null>(null);
  async function generate() {
    const summary = await note.generateSummary();
    if (summary !== null) {
      setSummary(summary);
    }
  }

  useEffect(() => {
    generate();
  }, []);

  if (summary === null) {
    return <p>Loading...</p>;
  }

  return (
    <div className="summary">
      <h2>Summary</h2>
      {summary && <p>{summary}</p>}
    </div>
  );
}

export default Summary;
