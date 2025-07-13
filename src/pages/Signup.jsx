// src/pages/Signup.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [strength, setStrength] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const getStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setToastMsg(' Passwords do not match');
      setShowToast(true);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setToastMsg(' Signup failed. Try again.');
      setShowToast(true);
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(getStrength(val));
  };

  return (
    <>
      <Header />
      <div className="container">
        <h2>Create Your Account</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
          />

          {/* Password Strength Bar */}
          <div className="progress-bar">
            <div
              id="strengthFill"
              style={{ width: `${(strength / 4) * 100}%` }}
            ></div>
          </div>

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit">Sign Up</button>
        </form>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>

      <Toast
        message={toastMsg}
        visible={showToast}
        type="error"
        onHide={() => setShowToast(false)}
      />
    </>
  );
}
