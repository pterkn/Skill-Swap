import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="80vh"
        textAlign="center"
        px={3}
      >
        <Typography variant="h2" fontWeight="bold" color="primary">
          404
        </Typography>
        <Typography variant="h5" mt={2}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          Oops! The page you're looking for doesn't exist.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 4 }}
          component={Link}
          to="/dashboard"
        >
          Go to Dashboard
        </Button>
      </Box>
    </>
  );
}
