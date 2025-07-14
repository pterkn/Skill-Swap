
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, Link } from 'react-router-dom';
import { auth, dbRealtime } from '../firebase';
import { ref, onChildAdded, remove } from 'firebase/database';
import Toast from './Toast';

export default function Header({ showLogout = false }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const user = auth.currentUser;
  const userEmail = user?.email || '';
  const userId = userEmail.replace(/\./g, '_');

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotifClick = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => {
    setNotifAnchor(null);
    setNotifications([]);
  };

  const handleNotificationClick = (chatId, msgId) => {
    const otherUser = chatId
      .split('_')
      .find((part) => part !== userId)
      .replace(/_/g, '.');
    navigate(`/chat?partner=${otherUser}`);
    remove(ref(dbRealtime, `chats/${chatId}/${msgId}`));
    setNotifications((prev) => prev.filter((n) => n.id !== msgId));
    handleNotifClose();
  };

  useEffect(() => {
    if (!user) return;
    const chatsRef = ref(dbRealtime, 'chats');

    onChildAdded(chatsRef, (chatSnap) => {
      const chatId = chatSnap.key;
      if (!chatId.includes(userId)) return;

      const messagesRef = ref(dbRealtime, `chats/${chatId}`);
      onChildAdded(messagesRef, (msgSnap) => {
        const msg = msgSnap.val();
        if (msg.sender !== userEmail) {
          setNotifications((prev) => [
            { id: msgSnap.key, sender: msg.sender, text: msg.text, chatId },
            ...prev
          ]);
          setToastMsg(`💬 New message from ${msg.sender}`);
          setShowToast(true);
        }
      });
    });
  }, [userEmail, userId]);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#023020', fontFamily: 'Georgia, serif' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center">
            <Avatar src="/logo.png" alt="SkillSwap Logo" sx={{ mr: 1, width: 40, height: 40 }} />
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{ textDecoration: 'none', color: '#FEFFEC', fontFamily: 'Georgia, serif' }}
            >
              SkillSwap
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotifClick}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { bgcolor: '#FEFFEC', fontFamily: 'Georgia, serif' } }}
            >
              <MenuItem disabled>
                🔔 {notifications.length} New Message{notifications.length !== 1 ? 's' : ''}
              </MenuItem>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem>No new messages</MenuItem>
              ) : (
                notifications.map((n) => (
                  <MenuItem key={n.id} onClick={() => handleNotificationClick(n.chatId, n.id)}>
                    <Box>
                      <Typography variant="body2"><strong>{n.sender}</strong>: {n.text}</Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {new Date().toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
              <Divider />
              <MenuItem onClick={() => navigate('/chat')}>💬 View All Messages</MenuItem>
            </Menu>

            <Tooltip title="Account">
              <IconButton onClick={handleAvatarClick}>
                <Avatar src={`https://ui-avatars.com/api/?name=${userEmail}`} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { fontFamily: 'Georgia, serif' } }}
            >
              <MenuItem onClick={() => navigate('/profile')}>View Profile</MenuItem>
              <MenuItem onClick={() => navigate('/profile#edit')}>Edit Bio</MenuItem>
              <MenuItem onClick={() => navigate('/dashboard')}>My Skills</MenuItem>
              <MenuItem onClick={() => navigate(`/review?user=${userEmail}`)}>My Reviews</MenuItem>
              {showLogout && (
                <MenuItem onClick={handleLogout} sx={{ color: 'red' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="info"
      />
    </>
  );
}
