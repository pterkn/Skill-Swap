// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKS0t6FsBe0D-GmXWbV_qPmDSQMk-DANg",
  authDomain: "skill-swap-e66e8.firebaseapp.com",
  projectId: "skill-swap-e66e8",
  storageBucket: "skill-swap-e66e8.firebasestorage.app",
  messagingSenderId: "860450029627",
  appId: "1:860450029627:web:11265d167d56c82b165c1e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
