import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function SlideUpTransition(props) {
  return <Slide {...props} direction="up" />;
}

export default function Toast({
  message,
  visible,
  onHide,
  type = 'info',
  duration = 4000,
  position = { vertical: 'bottom', horizontal: 'center' }
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onHide(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide, duration]);

  return (
    <Snackbar
      open={visible}
      anchorOrigin={position}
      TransitionComponent={SlideUpTransition}
      onClick={onHide}
    >
      <Alert
        severity={type}
        onClose={onHide}
        variant="filled"
        elevation={6}
        sx={{
          bgcolor: type === 'info'
            ? '#023020'
            : type === 'error'
            ? '#b00020'
            : '#2e7d32',
          color: '#FEFFEC',
          fontFamily: 'Georgia, serif',
          borderRadius: 2,
          px: 3,
          py: 2,
          minWidth: 300
        }}
        icon={false}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onHide}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Typography fontWeight="bold">{message}</Typography>
      </Alert>
    </Snackbar>
  );
}
