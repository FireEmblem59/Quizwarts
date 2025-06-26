// In assets/js/main.js

import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { showNotification } from "./notifications.js";

console.log("--- SCRIPT START --- main.js loaded for POPUP flow.");

// --- Element Selectors ---
const authButton = document.getElementById("auth-button");
const profileMenuContainer = document.getElementById("profile-menu-container");
const profileMenuAvatar = document.getElementById("profile-menu-avatar");
const profileDropdown = document.getElementById("profile-dropdown");
const logoutButton = document.getElementById("logout-button");

// --- Global Auth Provider ---
const provider = new GoogleAuthProvider();

/**
 * Updates the UI based on the user's login state.
 */
async function updateUI(user) {
  if (!authButton || !profileMenuContainer) return;

  if (user) {
    authButton.classList.add("hidden");
    profileMenuContainer.classList.remove("hidden");
    profileMenuAvatar.src = user.photoURL || "assets/images/default-avatar.png";

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().settings) {
      const settings = docSnap.data().settings;
      document.body.classList.toggle("night-mode", settings.theme === "dark");
      document.body.dataset.audio = settings.audioEnabled;
    }
  } else {
    authButton.classList.remove("hidden");
    profileMenuContainer.classList.add("hidden");

    document.body.classList.toggle(
      "night-mode",
      localStorage.getItem("theme") === "dark"
    );
    document.body.dataset.audio =
      localStorage.getItem("audioEnabled") || "true";
  }
}

/**
 * Creates a user profile in Firestore if one doesn't exist.
 */
async function checkAndCreateUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    console.log("Creating new user profile with default settings...");
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date(),
      level: 1,
      xp: 0,
      badges: [],
      quizHistory: {},
      settings: { audioEnabled: true, theme: "light" },
    });
  }
}

/**
 * Handles the Google Sign-In process using a popup.
 */
async function savePendingQuizResult() {
  const pendingResultJSON = sessionStorage.getItem("pendingQuizResult");
  if (!pendingResultJSON) return; // No pending result, do nothing

  console.log("Pending quiz result found. Attempting to save...");
  const result = JSON.parse(pendingResultJSON);
  const user = auth.currentUser;

  if (!user) {
    console.error("Tried to save pending result, but user is not logged in.");
    sessionStorage.removeItem("pendingQuizResult"); // Clean up
    return;
  }

  // We can reuse most of the logic from quiz.js's endQuiz function here
  const userRef = doc(db, "users", user.uid);
  const leaderboardRef = doc(
    db,
    "leaderboards",
    result.quizId,
    "scores",
    user.uid
  );

  // Save to leaderboard (you can add the high-score check here too if desired)
  await setDoc(leaderboardRef, {
    score: result.score,
    timeTaken: result.timeTaken,
    displayName: user.displayName,
    photoURL: user.photoURL,
    uid: user.uid,
    timestamp: new Date(),
  });

  // Update user's quiz history
  await updateDoc(userRef, {
    [`quizHistory.${result.quizId}`]: {
      score: result.score,
      total: result.totalQuestions,
      timeTaken: result.timeTaken,
      date: new Date(),
    },
  });

  console.log("Pending result saved successfully!");
  showNotification(
    "Score Saved!",
    "Your quiz result has been added to your profile.",
    "success"
  );

  // IMPORTANT: Clean up the pending result so it doesn't save again
  sessionStorage.removeItem("pendingQuizResult");
}

// --- MODIFY THE handleSignIn FUNCTION ---
async function handleSignIn() {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, provider);
    console.log("Popup sign-in SUCCESS! User:", result.user);

    // After a successful sign-in, create the profile and THEN check for a pending score
    await checkAndCreateUserProfile(result.user);
    await savePendingQuizResult(); // <-- CHECK FOR AND SAVE THE SCORE
  } catch (error) {
    console.error("Popup sign-in FAILED:", error);
    if (error.code === "auth/popup-blocked") {
      alert(
        "Popup was blocked by the browser. Please allow popups for this site and try again."
      );
    }
  }
}

window.addEventListener("requestLogin", handleSignIn);

/**
 * Main application setup.
 */
function initializeApp() {
  console.log("Initializing app...");

  // Set up the permanent auth state listener
  onAuthStateChanged(auth, (user) => {
    console.log(
      `[onAuthStateChanged] TRIGGERED. User:`,
      user ? user.uid : "null"
    );
    updateUI(user);
  });

  // Set up UI click listeners
  if (authButton) {
    authButton.addEventListener("click", handleSignIn);
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      signOut(auth);
    });
  }
  if (profileMenuContainer) {
    profileMenuContainer.addEventListener("click", (event) => {
      event.stopPropagation();
      if (profileDropdown) profileDropdown.classList.toggle("hidden");
    });
  }
  window.addEventListener("click", () => {
    if (profileDropdown && !profileDropdown.classList.contains("hidden")) {
      profileDropdown.classList.add("hidden");
    }
  });

  console.log("App ready.");
}

// --- START THE APPLICATION ---
initializeApp();
