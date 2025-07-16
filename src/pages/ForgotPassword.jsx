import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email) {
      setToastMsg('Please enter your email');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setToastMsg('📩 Password reset link sent!');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setToastMsg('No account found with that email.');
      } else {
        setToastMsg('Something went wrong. Try again.');
      }
    } finally {
      setShowToast(true);
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth="sm">
        <Box mt={6} px={3} py={4} boxShadow={2} borderRadius={2} bgcolor="#fff">
          <Box textAlign="center" mb={3}>
            <img src="/logo.png" alt="SkillSwap Logo" style={{ height: 60, marginBottom: 16 }} />
            <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              Reset Your Password
            </Typography>
          </Box>

          <form onSubmit={handleReset}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2">
              Remembered your password?{' '}
              <Link to="/" style={{ color: '#023020' }}>
                Go back to Login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="info"
      />
    </>
  );
}
