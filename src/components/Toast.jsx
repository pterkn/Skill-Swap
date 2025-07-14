
import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function Toast({ message, visible, onHide, type = 'info', duration = 3000 }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  return (
    <Snackbar
      open={visible}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={onHide}
      autoHideDuration={duration}
    >
      <Alert severity={type} onClose={onHide} variant="filled" sx={{ fontFamily: 'Georgia, serif' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
