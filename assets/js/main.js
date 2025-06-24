import { auth, db } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
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
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("User signed in:", result.user);
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;

        // Check if user exists in Firestore, if not, create a profile
        checkAndCreateUserProfile(user);
      })
      .catch((error) => {
        console.error("Authentication error:", error);
      });
  }
});

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    authButton.textContent = "Logout";
    profileLink.classList.remove("hidden");

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().settings) {
      const settings = docSnap.data().settings;
      document.body.classList.toggle("night-mode", settings.theme === "dark");
      document.body.dataset.audio = settings.audioEnabled;
    }
  } else {
    // User is signed out
    authButton.textContent = "Login with Google";
    profileLink.classList.add("hidden");
    document.body.classList.toggle(
      "night-mode",
      localStorage.getItem("theme") === "dark"
    );
    document.body.dataset.audio = localStorage.getItem("audioEnabled");
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
