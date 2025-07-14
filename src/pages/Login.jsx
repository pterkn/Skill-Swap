import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
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
      setToastMsg('Login failed. Please try again.');
      setShowToast(true);
    }
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
              Login to SkillSwap
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
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
              onChange={(e) => setPassword(e.target.value)}
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
              Login
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Don’t have an account? <Link to="/signup">Sign Up</Link>
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
