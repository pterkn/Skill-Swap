// dashboard.js
import { db, auth, dbRealtime } from "../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  ref,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// DOM references
const form = document.querySelector("form");
const skillList = document.getElementById("skillList");
const searchBar = document.getElementById("searchBar");
const toast = document.getElementById("toast");
const loading = document.getElementById("loading");

let allSkills = [];

// Show toast message
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// Detect offline mode
if (!navigator.onLine) {
  showToast("📴 You're offline. Some features may not work.");
}

// Firebase Auth listener
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const skillsRef = collection(db, "skills");

  // Fetch and render skills
  try {
    loading.classList.remove("hidden");

    onSnapshot(skillsRef, (snapshot) => {
      allSkills = snapshot.docs.map(doc => doc.data());

      allSkills.sort((a, b) =>
        a.offered.toLowerCase().localeCompare(b.offered.toLowerCase())
      );

      renderSkills(allSkills);
      loading.classList.add("hidden");
    });
  } catch (err) {
    skillList.innerHTML = `<li>⚠️ Error loading skills. Try again later.</li>`;
    loading.classList.add("hidden");
  }

  // Render skills to DOM
  function renderSkills(skillsToRender) {
    skillList.innerHTML = "";

    if (skillsToRender.length === 0) {
      const li = document.createElement("li");
      li.textContent = "😕 No matching skills found.";
      skillList.appendChild(li);
      return;
    }

    skillsToRender.forEach(skill => {
      const li = document.createElement("li");

      let dateStr = "";
      if (skill.createdAt?.toDate) {
        const d = skill.createdAt.toDate();
        dateStr = ` | Added on ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
      }

      li.innerHTML = `
        ${skill.email}: Offers ${skill.offered} | Wants ${skill.requested}${dateStr}
        ${skill.email !== user.email
          ? `
            <button onclick="window.location.href='chat.html?partner=${skill.email}'">Chat</button>
            <button onclick="window.location.href='review.html?user=${skill.email}'">Rate</button>
          `
          : ""}
      `;

      skillList.appendChild(li);
    });
  }

  // Live search
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    const filtered = allSkills.filter(skill =>
      skill.offered?.toLowerCase().includes(query) ||
      skill.requested?.toLowerCase().includes(query)
    );

    filtered.sort((a, b) =>
      a.offered.toLowerCase().localeCompare(b.offered.toLowerCase())
    );

    renderSkills(filtered);
  });

  // Add new skill
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const offered = form.querySelector("input[placeholder='Skill You Offer']").value;
    const requested = form.querySelector("input[placeholder='Skill You Want']").value;

    loading.classList.remove("hidden");

    try {
      await addDoc(collection(db, "skills"), {
        email: user.email,
        offered,
        requested,
        createdAt: new Date()
      });

      alert("✅ Skill added successfully!");
      form.reset();
    } catch (error) {
      alert("⚠️ Failed to add skill. Please try again.");
    }

    loading.classList.add("hidden");
  });

  // Listen for new chat messages
  function listenForNewMessages(currentUserEmail) {
    const chatsRef = ref(dbRealtime, "chats");

    onChildAdded(chatsRef, (chatSnapshot) => {
      const chatId = chatSnapshot.key;
      if (!chatId.includes(currentUserEmail.replace(/\./g, "_"))) return;

      const messagesRef = ref(dbRealtime, `chats/${chatId}`);

      onChildAdded(messagesRef, (msgSnap) => {
        const data = msgSnap.val();

        if (data.sender !== currentUserEmail) {
          showToast(`📨 New message from ${data.sender}`);
        }
      });
    });
  }

  // Start listening
  listenForNewMessages(user.email);
});
