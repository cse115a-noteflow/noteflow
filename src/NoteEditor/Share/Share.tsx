import Note from '../../lib/Note';
import getAuthToken from '../../services/getAuthToken';
import { useState } from 'react';
import './Share.css'
import CloseIcon from '@mui/icons-material/Close';

function Share({ note, setShareShown }: { note: Note; setShareShown: (value: boolean) => void }) {
    const [userInput, setUserInput] = useState ('');
    const [shareSuccess, setShareSuccess] = useState (false);
    const [shareFailure, setShareFailure] = useState (false);
    const successes:string[]  = [];
    const failures:string[]  = [];
    const [successfulShares, setSuccessfulShares] =  useState(successes);
    const [unsuccessfulShares, setUnsuccessfulShares] =  useState(failures);
    async function shareNote() {
        const recipientEmails = userInput.split('\n');
        if (!recipientEmails) return;
        const authToken = await getAuthToken();
        for await (const recipientEmail of recipientEmails) {
          try{
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
              successes.push(recipientEmail);
            } else {
              failures.push(recipientEmail);
            }
          }
          catch (error) {
              failures.push(recipientEmail);
            }
        }
        setSuccessfulShares(successes);
        setUnsuccessfulShares(failures);
        if(failures.length > 0){
          setShareFailure(true);
        }
        else{
          setShareSuccess(true);
        }
      }
    if(shareSuccess){
      return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
              <button className = "close-btn" onClick={() => setShareShown(false)}><CloseIcon/></button>
              <h2>"{note.title}" successfully shared with: </h2>
              <ul>
              {successfulShares.map((email) => (<li>{email}</li>))}
              </ul>        
            </div>
        </div>
      );
    }
    if(shareFailure){
      return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
              <button className = "close-btn" onClick={() => setShareShown(false)}><CloseIcon/></button> 
              <h2>Sharing Failed </h2>
              <p>Sharing failed with the following emails: </p>
              <ul>
              {unsuccessfulShares.map((email) => (<li>{email}</li>))}
              </ul>
              <p>Please check spelling and try again.</p>
            </div>
        </div>
      );
    }
    return (
        <div className= "modal" onClick={() => setShareShown(false)}>
            <div className = "modal-inner" onClick={(e) => e.stopPropagation()}>
              <div className = "header-cont">
                <h2>
                Share "{note.title}"
                </h2>
                <button className = "close-btn" onClick={() => setShareShown(false)}><CloseIcon/></button>
              </div>
                <textarea
                    placeholder="Enter email addresses..." 
                    required
                    onChange={(e) => setUserInput(e.target.value)}
                    className = "email-input">
                </textarea>
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