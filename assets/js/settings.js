// In assets/js/settings.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { showNotification } from "./notifications.js";

let currentUser = null;
let userSettings = {
  audioEnabled: true,
  theme: "light",
}; // Default settings

// --- Elements ---
const audioToggle = document.getElementById("audio-toggle");
const themeToggle = document.getElementById("theme-toggle");
const clearCacheBtn = document.getElementById("clear-cache-btn");

// --- Initialization on Page Load ---
async function initializeSettings(user) {
  if (user) {
    // User is LOGGED IN: Fetch settings from Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists() && docSnap.data().settings) {
      userSettings = { ...userSettings, ...docSnap.data().settings };
    }
  } else {
    // User is LOGGED OUT: Load settings from localStorage
    const localTheme = localStorage.getItem("theme");
    const localAudio = localStorage.getItem("audioEnabled");
    if (localTheme) userSettings.theme = localTheme;
    if (localAudio) userSettings.audioEnabled = localAudio === "true";
  }
  updateUIFromSettings();
}

// --- Update UI based on current settings object ---
// In settings.js
function updateUIFromSettings() {
  audioToggle.checked = userSettings.audioEnabled;
  themeToggle.checked = userSettings.theme === "dark";
  // This makes the setting available globally for other scripts to read
  document.body.dataset.audio = userSettings.audioEnabled;
  document.body.classList.toggle("night-mode", userSettings.theme === "dark");
}

// --- Save settings (either to Firestore or localStorage) ---
async function saveSetting(key, value) {
  userSettings[key] = value;
  if (currentUser) {
    // Logged in: save to Firestore
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      [`settings.${key}`]: value,
    });
  } else {
    // Logged out: save to localStorage
    localStorage.setItem(key, value);
  }
}

// --- Event Listeners ---
audioToggle.addEventListener("change", () => {
  const isEnabled = audioToggle.checked;
  saveSetting("audioEnabled", isEnabled);
  const message = isEnabled
    ? "Sound effects will now play."
    : "Sound effects have been muted.";
  showNotification(
    isEnabled ? "Audio Enabled" : "Audio Disabled",
    message,
    "success"
  );
});

themeToggle.addEventListener("change", () => {
  const newTheme = themeToggle.checked ? "dark" : "light";
  saveSetting("theme", newTheme);
  document.body.classList.toggle("night-mode", themeToggle.checked);
  showNotification("Theme Updated", `Switched to ${newTheme} mode.`);
});

// The cache button now only clears localStorage for logged-out users
clearCacheBtn.addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to clear local settings? This will only affect you when logged out."
    )
  ) {
    localStorage.removeItem("audioEnabled");
    localStorage.removeItem("theme");
    showNotification(
      "Cache Cleared",
      "Your local settings for logged-out state have been reset.",
      "success"
    );
    window.location.reload();
  }
});

// --- Auth State Listener ---
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  initializeSettings(user);
});
