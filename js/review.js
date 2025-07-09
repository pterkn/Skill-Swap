import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const form = document.getElementById("reviewForm");
const starContainer = document.getElementById("starRating");
const starInput = document.getElementById("stars");
const commentInput = document.getElementById("comment");

let ratedUserEmail;

// ⭐ Interactive stars
starContainer.addEventListener("click", (e) => {
  if (!e.target.textContent.includes("★")) return;
  const index = Array.from(starContainer.children).indexOf(e.target);
  starInput.value = index + 1;

  [...starContainer.children].forEach((star, i) => {
    star.textContent = i <= index ? "★" : "☆";
  });
});

// Get rated user from URL
const urlParams = new URLSearchParams(window.location.search);
ratedUserEmail = urlParams.get("user");

onAuthStateChanged(auth, async (user) => {
  if (!user || !ratedUserEmail) return (window.location.href = "dashboard.html");

  const reviewRef = collection(db, "reviews");

  // Prevent duplicate reviews
  const q = query(reviewRef, where("ratedBy", "==", user.email), where("ratedUser", "==", ratedUserEmail));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    alert("You’ve already reviewed this user.");
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    await addDoc(reviewRef, {
      ratedUser: ratedUserEmail,
      ratedBy: user.email,
      stars: parseInt(starInput.value),
      comment: commentInput.value.trim(),
      createdAt: serverTimestamp()
    });

    alert("Review submitted!");
    window.location.href = "dashboard.html";
  });
});
