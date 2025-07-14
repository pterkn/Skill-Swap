import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { dbRealtime, auth, db } from '../firebase';
import {
  ref,
  push,
  onChildAdded,
  serverTimestamp
} from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';

export default function Chat() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partner = searchParams.get('partner');
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef();
  const [partnerProfile, setPartnerProfile] = useState(null);

  useEffect(() => {
    const chatId = [user.email, partner].sort().join('_').replace(/\./g, '_');
    const messagesRef = ref(dbRealtime, 'chats/' + chatId);

    onChildAdded(messagesRef, (snap) => {
      setMessages((prev) => [...prev, snap.val()]);
    });
  }, [user, partner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      const snap = await getDoc(doc(db, 'profiles', partner));
      if (snap.exists()) {
        setPartnerProfile(snap.data());
      }
    };
    fetchPartnerProfile();
  }, [partner]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const chatId = [user.email, partner].sort().join('_').replace(/\./g, '_');
    const messagesRef = ref(dbRealtime, 'chats/' + chatId);

    push(messagesRef, {
      sender: user.email,
      text,
      timestamp: serverTimestamp()
    });
    setText('');
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center">
              <Avatar
                src={`https://ui-avatars.com/api/?name=${partner}`}
                sx={{ width: 50, height: 50, mr: 2 }}
              />
              <Box>
                <Typography variant="h6">
                  {partnerProfile?.name || partner}
                </Typography>
                {partnerProfile?.bio && (
                  <Typography variant="caption">{partnerProfile.bio}</Typography>
                )}
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, height: '60vh', overflowY: 'auto', mb: 2 }}>
            {messages.map((msg, i) => (
              <Box
                key={i}
                display="flex"
                justifyContent={msg.sender === user.email ? 'flex-end' : 'flex-start'}
                mb={1}
              >
                <Box
                  bgcolor={msg.sender === user.email ? 'primary.main' : 'grey.300'}
                  color={msg.sender === user.email ? 'white' : 'black'}
                  p={1.5}
                  borderRadius={2}
                  maxWidth="75%"
                >
                  <Typography>{msg.text}</Typography>
                </Box>
              </Box>
            ))}
            <div ref={bottomRef}></div>
          </Paper>

          <Box display="flex" gap={1}>
            <TextField
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              placeholder="Type your message..."
            />
            <Button variant="contained" onClick={sendMessage}>
              Send
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}
