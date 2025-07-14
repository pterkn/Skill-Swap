import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

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
      setToastMsg(' Login failed. Please check your credentials.');
      setShowToast(true);
    }
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
            Login to SkillSwap
          </Typography>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
              sx={{ mt: 2 }}
            >
              Login
            </Button>
          </form>

          <Typography variant="body2" mt={2}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
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
}
