import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Fade
} from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setToastMsg('Enter your email');
      setShowToast(true);
      return;
    }

    if (!isValidEmail(email)) {
      setToastMsg('Enter a valid email');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      await addDoc(collection(db, 'passwordResets'), {
        email,
        requestedAt: serverTimestamp()
      });
      setToastMsg(' If that account exists, a reset link has been sent');
      setShowToast(true);
      setEmail('');
      setCooldown(60);
    } catch (err) {
      console.error(err);
      const code = err.code;
      const msg =
        code === 'auth/invalid-email'
          ? 'Invalid email address '
          : 'Failed to send reset link ';
      setToastMsg(msg);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Box mt={6} px={3} py={4} boxShadow={2} borderRadius={2} bgcolor="#fff">
            <Box textAlign="center" mb={4}>
              <img
                src="/logo.png"
                alt="SkillSwap Logo"
                style={{
                  height: '60px',
                  marginBottom: '1rem',
                  borderRadius: '50%',
                  padding: '6px',
                  backgroundColor: '#FEFFEC',
                  border: '2px solid #023020'
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Georgia, serif',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                Reset Your Password
              </Typography>
              <Typography variant="body2" mt={1}>
                Enter your email and we'll send a reset link
              </Typography>
            </Box>

            <form onSubmit={handleReset}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, py: 1.2 }}
                disabled={loading || cooldown > 0}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>

              {cooldown > 0 && (
                <Typography variant="caption" color="text.secondary" mt={1}>
                  You can request again in {cooldown}s
                </Typography>
              )}
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2">
                Remembered?{' '}
                <Link to="/" style={{ color: '#023020' }}>
                  Back to Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Fade>
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
