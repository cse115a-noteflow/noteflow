import Note from '../../lib/Note';
import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react';
import './Share.css';
import CloseIcon from '@mui/icons-material/Close';
import { Add, Check, Edit, Lock, Public, Visibility, Warning } from '@mui/icons-material';

function Share({ note, setShareShown }: { note: Note; setShareShown: (value: boolean) => void }) {
  const [draftEmails, setDraftEmails] = useState<
    { email: string; name: string; permission: 'edit' | 'view' }[]
  >(
    Object.keys(note.permissions.user).map((email) => ({
      email,
      name: note.permissions.user[email].name,
      permission: note.permissions.user[email].permission
    }))
  );
  const [globalPermission, setGlobalPermission] = useState(note.permissions.global);
  const [draftError, setDraftError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Null when not yet shared, true when successful, false when failed
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<null | boolean>(null);
  const [shareResult, setShareResult] = useState({
    successes: [],
    failures: []
  });

  function validateEmail() {
    // Match email with a regular expression
    const value = inputRef.current?.value.trim();
    if (value && value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      if (draftEmails.map((x) => x.email).includes(value)) {
        setDraftError('Already added ' + value);
      } else {
        setDraftEmails([...draftEmails, { email: value, name: value, permission: 'edit' }]);
      }
      if (inputRef.current) inputRef.current.value = '';
    } else {
      setDraftError('Invalid email address');
    }
  }

  function handleKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    if (draftError) {
      setDraftError('');
    }
    if (e.key === 'Enter' || e.key === 'Space') {
      validateEmail();
    }
  }

  function updatePermission(
    email: { email: string; name: string; permission: 'edit' | 'view' },
    index: number,
    e: ChangeEvent<HTMLSelectElement>
  ) {
    if (e.target.value === 'remove') {
      const newDraftEmails = draftEmails.filter((_, i) => i !== index);
      setDraftEmails(newDraftEmails);
      return;
    } else {
      email.permission = e.target.value as 'edit' | 'view';
    }
    const newDraftEmails = [...draftEmails];
    newDraftEmails[index] = email;
    setDraftEmails(newDraftEmails);
  }

  async function shareNote() {
    setShareLoading(true);
    const request: { [key: string]: 'view' | 'edit' } = {};
    draftEmails.forEach((email) => {
      request[email.email] = email.permission;
    });
    const response = await note.share(request, globalPermission);
    setShareLoading(false);
    if (response) {
      note.permissions = response.permissions;
      setShareSuccess(true);
      setShareResult({ successes: response.successes, failures: response.failures });
    } else {
      setShareSuccess(false);
    }
  }
  if (shareSuccess === true) {
    return (
      <div className="modal" onClick={() => setShareShown(false)}>
        <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
          <div className="header-cont">
            <h2>Share "{note.title}"</h2>
            <button className="close-btn" onClick={() => setShareShown(false)}>
              <CloseIcon />
            </button>
          </div>
          <div className="btn-row">
            <Check />
            <span>Shared with {shareResult.successes.length} account(s).</span>
          </div>
          {shareResult.failures.length > 0 && (
            <>
              <div className="btn-row">
                <Warning />
                <p>
                  Could not share to {shareResult.failures.length} email(s). Check if they have an
                  account on NoteFlow.
                </p>
              </div>
              <div className="email-list">
                {shareResult.failures.map((email) => (
                  <div key={email} className="email">
                    <span>{email}</span>
                    <b>Could not share</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default state
  return (
    <div className="modal" onClick={() => setShareShown(false)}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="header-cont">
          <h2>Share "{note.title}"</h2>
          <button className="close-btn" onClick={() => setShareShown(false)}>
            <CloseIcon />
          </button>
        </div>
        <label htmlFor="email-input">Enter email addresses</label>
        <div className="btn-row">
          <input
            ref={inputRef}
            id="email-input"
            placeholder="john@mail.com"
            onKeyUp={handleKeyUp}
            className="email-input"
          />
          <button style={{ flexGrow: 0, width: 'auto' }} onClick={validateEmail}>
            <Add />
          </button>
        </div>

        <p style={{ height: '1em' }} className="error">
          {draftError}
        </p>
        <hr />
        <div className="email-list">
          {draftEmails.map((email, i) => (
            <div key={email.email} className="email">
              <span>{email.name}</span>
              <select onChange={updatePermission.bind(null, email, i)}>
                <option value="edit">Edit</option>
                <option value="view">View</option>
                <option value="remove">Remove</option>
              </select>
              {email.permission === 'edit' && <Edit />}
              {email.permission === 'view' && <Visibility />}
            </div>
          ))}
          {draftEmails.length === 0 && (
            <p style={{ margin: '8px', fontStyle: 'italic' }}>
              Enter an email to share with a specific user...
            </p>
          )}
        </div>
        <div className="email">
          <Public />
          <span>Anyone with the link</span>
          <select
            defaultValue={globalPermission?.toString() ?? 'null'}
            onChange={(e) =>
              setGlobalPermission(
                e.target.value === 'null' ? null : (e.target.value as 'edit' | 'view')
              )
            }
          >
            <option value="edit">Edit</option>
            <option value="view">View</option>
            <option value="null">No access</option>
          </select>
          {globalPermission === 'edit' && <Edit />}
          {globalPermission === 'view' && <Visibility />}
          {globalPermission === null && <Lock />}
        </div>
        {shareSuccess === false && <p className="error">Failed to share note. Try again later.</p>}
        <div className="cont">
          <button id="submitBtn" onClick={shareNote} disabled={shareLoading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Share;
