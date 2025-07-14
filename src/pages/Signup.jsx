// src/pages/Signup.jsx
import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  LinearProgress
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';

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
      setToastMsg('Passwords do not match.');
      setShowToast(true);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setToastMsg('Signup failed. Try again.');
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
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: '#FEFFEC' }}>
          <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
            Create Your Account
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              value={email}
              fullWidth
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              fullWidth
              onChange={handlePasswordChange}
              sx={{ mb: 1 }}
            />

            <LinearProgress
              variant="determinate"
              value={(strength / 4) * 100}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
              color={strength < 2 ? 'error' : strength < 3 ? 'warning' : 'success'}
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={confirm}
              fullWidth
              onChange={(e) => setConfirm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" type="submit" fullWidth>
              Sign Up
            </Button>
          </Box>

          <Typography variant="body2" mt={2}>
            Already have an account? <Link to="/">Login</Link>
          </Typography>
        </Paper>
      </Container>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="error"
      />
    </>
  );
}
