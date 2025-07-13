
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, dbRealtime } from '../firebase';
import { ref, push, onChildAdded } from 'firebase/database';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [partner, setPartner] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const partnerEmail = params.get('partner');
    if (!partnerEmail) return;
    setPartner(partnerEmail);

    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const chatId = generateChatId(userEmail, partnerEmail);
    const chatRef = ref(dbRealtime, `chats/${chatId}`);

    onChildAdded(chatRef, (snap) => {
      setMessages((prev) => [...prev, snap.val()]);
    });
  }, [location.search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateChatId = (a, b) => {
    return [a, b].sort().join('_').replace(/\./g, '_');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const userEmail = auth.currentUser?.email;
    const chatId = generateChatId(userEmail, partner);
    const chatRef = ref(dbRealtime, `chats/${chatId}`);

    try {
      await push(chatRef, {
        sender: userEmail,
        text: newMsg,
        timestamp: Date.now()
      });
      setNewMsg('');
    } catch (err) {
      setToastMsg(' Failed to send message');
      setShowToast(true);
    }
  };

  return (
    <>
      <Header showLogout={true} />
      <div className="container chat-container">
        <h2>Chat with {partner}</h2>

        <div className="chat-window">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${
                msg.sender === auth.currentUser?.email ? 'own' : 'other'
              }`}
            >
              <strong>
                {msg.sender === auth.currentUser?.email ? 'You' : partner}:
              </strong>{' '}
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <form className="chat-form" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="error"
      />
    </>
  );
}
