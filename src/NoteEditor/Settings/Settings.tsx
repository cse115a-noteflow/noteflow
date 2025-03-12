import API from '../../lib/API';
import './Settings.css';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
function SettingsMenu({
  api,
  setSettingsShown,
  isDarkMode,
  setIsDarkMode,
}: {
  api: API;
  setSettingsShown: (value: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}) {
  const navigate = useNavigate();
  function handleSignOut() {
    api.signOut();
    navigate('/login');
  }

  return (
    <div className="modal" onClick={() => setSettingsShown(false)}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="settings-container">
          <h2>Settings</h2>
          <div className="option">
            <label>Dark Mode</label>
            <button
              className={`switch-button ${isDarkMode ? 'on' : 'off'}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              <div className="switch-handle"></div>
            </button>
          </div>
          <hr />
          <div className="option">
            <label>Sign out</label>
            <button onClick={handleSignOut}>Sign Out</button>
          </div>
          <button className="closeBtn" onClick={() => setSettingsShown(false)}>
            <Close />
          </button>
        </div>
      </div>
    </div>
  );
}
export default SettingsMenu;
