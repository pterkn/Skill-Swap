import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const unsub = auth.onAuthStateChanged((u) => {
      if (mounted) setUser(u ?? null);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (user === undefined) {
    return (
      <Box mt={10} display="flex" flexDirection="column" alignItems="center">
        <CircularProgress />
        <Typography variant="caption" mt={2}>Checking authentication...</Typography>
      </Box>
    );
  }

  return user
    ? children
    : <Navigate to="/" replace state={{ from: location }} />;
}
