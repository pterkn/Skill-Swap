import React, { useState } from 'react';
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
      setToastMsg('Enter your email');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setToastMsg('Password reset link sent ✅');
      setShowToast(true);
      setEmail('');
    } catch (err) {
      console.error(err);
      setToastMsg('Failed to send reset link ❌');
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
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>
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
