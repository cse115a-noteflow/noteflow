import API from '../../lib/API';
import './Settings.css';
import CloseIcon from '@mui/icons-material/Close';
import {useState} from 'react';
function SettingsMenu({ api, setSettingsShown }: { api: API , setSettingsShown: (value: boolean) => void}) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    };
    return(
        <div className="modal" onClick = {() => setSettingsShown(false)}>
            <div className = "modal-inner" >
                <h2>Settings</h2>
                <button onClick = {api.signOut}>Log Out</button>
                <button className="close-btn" onClick={() => setSettingsShown(false)}>
                    <CloseIcon />
                </button>
                <h2>Dark Mode</h2><input type="checkbox" checked={isDarkMode} onChange={toggleTheme}></input>
            </div>
        </div>
    );
}
export default SettingsMenu;