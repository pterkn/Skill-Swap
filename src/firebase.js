// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅ For profile pics, uploads, etc.

// Optional: Enable if using Google Analytics
// import { getAnalytics } from "firebase/analytics";

// ✅ Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_r3gRWiAqqxbrUofwBsLL-SjpI48oQcQ",
  authDomain: "skill-swap-c120d.firebaseapp.com",
  databaseURL: "https://skill-swap-c120d-default-rtdb.firebaseio.com",
  projectId: "skill-swap-c120d",
  storageBucket: "skill-swap-c120d.appspot.com",
  messagingSenderId: "589789024180",
  appId: "1:589789024180:web:f86da7794f070469c82ce1",
  measurementId: "G-N9ZGELZFXS"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase Services
export const auth = getAuth(app);                 // 🔐 Authentication
export const db = getFirestore(app);              // 📘 Firestore (skills, users, reviews)
export const dbRealtime = getDatabase(app);       // 🔄 Realtime DB (chat, typing)
export const storage = getStorage(app);           // 🗂️ Profile images, attachments

// Optional: Uncomment if you plan to use Analytics
// const analytics = getAnalytics(app);
