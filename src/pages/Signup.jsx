import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
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
      setToastMsg('Passwords do not match');
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
      <Container maxWidth="sm">
        <Box mt={6}>
          <Box textAlign="center" mb={4}>
            <img
              src="/logo.png"
              alt="SkillSwap Logo"
              style={{ height: '60px', marginBottom: '1rem' }}
            />
            <Typography variant="h4" sx={{ fontFamily: 'Georgia, serif', color: 'primary.main', fontWeight: 'bold' }}>
              Create Your Account
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={handlePasswordChange}
              margin="normal"
              required
            />
            <LinearProgress
              variant="determinate"
              value={(strength / 4) * 100}
              sx={{ height: 8, borderRadius: 5, mb: 2 }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign Up
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Already have an account? <Link to="/">Login</Link>
            </Typography>
          </Box>
        </Box>
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
