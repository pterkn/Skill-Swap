
import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  IconButton,
  Typography,
  Box,
  Avatar
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
  position = { vertical: 'bottom', horizontal: 'center' },
  icon,
  avatar,
  sender,
  timestamp
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
            : type === 'success'
            ? '#2e7d32'
            : '#333',
          color: '#FEFFEC',
          fontFamily: 'Georgia, serif',
          borderRadius: 2,
          px: 3,
          py: 2,
          minWidth: 300,
          display: 'flex',
          alignItems: 'center'
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
        <Box display="flex" alignItems="center" gap={2}>
          {avatar && (
            <Avatar src={avatar} sx={{ width: 32, height: 32 }} />
          )}
          <Box>
            {sender && (
              <Typography variant="caption" fontWeight="bold">
                {sender}
              </Typography>
            )}
            <Typography fontWeight="bold">{message}</Typography>
            {timestamp && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
}
