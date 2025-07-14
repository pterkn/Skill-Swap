import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { AppBar, Toolbar, Typography, Box, Button, Avatar } from '@mui/material';

export default function Header({ showLogout = false }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <Avatar
            alt="SkillSwap Logo"
            src="/logo.png"
            sx={{ width: 40, height: 40, mr: 1 }}
          />
          <Typography variant="h6" component={Link} to="/dashboard" sx={{ textDecoration: 'none', color: 'inherit' }}>
            SkillSwap
          </Typography>
        </Box>

        {showLogout && (
          <Button
            variant="contained"
            color="error"
            size="small"
            sx={{
              minWidth: '100px',
              padding: '6px 12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              textTransform: 'none'
            }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
