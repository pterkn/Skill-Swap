import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  LinearProgress,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getStrength = (pass) => {
    let score = 0;
    if (pass.length > 5) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const getStrengthLabel = (score) => {
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Moderate';
    return 'Strong';
  };

  const getStrengthColor = (score) => {
    if (score <= 1) return 'error';
    if (score <= 3) return 'warning';
    return 'success';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setToastMsg('Please enter your full name');
      setShowToast(true);
      return;
    }

    if (password !== confirm) {
      setToastMsg('Passwords do not match');
      setShowToast(true);
      return;
    }

    if (strength < 2) {
      setToastMsg('Password is too weak');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', email), {
        email,
        name,
        bio: '',
        availability: 'available',
        skillLevel: 'beginner',
        status: 'online',
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      setToastMsg(`Signup successful! Welcome, ${name}`);
      setShowToast(true);
      navigate('/dashboard');
    } catch (err) {
      setToastMsg(err.code === 'auth/email-already-in-use' ? 'Email already in use' : 'Signup failed. Try again.');
      setShowToast(true);
      setLoading(false);
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
        <Fade in timeout={600}>
          <Box mt={6} px={3} py={4} boxShadow={2} borderRadius={2} bgcolor="#fff">
            <Box textAlign="center" mb={4}>
              <img
                src="/logo.png"
                alt="SkillSwap Logo"
                style={{ height: '60px', marginBottom: '1rem', borderRadius: '50%', padding: '6px', backgroundColor: '#FEFFEC', border: '2px solid #023020' }}
              />
              <Typography variant="h4" sx={{ fontFamily: 'Georgia, serif', color: 'primary.main', fontWeight: 'bold' }}>
                Create Your Account
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Full Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
              />

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
                onChange={handlePasswordChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Strength: {getStrengthLabel(strength)}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(strength / 4) * 100}
                color={getStrengthColor(strength)}
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
                sx={{ py: 1.2, mt: 1 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/" style={{ color: '#023020' }}>
                  Login
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
        type={toastMsg.includes('successful') ? 'success' : 'error'}
      />
    </>
  );
}
