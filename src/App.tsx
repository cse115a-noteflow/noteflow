import './App.css';

// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import React Firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBT8w1img6usS8Bx4LSlFza_DD3-G2RWBk",
  authDomain: "noteflow-77eb6.firebaseapp.com",
  projectId: "noteflow-77eb6",
  storageBucket: "noteflow-77eb6.firebasestorage.app",
  messagingSenderId: "212131836065",
  appId: "1:212131836065:web:328e7d473d67a1279fc0e0",
  measurementId: "G-4BQNZ69GHR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {

  const [user] = useAuthState(auth);

  console.log("User:", user);

  return (
    <div className="App">
      <header className="App-header">
        <p>NoteFlow</p>
        {user ? <Notebook /> : <SignIn />}
        
      </header>
    </div>
  );
}

function SignIn() {
  
  console.log("Sign In");
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };
  
  return (
    <div>
      <p>Sign in to start taking notes</p>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
}

function SignOut() {
  console.log("Sign Out");
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function Notebook() {
  // Add your Notebook component implementation here
  return <div>
          <SignOut />
          <p>Notebook Component</p>
        </div>;
}
export default App;
