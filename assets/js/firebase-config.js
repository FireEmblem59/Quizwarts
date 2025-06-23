// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNpBg-cZpO8IXllgeE2Mgl3kMVKdlOI5w",
  authDomain: "quizwarts-feb6e.firebaseapp.com",
  projectId: "quizwarts-feb6e",
  storageBucket: "quizwarts-feb6e.firebasestorage.app",
  messagingSenderId: "444772597712",
  appId: "1:444772597712:web:c9823ba57bb68be35bc3d5",
  measurementId: "G-TCT97QXVXG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
