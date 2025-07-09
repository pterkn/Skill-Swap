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
const skillList = document.getElementById("skillList");
const searchBar = document.getElementById("searchBar");
let allSkills = [];

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    const skillsRef = collection(db, "skills");

    // Real-time listener
    onSnapshot(skillsRef, (snapshot) => {
      allSkills = snapshot.docs.map(doc => doc.data());

      //  Sort alphabetically by 'offered' skill
      allSkills.sort((a, b) => {
        return a.offered.toLowerCase().localeCompare(b.offered.toLowerCase());
      });

      renderSkills(allSkills);
    });

    // Render function
    function renderSkills(skillsToRender) {
      skillList.innerHTML = "";
      skillsToRender.forEach(skill => {
        const li = document.createElement("li");

        let dateStr = "";
        if (skill.createdAt?.toDate) {
          const d = skill.createdAt.toDate();
          dateStr = ` | Added on ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        }

        li.textContent = `${skill.email}: Offers ${skill.offered} | Wants ${skill.requested}${dateStr}`;
        skillList.appendChild(li);
      });
    }

    // Live filter
    searchBar.addEventListener("input", () => {
      const query = searchBar.value.toLowerCase();
      const filtered = allSkills.filter(skill =>
        skill.offered?.toLowerCase().includes(query) ||
        skill.requested?.toLowerCase().includes(query)
      );

      //  Sort filtered results too
      filtered.sort((a, b) => {
        return a.offered.toLowerCase().localeCompare(b.offered.toLowerCase());
      });

      renderSkills(filtered);
    });

    // Skill submission
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
  }
});
