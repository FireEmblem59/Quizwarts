import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { getUserProfile } from "./firestore-api.js";

const profilePage = document.getElementById("profile-page");
const authGate = document.getElementById("auth-gate");

// --- AUTH STATE LISTENER ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in, show profile and fetch data
    authGate.classList.add("hidden");
    profilePage.classList.remove("hidden");
    loadUserProfile(user.uid);
  } else {
    // User is not logged in, show message
    authGate.classList.remove("hidden");
    profilePage.classList.add("hidden");
  }
});

// --- DATA FETCHING & RENDERING ---
async function loadUserProfile(uid) {
  const docSnap = await getUserProfile(uid);

  if (docSnap.exists()) {
    const userData = docSnap.data();

    // Fade-in profile avatar loading
    const avatarImg = document.getElementById("profile-avatar");
    const avatarUrl = userData.photoURL || "assets/images/default-avatar.png";
    avatarImg.classList.remove("loaded");
    avatarImg.onload = () => {
      avatarImg.classList.add("loaded");
    };
    avatarImg.src = avatarUrl;

    // Populate profile text info
    document.getElementById("profile-name").textContent = userData.displayName;

    // Leveling info
    const level = Math.floor(userData.xp / 100) + 1;
    const xpForNextLevel = 100;
    const currentXPInLevel = userData.xp % 100;
    document.getElementById("profile-level").textContent = level;
    document.getElementById("profile-xp").textContent = currentXPInLevel;
    document.getElementById("xp-to-next-level").textContent = xpForNextLevel;

    // Check if a level-up occurred previously
    if (localStorage.getItem("levelUp") === "true") {
      const levelElement = document.getElementById("profile-level");
      levelElement.classList.add("level-up-animation");

      // Optional: remove animation class after it's played so it can replay next time
      setTimeout(
        () => levelElement.classList.remove("level-up-animation"),
        1000
      );

      // Show a toast or message
      if (typeof showNotification === "function") {
        showNotification(
          "Level Up!",
          `You've reached Level ${level}!`,
          "success"
        );
      } else {
        alert(`Level Up! You've reached Level ${level}!`);
      }

      localStorage.removeItem("levelUp");
    }

    const titles = ["Novice", "Apprentice", "Adept", "Master"];
    const userTitle = titles[Math.min(level - 1, titles.length - 1)];
    document.getElementById("profile-title").innerHTML =
      "<strong>Title:</strong> " + userTitle;

    // Quiz history
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    if (userData.quizHistory && Object.keys(userData.quizHistory).length > 0) {
      for (const [quizId, result] of Object.entries(userData.quizHistory)) {
        const date = result.date.toDate().toLocaleDateString();
        const listItem = `<li>You scored ${result.score}/${result.total} on <strong>${quizId}</strong> on ${date}</li>`;
        historyList.innerHTML += listItem;
      }
    } else {
      historyList.innerHTML = "<li>No quizzes taken yet!</li>";
    }

    // Render badges with fade-in images
    await renderBadges(userData.badges || []);
  } else {
    console.error("No user data found in Firestore!");
    authGate.innerHTML =
      "<h1>Error</h1><p>Could not find your profile data.</p>";
    authGate.classList.remove("hidden");
    profilePage.classList.add("hidden");
  }
}

async function renderBadges(badgeIds) {
  const badgesContainer = document.getElementById("badges-container");
  badgesContainer.innerHTML = "";

  if (!badgeIds || badgeIds.length === 0) {
    badgesContainer.innerHTML =
      "<p>No badges earned yet. Keep taking quizzes!</p>";
    return;
  }

  // Get a reference to the 'badges' collection
  const badgesRef = collection(db, "badges");

  for (const badgeId of badgeIds) {
    // Create a query to find the document WHERE the 'id' field matches our badgeId
    const q = query(badgesRef, where("id", "==", badgeId));

    try {
      const querySnapshot = await getDocs(q);

      // Check if the query returned any results
      if (!querySnapshot.empty) {
        // We only expect one result, so get the first document
        const badgeDoc = querySnapshot.docs[0];
        const badgeData = badgeDoc.data();

        const badgeElement = `
        <div class="badge" onclick="openBadgeModal('${badgeData.imageUrl}', '${
          badgeData.name
        }', '${badgeData.description.replace(/'/g, "\\'")}')">
            <img src="${badgeData.imageUrl}" alt="${badgeData.name}">
            <span class="badge-title">${badgeData.name}</span>
        </div>
        `;

        badgesContainer.innerHTML += badgeElement;
      } else {
        console.warn(`Badge with id "${badgeId}" not found in the database.`);
      }
    } catch (error) {
      console.error("Error fetching badge:", error);
    }
  }
}
