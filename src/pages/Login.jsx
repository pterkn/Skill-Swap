import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
  Link as MuiLink
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToastMsg('Please enter both email and password');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      let message = 'Login failed. Please try again.';
      if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
      if (err.code === 'auth/user-not-found') message = 'No account found.';
      setToastMsg(message);
      setShowToast(true);
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
                variant="h4"
                sx={{
                  fontFamily: 'Georgia, serif',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
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
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box textAlign="right" mt={1} mb={2}>
                <MuiLink
                  component={Link}
                  to="/forgot-password"
                  underline="hover"
                  color="primary"
                  fontSize="0.875rem"
                >
                  Forgot Password?
                </MuiLink>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ py: 1.2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2">
                Don’t have an account?{' '}
                <Link to="/signup" style={{ color: '#023020' }}>
                  Sign Up
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
        type="error"
      />
    </>
  );
}
