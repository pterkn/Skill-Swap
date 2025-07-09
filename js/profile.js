import { db, auth } from "../firebase.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const form = document.getElementById("profileForm");
const bioInput = document.getElementById("bio");
const offeredInput = document.getElementById("offeredSkill");
const requestedInput = document.getElementById("requestedSkill");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    bioInput.value = data.bio || "";
    offeredInput.value = data.offered || "";
    requestedInput.value = data.requested || "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await setDoc(userRef, {
      email: user.email,
      bio: bioInput.value,
      offered: offeredInput.value,
      requested: requestedInput.value,
    });
    alert("Profile updated successfully!");
  });
});
