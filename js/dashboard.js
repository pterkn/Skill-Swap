// dashboard.js
import { db, auth } from "../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const form = document.querySelector("form");
const skillList = document.querySelector("ul");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    // Load skill list
    const skillsRef = collection(db, "skills");
    onSnapshot(skillsRef, (snapshot) => {
      skillList.innerHTML = "";
      snapshot.forEach((doc) => {
        const { email, offered, requested } = doc.data();
        const li = document.createElement("li");
        li.textContent = `${email}: Offers ${offered} | Wants ${requested}`;
        skillList.appendChild(li);
      });
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
  createdAt: new Date()  // timestamp added
      });
      alert("Skill added successfully!");

      form.reset();
    });
  }
});
