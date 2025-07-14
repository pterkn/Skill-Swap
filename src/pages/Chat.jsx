import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Divider,
  Avatar,
  Tooltip,
  Input,
  Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useLocation } from 'react-router-dom';
import { ref, push, onChildAdded, onValue, set } from 'firebase/database';
import { dbRealtime, auth, db, storage } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const listRef = useRef(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partner = searchParams.get('partner');
  const user = auth.currentUser;

  const chatId = [user.email, partner]
    .sort()
    .join('_')
    .replace(/\./g, '_');

  useEffect(() => {
    const chatRef = ref(dbRealtime, `chats/${chatId}`);
    onChildAdded(chatRef, (snapshot) => {
      const message = snapshot.val();
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    });

    const typingRef = ref(dbRealtime, `typing/${chatId}/${partner}`);
    onValue(typingRef, (snap) => {
      setPartnerTyping(snap.val() === true);
    });
  }, [chatId, partner]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!partner) return;
      const docRef = doc(db, 'users', partner);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPartnerProfile(snap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [partner]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const message = {
      sender: user.email,
      text,
      timestamp: Date.now(),
      read: false
    };
    const chatRef = ref(dbRealtime, `chats/${chatId}`);
    await push(chatRef, message);
    set(ref(dbRealtime, `typing/${chatId}/${user.email}`), false);
    setText('');
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setText(val);
    setTyping(true);
    set(ref(dbRealtime, `typing/${chatId}/${user.email}`), true);

    setTimeout(() => {
      setTyping(false);
      set(ref(dbRealtime, `typing/${chatId}/${user.email}`), false);
    }, 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = storageRef(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    const message = {
      sender: user.email,
      text: '',
      fileUrl: url,
      fileName: file.name,
      timestamp: Date.now(),
      read: false
    };

    const chatRef = ref(dbRealtime, `chats/${chatId}`);
    await push(chatRef, message);
    setToastMsg('📎 File sent!');
    setShowToast(true);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={4} mb={2}>
          {loading ? (
            <CircularProgress />
          ) : (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={`https://ui-avatars.com/api/?name=${partner}`} />
                <Box>
                  <Typography variant="h6">Chat with {partner}</Typography>
                  {partnerProfile?.bio && (
                    <Typography variant="body2" color="textSecondary">
                      {partnerProfile.bio}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        <Paper elevation={2} sx={{ maxHeight: 400, overflowY: 'auto', p: 2 }}>
          <List>
            {messages.map((msg, i) => (
              <ListItem
                key={i}
                sx={{
                  justifyContent:
                    msg.sender === user.email ? 'flex-end' : 'flex-start'
                }}
              >
                <Tooltip title={msg.sender} placement="top">
                  <ListItemText
                    primary={
                      msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          📎 {msg.fileName || 'File'}
                        </a>
                      ) : (
                        msg.text
                      )
                    }
                    secondary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption">
                          {formatTime(msg.timestamp)}
                        </Typography>
                        {msg.sender === user.email && (
                          <Box display="flex" alignItems="center">
                            <DoneAllIcon fontSize="small" sx={{ color: '#4caf50', ml: 1 }} />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              Sent
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                    sx={{
                      backgroundColor:
                        msg.sender === user.email ? '#CDE8C2' : '#FEFFEC',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      maxWidth: '70%',
                      wordBreak: 'break-word'
                    }}
                  />
                </Tooltip>
              </ListItem>
            ))}
            {partnerTyping && (
              <ListItem>
                <Typography variant="body2" color="textSecondary">
                  {partner} is typing...
                </Typography>
              </ListItem>
            )}
            <div ref={listRef} />
          </List>
        </Paper>

        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <label htmlFor="file-upload">
            <Input
              id="file-upload"
              type="file"
              sx={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <IconButton component="span">
              <AttachFileIcon />
            </IconButton>
          </label>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message"
            value={text}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />

          <IconButton color="primary" onClick={sendMessage}>
            <SendIcon />
          </IconButton>
        </Box>
      </Container>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="info"
      />
    </>
  );
}
