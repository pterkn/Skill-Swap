import React, { useEffect, useRef, useState } from 'react';
import {
  Container, Box, TextField, Typography, IconButton,
  CircularProgress, Paper, InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useLocation } from 'react-router-dom';
import { auth, db, dbRealtime, storage } from '../firebase';
import { ref, push, onChildAdded, set } from 'firebase/database';
import {
  uploadBytes, getDownloadURL, ref as storageRef
} from 'firebase/storage';
import { getDoc, doc as docFirestore } from 'firebase/firestore';
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
  const [file, setFile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState({});

  const bottomRef = useRef(null);
  const addedKeys = useRef(new Set());

  const currentUser = auth.currentUser?.email || '';
  const chatId = [currentUser, partner].sort().join('_').replace(/\./g, '_');

  //  Listen for incoming messages (deduplicated)
  useEffect(() => {
    const msgRef = ref(dbRealtime, `chats/${chatId}`);
    onChildAdded(msgRef, (snap) => {
      const key = snap.key;
      if (!addedKeys.current.has(key)) {
        setMessages(prev => [...prev, snap.val()]);
        addedKeys.current.add(key);
        setLoading(false);
      }
    });
  }, [chatId]);

  // 🔻 Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //  Reset unread count on mount
  useEffect(() => {
    const seenRef = ref(dbRealtime, `chatMetadata/${chatId}/unreadCount/${currentUser.replace(/\./g, '_')}`);
    set(seenRef, 0);
  }, [chatId]);

  // 👤 Load partner profile
  useEffect(() => {
    const fetchProfile = async () => {
      const docSnap = await getDoc(docFirestore(db, 'users', partner));
      if (docSnap.exists()) setPartnerProfile(docSnap.data());
    };
    fetchProfile();
  }, [partner]);

  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    const timestamp = Date.now();
    const msgRef = ref(dbRealtime, `chats/${chatId}`);

    const message = {
      sender: currentUser,
      text: input,
      timestamp,
    };

    if (file) {
      const path = `uploads/${chatId}/${timestamp}-${file.name}`;
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      message.image = url;
      setFile(null);
    }

    await push(msgRef, message);

    const metadataRef = ref(dbRealtime, `chatMetadata/${chatId}`);
    await set(metadataRef, {
      lastMessageAt: timestamp,
      lastMessageText: input || '📷 Image',
      lastSender: currentUser,
      unreadCount: {
        [partner.replace(/\./g, '_')]: 1
      }
    });

    setInput('');
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} textAlign="center">
          <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', color: 'primary.main' }}>
            Chat with <strong>{partnerProfile.name || partner}</strong>
          </Typography>
          {partnerProfile.bio && (
            <Typography variant="body2" mt={1} color="text.secondary">
              {partnerProfile.bio}
            </Typography>
          )}
        </Box>

        <Paper sx={{
          mt: 3, p: 2,
          backgroundColor: '#FEFFEC',
          minHeight: '400px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
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
                    maxWidth: '80%',
                    boxShadow: 1
                  }}
                >
                  {msg.text}
                  {msg.image && (
                    <img src={msg.image} alt="uploaded" style={{ maxWidth: '100%', marginTop: '5px' }} />
                  )}
                  <br />
                  <small style={{ opacity: 0.7 }}>{formatTimestamp(msg.timestamp)}</small>
                </Typography>
              </Box>
            ))
          )}
          <div ref={bottomRef} />
        </Paper>

        {file && (
          <Box mt={2}>
            <img src={URL.createObjectURL(file)} alt="preview" style={{ maxHeight: 100, borderRadius: 8 }} />
          </Box>
        )}

        <Box display="flex" alignItems="center" mt={2} gap={1}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            fullWidth
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={sendMessage} disabled={!input.trim() && !file}>
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
