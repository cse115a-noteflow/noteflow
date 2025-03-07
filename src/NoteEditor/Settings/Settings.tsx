import API from '../../lib/API';
import './Settings.css';
import { Close } from '@mui/icons-material';
import { useState } from 'react';
function SettingsMenu({
  api,
  setSettingsShown
}: {
  api: API;
  setSettingsShown: (value: boolean) => void;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  return (
    <div className="modal">
      <div className="modal-inner">
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
            <button onClick={api.signOut}>Sign Out</button>
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
