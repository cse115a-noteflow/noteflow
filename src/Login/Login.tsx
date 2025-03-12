import API from '../lib/API';
import './Login.css';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GoogleIcon from '@mui/icons-material/Google';

// routing
import { useNavigate } from 'react-router-dom';

function Login({ api }: { api: API }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // routing
  const navigate = useNavigate();
  const handleSignIn = async () => {
    try {
      await api.signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const toggleExpansion = () => {
    setIsExpanded((prevState) => !prevState); // Toggle the state
  };

  return (
    <div className="container">
      <div className="left">
        <div className="logo">NoteFlow</div>
        <div className="title-cont-outer">
          <h2>Note-taking,</h2>
          <div className="title-cont-inner">Enhanced.</div>
          <div className="info-icon">
            <ExpandMoreIcon onClick={toggleExpansion} />
          </div>
          <div className={`info-box ${isExpanded ? 'expanded' : ''}`}>
            NoteFlow is note-taking application that integrates Retrieval Augmented Generation (RAG)
            to retrieve information from notes faster. Notes are LLM-enhanced for quick
            summarization and flashcard generation.
          </div>
        </div>
      </div>
      <div className="right">
        <div className="login">
          <h3>Sign in to start writing better notes.</h3>
          <button onClick={handleSignIn}>
            <GoogleIcon className="g-icon" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
