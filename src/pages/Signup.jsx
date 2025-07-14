import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert
} from '@mui/material';

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
    <Container maxWidth="xs">
      <Box mt={4} display="flex" flexDirection="column" alignItems="center">
        <img
          src="/logo.png"
          alt="SkillSwap Logo"
          style={{ height: '60px', marginBottom: '1rem' }}
        />
        <Typography variant="h5" gutterBottom>
          Create Your Account
        </Typography>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={handlePasswordChange}
            required
          />

          {/* Password Strength Bar */}
          <Box
            height="8px"
            width="100%"
            bgcolor="#ccc"
            borderRadius="4px"
            my={1}
          >
            <Box
              height="100%"
              width={`${(strength / 4) * 100}%`}
              bgcolor={strength < 2 ? 'red' : strength < 4 ? 'orange' : 'green'}
              borderRadius="4px"
              transition="width 0.3s ease-in-out"
            />
          </Box>

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="submit"
            sx={{ mt: 2 }}
          >
            Sign Up
          </Button>
        </form>

        <Typography variant="body2" mt={2}>
          Already have an account? <Link to="/">Login</Link>
        </Typography>
      </Box>
    </Container>

    <Toast
      message={toastMsg}
      visible={showToast}
      type="error"
      onHide={() => setShowToast(false)}
    />
  </>
);
