import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setToastMsg(' Login failed. Please try again.');
      setShowToast(true);
    }
  };

  return (
    <>
      <div className="container">
        {/*  Add logo above the form */}
        <img src="/logo.png" alt="SkillSwap Logo" className="logo" style={{ display: 'block', margin: 'auto', height: '60px' }} />

        <h2>Login to SkillSwap</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      </div>

      <Toast message={toastMsg} visible={showToast} onHide={() => setShowToast(false)} type="error" />
    </>
  );
}
