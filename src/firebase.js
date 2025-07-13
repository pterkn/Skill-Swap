// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Optional: Only import analytics if you're using it
// import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//  Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const dbRealtime = getDatabase(app);

// Optional: Uncomment if you use analytics
// const analytics = getAnalytics(app);
