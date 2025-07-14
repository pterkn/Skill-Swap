// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅ Add this line

// Optional: Analytics (if needed)
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD_r3gRWiAqqxbrUofwBsLL-SjpI48oQcQ",
  authDomain: "skill-swap-c120d.firebaseapp.com",
  databaseURL: "https://skill-swap-c120d-default-rtdb.firebaseio.com",
  projectId: "skill-swap-c120d",
  storageBucket: "skill-swap-c120d.appspot.com", // ✅ Must match for storage
  messagingSenderId: "589789024180",
  appId: "1:589789024180:web:f86da7794f070469c82ce1",
  measurementId: "G-N9ZGELZFXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const dbRealtime = getDatabase(app);
export const storage = getStorage(app); // ✅ Storage added

// Optional: Enable if using analytics
// const analytics = getAnalytics(app);
