// auth.js
import { auth } from "../firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
const email = document.getElementById("signupEmail").value;

const passwordInput = document.getElementById("signupPassword");
const confirmInput = document.getElementById("confirmPassword");
const passwordStrength = document.getElementById("passwordStrength");
const confirmError = document.getElementById("confirmError");

const password = passwordInput.value;
const confirmPassword = confirmInput.value;

const passwordInput = document.getElementById("signupPassword");
const strengthFill = document.getElementById("strengthFill");

passwordInput?.addEventListener("input", () => {
  const val = passwordInput.value;
  let score = 0;

  if (val.length >= 6) score += 1;
  if (/[A-Z]/.test(val)) score += 1;
  if (/[0-9]/.test(val)) score += 1;
  if (/[^A-Za-z0-9]/.test(val)) score += 1;

  const width = [0, 25, 50, 75, 100][score];
  const colors = ["transparent", "red", "orange", "gold", "green"];

  strengthFill.style.width = `${width}%`;
  strengthFill.style.backgroundColor = colors[score];
});


// Password strength checker
passwordInput?.addEventListener("input", () => {
  const value = passwordInput.value;
  let strength = "Weak";
  passwordStrength.classList.remove("good");

  if (value.length >= 6 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
    strength = "Strong";
    passwordStrength.classList.add("good");
  } else if (value.length >= 6) {
    strength = "Moderate";
  }

  passwordStrength.textContent = `Password Strength: ${strength}`;
});

// Confirm password match
confirmInput?.addEventListener("input", () => {
  if (confirmInput.value !== passwordInput.value) {
    confirmError.textContent = "Passwords do not match.";
  } else {
    confirmError.textContent = "";
  }
});


    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "dashboard.html";  // Redirect here
      })
      .catch(err => alert("Signup failed: " + err.message));
  });
}


if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = "dashboard.html")
      .catch(err => alert("Login failed: " + err.message));
  });
}
