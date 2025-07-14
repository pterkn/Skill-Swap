import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Paper,
  Button,
  InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useLocation } from 'react-router-dom';
import { auth, dbRealtime, storage } from '../firebase';
import {
  ref,
  push,
  onChildAdded,
  serverTimestamp,
  update
} from 'firebase/database';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Chat() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partner = searchParams.get('partner');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);

  const chatRef = useRef(null);
  const currentUser = auth.currentUser?.email || '';
  const chatId = [currentUser, partner].sort().join('_').replace(/\./g, '_');

  useEffect(() => {
    const msgRef = ref(dbRealtime, `chats/${chatId}`);
    const typingRef = ref(dbRealtime, `typing/${chatId}/${partner.replace(/\./g, '_')}`);

    onChildAdded(msgRef, (snap) => {
      setMessages((prev) => [...prev, snap.val()]);
      setLoading(false);
    });

    onChildAdded(typingRef, (snap) => {
      if (snap.key === 'typing') setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });
  }, [chatId, partner]);

  const sendMessage = async () => {
    if (!input.trim() && !file) return;
    const msgRef = ref(dbRealtime, `chats/${chatId}`);
    let message = {
      sender: currentUser,
      text: input,
      timestamp: Date.now()
    };

    if (file) {
      const filePath = `uploads/${chatId}/${Date.now()}-${file.name}`;
      const fileRef = storageRef(storage, filePath);
      const snapshot = await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(snapshot.ref);
      message.image = fileURL;
      setFile(null);
    }

    push(msgRef, message);
    setInput('');
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} textAlign="center">
          <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', color: 'primary.main' }}>
            Chat with <strong>{partner}</strong>
          </Typography>
        </Box>

        <Paper sx={{ mt: 3, p: 2, backgroundColor: '#FEFFEC', minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }} ref={chatRef}>
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : (
            messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  textAlign: msg.sender === currentUser ? 'right' : 'left',
                  my: 1
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    background: msg.sender === currentUser ? '#023020' : '#cfcfcf',
                    color: msg.sender === currentUser ? '#FEFFEC' : '#000',
                    display: 'inline-block',
                    p: 1,
                    borderRadius: 2,
                    maxWidth: '80%'
                  }}
                >
                  {msg.text}
                  {msg.image && (
                    <img src={msg.image} alt="uploaded" style={{ maxWidth: '100%', marginTop: '5px' }} />
                  )}
                  <br />
                  <small style={{ opacity: 0.7 }}>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </Typography>
              </Box>
            ))
          )}

          {typing && (
            <Typography variant="caption" color="text.secondary">
              {partner} is typing...
            </Typography>
          )}
        </Paper>

        <Box display="flex" alignItems="center" mt={2} gap={1}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            fullWidth
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={sendMessage}>
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <label htmlFor="file-input">
            <input
              id="file-input"
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <IconButton component="span">
              <ImageIcon />
            </IconButton>
          </label>
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
