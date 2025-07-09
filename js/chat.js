import { auth, dbRealtime } from "../firebase.js";
import {
  ref,
  push,
  set,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// 🔍 Get partner email from URL
const urlParams = new URLSearchParams(window.location.search);
const chatPartnerEmail = urlParams.get("partner");

if (!chatPartnerEmail) {
  alert("No chat partner selected.");
  window.location.href = "dashboard.html";
}

document.getElementById("chatPartnerName").textContent = chatPartnerEmail;

// 📎 Generate chat ID
function generateChatId(email1, email2) {
  return [email1, email2].sort().join("_"); // consistent for both users
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const currentEmail = user.email;
  const chatId = generateChatId(currentEmail, chatPartnerEmail);
  const messagesRef = ref(dbRealtime, `chats/${chatId}`);

  // 📩 Load messages
  onChildAdded(messagesRef, (snapshot) => {
    const { sender, message } = snapshot.val();
    const msg = document.createElement("div");
    msg.className = sender === currentEmail ? "my-message" : "their-message";
    msg.textContent = `${sender}: ${message}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  // 📨 Send message
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    const newMsgRef = push(messagesRef);
    set(newMsgRef, {
      sender: currentEmail,
      message,
      timestamp: Date.now()
    });

    chatInput.value = "";
  });
});
