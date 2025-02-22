import Note from '../../lib/Note';
import getAuthToken from '../../services/getAuthToken';
import { useState } from 'react';
import './Share.css'

function Share({ note, setShareShown }: { note: Note; setShareShown: (value: boolean) => void }) {
    const [userInput, setUserInput] = useState ('');
    const [shareSuccess, setShareSuccess] = useState (false);
    const [shareFailure, setShareFailure] = useState (false);
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
            setShareSuccess(true);
          } else {
            setShareFailure(true);
            // alert(`Error: ${result.error}`);
          }
        } catch (error) {
          setShareFailure(true);
          // console.error("Error sharing note:", error);
          // alert("An unexpected error occurred.");
        }
      }
    if(shareSuccess){
      return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
              <h2>"{note.title}" successfully shared with {userInput}</h2>
            </div>
        </div>
      );
    }
    if(shareFailure){
      return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
              <h2>Sharing failed. </h2>
            </div>
        </div>
      );
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
                    onChange={(e) => setUserInput(e.target.value)}
                    className = "email-input">
                </input>
                <div className="cont">
                  <button id="submitBtn" onClick = {shareNote}>
                      Submit
                  </button>
                </div>
            </div>
        </div>
    );
}

export default Share;