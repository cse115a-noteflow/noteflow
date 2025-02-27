import { useEffect, useState } from 'react';
import NoteEditor from './NoteEditor/NoteEditor';
import API from './lib/API';

// Import Firebase modules
import { initializeApp } from 'firebase/app';

// Import React Firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';
import Login from './Login/Login';

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBT8w1img6usS8Bx4LSlFza_DD3-G2RWBk',
  authDomain: 'noteflow-77eb6.firebaseapp.com',
  projectId: 'noteflow-77eb6',
  storageBucket: 'noteflow-77eb6.firebasestorage.app',
  messagingSenderId: '212131836065',
  appId: '1:212131836065:web:328e7d473d67a1279fc0e0',
  measurementId: 'G-4BQNZ69GHR'
};

const app = initializeApp(firebaseConfig);

function App() {
  const [api] = useState(new API(app));
  const [user] = useAuthState(api.auth);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const unsubscribe = api.auth.onAuthStateChanged(() => {
      setIsFirebaseReady(true);
      unsubscribe();
    });
  });

  console.log('User:', user);

  if (!user && isFirebaseReady) {
    return <Login api={api} />;
  } else if (!user) {
    return <div>Loading...</div>;
  }

  // todo: routing
  return <NoteEditor api={api} />;
}

export default App;
