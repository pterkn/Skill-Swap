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
  InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useLocation } from 'react-router-dom';
import { auth, db, dbRealtime, storage } from '../firebase';
import {
  ref,
  push,
  onChildAdded,
  serverTimestamp,
  update,
  set,
  onValue
} from 'firebase/database';
import {
  uploadBytes,
  getDownloadURL,
  ref as storageRef
} from 'firebase/storage';
import {
  getDoc,
  doc as docFirestore
} from 'firebase/firestore';
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
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState({});

  const chatRef = useRef(null);
  const bottomRef = useRef(null);
  const currentUser = auth.currentUser?.email || '';
  const chatId = [currentUser, partner].sort().join('_').replace(/\./g, '_');

  useEffect(() => {
    const msgRef = ref(dbRealtime, `chats/${chatId}`);
    const typingRef = ref(dbRealtime, `typing/${chatId}/${partner.replace(/\./g, '_')}`);
    const statusRef = ref(dbRealtime, `status/${partner.replace(/\./g, '_')}`);

    onChildAdded(msgRef, (snap) => {
      setMessages((prev) => [...prev, snap.val()]);
      setLoading(false);
    });

    onChildAdded(typingRef, (snap) => {
      if (snap.key === 'typing') setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    onValue(statusRef, (snap) => {
      const data = snap.val();
      setOnline(data?.online);
      setLastSeen(data?.lastSeen);
    });
  }, [chatId, partner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const markSeen = () => {
      const seenRef = ref(dbRealtime, `chatMetadata/${chatId}/unreadCount/${currentUser.replace(/\./g, '_')}`);
      set(seenRef, 0);
    };
    markSeen();
  }, [chatId]);

  useEffect(() => {
    const fetchProfile = async () => {
      const docSnap = await getDoc(docFirestore(db, 'users', partner));
      if (docSnap.exists()) setPartnerProfile(docSnap.data());
    };
    fetchProfile();
  }, [partner]);

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

    await set(ref(dbRealtime, `chatMetadata/${chatId}`), {
      lastMessageAt: Date.now(),
      lastMessageText: input || '📷 Image',
      lastSender: currentUser,
      unreadCount: {
        [partner.replace(/\./g, '_')]: (prev => prev + 1) || 1
      }
    });

    setInput('');
  };

  const handleTyping = () => {
    const typingRef = ref(dbRealtime, `typing/${chatId}/${currentUser.replace(/\./g, '_')}`);
    set(typingRef, { typing: true });
    setTimeout(() => set(typingRef, { typing: false }), 2000);
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
          <Typography variant="caption">
            {online ? '🟢 Online' : `Last seen: ${formatTimestamp(lastSeen)}`}
          </Typography>
          {partnerProfile.bio && (
            <Typography variant="body2" mt={1} color="text.secondary">
              {partnerProfile.bio}
            </Typography>
          )}
        </Box>

        <Paper sx={{ mt: 3, p: 2, backgroundColor: '#FEFFEC', minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : (
            messages.map((msg, i) => (
              <Box
                key={i}
                sx={{ textAlign: msg.sender === currentUser ? 'right' : 'left', my: 1 }}
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
          {typing && (
            <Box display="flex" gap={1} mt={1} ml={1}><Box className="dot" /><Box className="dot" /><Box className="dot" /></Box>
          )}
          <div ref={bottomRef} />
        </Paper>

        {file && (
          <Box mt={2}><img src={URL.createObjectURL(file)} alt="preview" style={{ maxHeight: 100, borderRadius: 8 }} /></Box>
        )}

        <Box display="flex" alignItems="center" mt={2} gap={1}>
          <TextField
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            fullWidth
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
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
