import { db, auth } from "../firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const matchList = document.getElementById("matchList");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";

  const snapshot = await getDocs(collection(db, "skills"));

  const currentUserSkills = [];
  const otherSkills = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email === user.email) {
      currentUserSkills.push(data);
    } else {
      otherSkills.push(data);
    }
  });

  const matches = otherSkills.filter(skill =>
    currentUserSkills.some(mySkill =>
      skill.offered.toLowerCase() === mySkill.requested.toLowerCase() &&
      skill.requested.toLowerCase() === mySkill.offered.toLowerCase()
    )
  );

  matchList.innerHTML = "";

  if (matches.length === 0) {
    matchList.innerHTML = "<li>No matches found. Try updating your skills.</li>";
  } else {
    matches.forEach(match => {
      const li = document.createElement("li");
      li.textContent = `${match.email}: Offers ${match.offered} | Wants ${match.requested}`;
      matchList.appendChild(li);
    });
  }
});
