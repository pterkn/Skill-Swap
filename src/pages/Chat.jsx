import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ref,
  push,
  onChildAdded,
  update,
  onValue
} from 'firebase/database';
import { dbRealtime, auth } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [typingStatus, setTypingStatus] = useState({});
  const [recentPartners, setRecentPartners] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const user = auth.currentUser;
  const sender = user?.email?.replace(/\./g, '_');
  const partner = searchParams.get('partner');
  const receiver = partner?.replace(/\./g, '_');
  const chatId = [sender, receiver].sort().join('_');

  useEffect(() => {
    const chatRef = ref(dbRealtime, `chats/${chatId}/messages`);
    onChildAdded(chatRef, (snapshot) => {
      const msg = snapshot.val();
      setMessages((prev) => [...prev, msg]);
    });

    const typingRef = ref(dbRealtime, `chats/${chatId}/typing`);
    onValue(typingRef, (snap) => {
      setTypingStatus(snap.val() || {});
    });

    const indexRef = ref(dbRealtime, `chatIndex/${sender}`);
    onValue(indexRef, (snap) => {
      const data = snap.val() || {};
      setRecentPartners(Object.keys(data));
    });
  }, [chatId, sender]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const chatRef = ref(dbRealtime, `chats/${chatId}/messages`);
    push(chatRef, {
      sender: user.email,
      text: input,
      time: new Date().toLocaleTimeString()
    });

    update(ref(dbRealtime, `chats/${chatId}/typing`), {
      [sender]: false
    });

    update(ref(dbRealtime, `chatIndex/${sender}`), {
      [receiver]: Date.now()
    });

    update(ref(dbRealtime, `chatIndex/${receiver}`), {
      [sender]: Date.now()
    });

    setInput('');
    setToastMsg('✅ Message sent!');
    setShowToast(true);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    update(ref(dbRealtime, `chats/${chatId}/typing`), {
      [sender]: true
    });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      update(ref(dbRealtime, `chats/${chatId}/typing`), {
        [sender]: false
      });
    }, 2000);
  };

  return (
    <>
      <Header showLogout={true} />
      <Box display="flex">
        <Box width={250} p={2} borderRight="1px solid #ccc">
          <Typography variant="h6">Recent Chats</Typography>
          {recentPartners.map((p) => (
            <Button
              key={p}
              fullWidth
              variant="text"
              onClick={() => navigate(`/chat?partner=${p.replace(/_/g, '.')}`)}
            >
              {p.replace(/_/g, '.')}
            </Button>
          ))}
        </Box>

        <Container maxWidth="sm" sx={{ flexGrow: 1 }}>
          <Box mt={2} mb={1}>
            <Typography variant="h5" align="center">
              Chat with {partner}
            </Typography>
          </Box>

          <Paper elevation={3} sx={{ height: '60vh', overflowY: 'auto', p: 2 }}>
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                display="flex"
                justifyContent={msg.sender === user.email ? 'flex-end' : 'flex-start'}
                mb={1}
              >
                {msg.sender !== user.email && (
                  <Avatar
                    src={`https://ui-avatars.com/api/?name=${msg.sender}`}
                    sx={{ mr: 1, width: 32, height: 32 }}
                  />
                )}
                <Box
                  sx={{
                    bgcolor: msg.sender === user.email ? '#1976d2' : '#e0e0e0',
                    color: msg.sender === user.email ? '#fff' : '#000',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: '75%'
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                    {msg.time}
                  </Typography>
                </Box>
              </Box>
            ))}
            <div ref={bottomRef}></div>
          </Paper>

          {typingStatus[receiver] && (
            <Typography fontStyle="italic" fontSize={13} mt={1} color="gray">
              {partner} is typing...
            </Typography>
          )}

          <Box display="flex" mt={2} gap={1}>
            <TextField
              value={input}
              onChange={handleInputChange}
              fullWidth
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button variant="contained" onClick={handleSend} endIcon={<SendIcon />}>
              Send
            </Button>
          </Box>
        </Container>
      </Box>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />
    </>
  );
}
