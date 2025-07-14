import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, dbRealtime } from '../firebase';
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
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Toast from './Toast';
import { ref, onChildAdded, remove } from 'firebase/database';

export default function Header({ showLogout = false }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchor(null);
    setNotifications([]);
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.email.replace(/\./g, '_');
    const chatsRef = ref(dbRealtime, 'chats');

    onChildAdded(chatsRef, (chatSnap) => {
      const chatId = chatSnap.key;
      if (!chatId.includes(userId)) return;

      const messagesRef = ref(dbRealtime, `chats/${chatId}`);
      onChildAdded(messagesRef, (msgSnap) => {
        const msg = msgSnap.val();
        if (msg.sender !== user.email) {
          setNotifications((prev) => [
            { id: msgSnap.key, sender: msg.sender, text: msg.text, chatId },
            ...prev
          ]);
          setToastMsg(`💬 New message from ${msg.sender}`);
          setShowToast(true);
        }
      });
    });
  }, []);

  const handleNotificationClick = (chatId, msgId) => {
    navigate(`/chat?partner=${chatId.replace(auth.currentUser.email.replace(/\./g, '_'), '')}`);
    const notifRef = ref(dbRealtime, `chats/${chatId}/${msgId}`);
    remove(notifRef);
    setNotifications((prev) => prev.filter((n) => n.id !== msgId));
    setNotifAnchor(null);
  };

  return (
    <>
      <AppBar position="static" elevation={1} sx={{ backgroundColor: '#023020', color: '#FEFFEC' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center">
            <Avatar
              alt="SkillSwap Logo"
              src="/logo.png"
              sx={{ width: 40, height: 40, mr: 1 }}
            />
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{ textDecoration: 'none', color: '#FEFFEC' }}
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
            >
              {notifications.length === 0 ? (
                <MenuItem>No new messages</MenuItem>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleNotificationClick(n.chatId, n.id)}
                  >
                    {n.sender}: {n.text}
                  </MenuItem>
                ))
              )}
            </Menu>

            <Tooltip title="Account settings">
              <IconButton onClick={handleAvatarClick} sx={{ p: 0 }}>
                <Avatar src={`https://ui-avatars.com/api/?name=${auth.currentUser?.email}`} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
              {showLogout && (
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
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
