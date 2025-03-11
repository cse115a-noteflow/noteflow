import { useEffect, useState } from 'react';
import NoteEditor from './NoteEditor/NoteEditor';
import API from './lib/API';

// Import Firebase modules
import { initializeApp } from 'firebase/app';

// Import React Firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';
import Login from './Login/Login';

// Import Routing
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

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
  const [user, loading] = useAuthState(api.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  const ProtectedRoute = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/note" replace />} />
        <Route path="/login" element={<Login api={api} />} />
        <Route element={<ProtectedRoute />}>
          <Route path="note" element={<NoteEditor api={api} />} />
          <Route path="note/:id" element={<NoteEditor api={api} />} />
        </Route>
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
