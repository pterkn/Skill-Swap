
import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';

export default function NotificationsDropdown({ anchorEl, open, onClose, notifications = [] }) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          bgcolor: '#FEFFEC',
          fontFamily: 'Georgia, serif',
          border: '1px solid #ccc'
        }
      }}
    >
      <Typography variant="subtitle1" sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        🔔 Notifications
      </Typography>
      <Divider />
      {notifications.length === 0 ? (
        <MenuItem disabled>
          <ListItemText primary="No new notifications." />
        </MenuItem>
      ) : (
        notifications.map((note, i) => (
          <MenuItem key={i} onClick={() => onClose()}>
            <ListItemText
              primary={note.text}
              secondary={new Date(note.timestamp).toLocaleString()}
            />
          </MenuItem>
        ))
      )}
    </Menu>
  );
}
