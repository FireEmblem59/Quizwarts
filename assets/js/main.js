// In assets/js/main.js

import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { createUserProfile } from "./firestore-api.js";

// --- Element Selectors ---
// We add checks to make sure these exist before using them.
const authButton = document.getElementById("auth-button");
const profileMenuContainer = document.getElementById("profile-menu-container");
const profileMenuAvatar = document.getElementById("profile-menu-avatar");
const profileDropdown = document.getElementById("profile-dropdown");
const logoutButton = document.getElementById("logout-button");

// --- Global Auth Provider ---
const provider = new GoogleAuthProvider();

// --- Event Listeners (with safety checks) ---
if (authButton) {
  authButton.addEventListener("click", () => {
    // We use the more reliable redirect method
    signInWithRedirect(auth, provider);
  });
}

if (profileMenuContainer) {
  profileMenuContainer.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevents window click event from firing immediately
    if (profileDropdown) profileDropdown.classList.toggle("hidden");
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    signOut(auth);
  });
}

// Hide dropdown if clicking elsewhere on the page
window.addEventListener("click", () => {
  if (profileDropdown && !profileDropdown.classList.contains("hidden")) {
    profileDropdown.classList.add("hidden");
  }
});

// --- Handle Auth State Changes (The Core Logic) ---
onAuthStateChanged(auth, async (user) => {
  // Safety check all elements before trying to modify them
  if (!authButton || !profileMenuContainer || !profileMenuAvatar) {
    console.warn("Auth UI elements not found on this page.");
    return;
  }

  if (user) {
    // --- USER IS LOGGED IN ---
    authButton.classList.add("hidden");
    profileMenuContainer.classList.remove("hidden");
    // Use a simpler placeholder URL
    profileMenuAvatar.src = user.photoURL || "assets/images/default-avatar.png";

    // Apply settings from Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().settings) {
      const settings = docSnap.data().settings;
      document.body.classList.toggle("night-mode", settings.theme === "dark");
      document.body.dataset.audio = settings.audioEnabled;
    } else {
      // Default settings for a user with no saved preferences
      document.body.classList.remove("night-mode");
      document.body.dataset.audio = "true";
    }
  } else {
    // --- USER IS LOGGED OUT ---
    authButton.classList.remove("hidden");
    profileMenuContainer.classList.add("hidden");

    // Apply settings from localStorage
    document.body.classList.toggle(
      "night-mode",
      localStorage.getItem("theme") === "dark"
    );
    document.body.dataset.audio =
      localStorage.getItem("audioEnabled") || "true";
  }
});

// --- Handle the result from the redirect ---
// This runs on every page load to "catch" the login
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      checkAndCreateUserProfile(result.user);
    }
  })
  .catch((error) => {
    console.error("Authentication redirect error:", error);
  });

// --- User Profile Creation ---
async function checkAndCreateUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    console.log("Creating new user profile with default settings...");
    await createUserProfile(user.uid, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date(),
      level: 1,
      xp: 0,
      badges: [],
      quizHistory: {},
      settings: {
        audioEnabled: true,
        theme: "light",
      },
    });
  } else {
    console.log("User profile already exists.");
  }
}
