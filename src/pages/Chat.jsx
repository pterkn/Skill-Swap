// src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Avatar
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { ref, push, onChildAdded } from 'firebase/database';
import { dbRealtime, auth, db } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { doc, getDoc } from 'firebase/firestore';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const bottomRef = useRef(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partner = searchParams.get('partner');
  const currentUser = auth.currentUser?.email;

  const chatId = [currentUser, partner].sort().join('_').replace(/\./g, '_');

  useEffect(() => {
    const messagesRef = ref(dbRealtime, `chats/${chatId}`);

    onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      setMessages((prev) => [...prev, data]);
    });

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partner) return;
      const docRef = doc(db, 'profiles', partner);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPartnerName(snap.data().name || partner);
      } else {
        setPartnerName(partner);
      }
    };
    fetchPartner();
  }, [partner]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const msgRef = ref(dbRealtime, `chats/${chatId}`);
    await push(msgRef, {
      sender: currentUser,
      receiver: partner,
      message: text,
      timestamp: Date.now()
    });

    setText('');
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 2, backgroundColor: '#FEFFEC' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: '#023020', mr: 1 }}>
              {partnerName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Typography variant="h6" fontFamily="Georgia, serif">
              Chat with {partnerName}
            </Typography>
          </Box>

          <Box
            sx={{
              height: '400px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              borderRadius: 2,
              p: 2,
              mb: 2,
              backgroundColor: '#fff'
            }}
          >
            {messages.map((msg, i) => (
              <Box
                key={i}
                textAlign={msg.sender === currentUser ? 'right' : 'left'}
                mb={1}
              >
                <Typography
                  variant="body2"
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor:
                      msg.sender === currentUser ? '#023020' : '#e0e0e0',
                    color: msg.sender === currentUser ? '#FEFFEC' : '#000'
                  }}
                >
                  {msg.message}
                </Typography>
              </Box>
            ))}
            <div ref={bottomRef} />
          </Box>

          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
            />
            <Button
              onClick={sendMessage}
              variant="contained"
              sx={{ bgcolor: '#023020', color: '#FEFFEC' }}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Container>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="error"
      />
    </>
  );
}
