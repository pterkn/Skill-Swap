// src/components/Toast.jsx
import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function Toast({ message, visible, onHide, type = 'info' }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onHide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  return (
    <Snackbar
      open={visible}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={type}
        onClose={onHide}
        sx={{ width: '100%', bgcolor: '#023020', color: '#FEFFEC', fontFamily: 'Georgia, serif' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
