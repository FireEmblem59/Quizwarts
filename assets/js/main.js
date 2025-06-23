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

const authButton = document.getElementById("auth-button");
const profileLink = document.getElementById("profile-link");
const themeToggle = document.getElementById("theme-toggle");

// --- AUTHENTICATION ---
const provider = new GoogleAuthProvider();

authButton.addEventListener("click", () => {
  if (auth.currentUser) {
    // User is signed in, so sign out
    signOut(auth);
  } else {
    // No user is signed in, so show popup
    signInWithRedirect(auth, provider).catch((error) => {
      console.error("Error during sign-in:", error);
    });
  }
});

getRedirectResult(auth)
  .then((result) => {
    if (result) {
      // This means the user has just signed in.
      // You can get the Google Access Token here if needed.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      // Check for user profile and create one if it doesn't exist
      checkAndCreateUserProfile(user);
    }
  })
  .catch((error) => {
    // Handle Errors here.
    console.error("Authentication redirect error:", error);
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData.email;
    const credential = GoogleAuthProvider.credentialFromError(error);
  });

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    authButton.textContent = "Logout";
    profileLink.classList.remove("hidden");
  } else {
    // User is signed out.
    authButton.textContent = "Login with Google";
    profileLink.classList.add("hidden");
  }
});

async function checkAndCreateUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    // Document doesn't exist, create it
    console.log("Creating new user profile...");
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
    });
  } else {
    console.log("User profile already exists.");
  }
}

// --- THEME TOGGLE ---
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("night-mode");
    const isNight = document.body.classList.contains("night-mode");
    themeToggle.textContent = isNight ? "☀️" : "🌙";
    localStorage.setItem("theme", isNight ? "night" : "day");
  });

  if (localStorage.getItem("theme") === "night") {
    document.body.classList.add("night-mode");
    themeToggle.textContent = "☀️";
  }
}
