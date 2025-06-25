// js/logout.js

import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch(err => alert("Logout failed: " + err.message));
});
