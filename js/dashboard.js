// dashboard.js
import { db, auth, dbRealtime } from "../firebase.js";
import {
  collection,
  addDoc,

  const loading = document.getElementById("loading");
loading.classList.remove("hidden");

onSnapshot(skillsRef, (snapshot) => {
  allSkills = snapshot.docs.map(doc => doc.data());
  renderSkills(allSkills);
  loading.classList.add("hidden"); // Hide when done
});

loading.classList.remove("hidden"); // Show while submitting

try {
  await addDoc(collection(db, "skills"), {
    email: user.email,
    offered,
    requested,
    createdAt: new Date()
  });

  alert("Skill added successfully!");
  form.reset();
} catch (error) {
  alert("⚠️ Failed to add skill.");
}

loading.classList.add("hidden"); // Hide after submit


  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  ref,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const form = document.querySelector("form");
const skillList = document.getElementById("skillList");
const searchBar = document.getElementById("searchBar");
const toast = document.getElementById("toast");
let allSkills = [];
// Check if user is offline
if (!navigator.onLine) {
  showToast("📴 You're offline. Some features may not work.");
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    const skillsRef = collection(db, "skills");

    // Real-time Firestore skill listener
    onSnapshot(skillsRef, (snapshot) => {
      allSkills = snapshot.docs.map(doc => doc.data());

      // Sort alphabetically by 'offered'
      allSkills.sort((a, b) => {
        return a.offered.toLowerCase().localeCompare(b.offered.toLowerCase());
      });

      renderSkills(allSkills);
    });

    // Render skill listings
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
      ${skill.email !== auth.currentUser.email
        ? `<button onclick="window.location.href='chat.html?partner=${skill.email}'">Chat</button>`
        : ''}
    `;

    skillList.appendChild(li);
  });
}


        li.innerHTML += `
  <button onclick="window.location.href='review.html?user=${skill.email}'">Rate</button>
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

      filtered.sort((a, b) => {
        return a.offered.toLowerCase().localeCompare(b.offered.toLowerCase());
      });

      renderSkills(filtered);
    });

    // Add new skill
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const offered = form.querySelector("input[placeholder='Skill You Offer']").value;
      const requested = form.querySelector("input[placeholder='Skill You Want']").value;

      await addDoc(collection(db, "skills"), {
        email: user.email,
        offered,
        requested,
        createdAt: new Date()
      });

      alert("Skill added successfully!");
      form.reset();
    });

    //  Toast helper
    function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}


    //  Listen for new messages
    function listenForNewMessages(currentUserEmail) {
      const chatsRef = ref(dbRealtime, "chats");

      // Listen to all chat threads
      onChildAdded(chatsRef, (chatSnapshot) => {
        const chatId = chatSnapshot.key;

        // Only react to chats involving the current user
        if (!chatId.includes(currentUserEmail.replace(/\./g, "_"))) return;

        const messagesRef = ref(dbRealtime, `chats/${chatId}`);

        // Listen for incoming messages in the chat
        onChildAdded(messagesRef, (msgSnap) => {
          const data = msgSnap.val();

          if (data.sender !== currentUserEmail) {
            showToast(`New message from ${data.sender}`);
          }
        });
      });
    }

    // Start listening for message notifications
    listenForNewMessages(user.email);

    try {
  onSnapshot(skillsRef, (snapshot) => {
    allSkills = snapshot.docs.map(doc => doc.data());
    renderSkills(allSkills);
  });
} catch (err) {
  skillList.innerHTML = `<li>⚠️ Error loading skills. Try again later.</li>`;
}

try {
  await addDoc(collection(db, "skills"), {
    email: user.email,
    offered,
    requested,
    createdAt: new Date()
  });

  alert("Skill added successfully!");
  form.reset();
} catch (error) {
  alert("⚠️ Failed to add skill. Please try again.");
}

  }
});
