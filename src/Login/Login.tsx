import API from '../lib/API';
import './Login.css';

function Login({ api }: { api: API }) {
  return (
    <div className="login">
      <h2>Log in to start writing better notes.</h2>
      <button onClick={() => api.signInWithGoogle()}>Sign in with Google</button>
    </div>
  );
}

export default Login;
