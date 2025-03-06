import API from '../../lib/API';
import './Settings.css';
// import CloseIcon from '@mui/icons-material/Close';
import {useState} from 'react';
function SettingsMenu({ api, setSettingsShown }: { api: API , setSettingsShown: (value: boolean) => void}) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    return(
        <div className="modal">
            <div className = "settings-modal-inner">
                <div className = "settings-container">
                    <h2>Settings</h2>
                    <button onClick = {api.signOut}>Log Out</button>
                    <div className= "switch-container">
                        <label> Dark Mode </label>
                        <button className={`switch-button ${isDarkMode ? 'on' : 'off'}`} onClick = {()=> setIsDarkMode(!isDarkMode)}>
                            <div className="switch-handle"></div>
                        </button>
                        <div id="close-btn" onClick= {()=>setSettingsShown(false)}>save & exit</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default SettingsMenu;