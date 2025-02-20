import Note from '../../lib/Note';
import getAuthToken from '../../services/getAuthToken';
import { useState } from 'react';

function Share({ note, setShareShown }: { note: Note; setShareShown: (value: boolean) => void }) {
    const [userInput, setUserInput] = useState ('');
    async function shareNote() {
        const recipientEmail = userInput;
        if (!recipientEmail) return;
    
        try {
          const authToken = await getAuthToken(); // Implement this function to get the Firebase token
          const response = await fetch(`http://localhost:5000/notes/${note.id}/share`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${authToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: recipientEmail, permission: "editor" })
          });
    
          const result = await response.json();
          if (response.ok) {
            alert(`Note shared successfully with ${recipientEmail}`);
          } else {
            alert(`Error: ${result.error}`);
          }
        } catch (error) {
          console.error("Error sharing note:", error);
          alert("An unexpected error occurred.");
        }
      }
    return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
                <h2>
                Share "{note.title}"
                </h2>
                <input
                    type="text" 
                    placeholder="Enter email address..." 
                    required
                    onChange={(e) => setUserInput(e.target.value)}>
                </input>
                <button id="submitBtn" onClick = {shareNote}>
                    Submit
                </button>
            </div>
        </div>
    );
}

export default Share;