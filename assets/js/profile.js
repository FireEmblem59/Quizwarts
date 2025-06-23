import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const userData = docSnap.data();

    // Populate Header
    document.getElementById("profile-avatar").src =
      userData.photoURL || "https://via.placeholder.com/150";
    document.getElementById("profile-name").textContent = userData.displayName;

    // Populate Stats (with leveling logic)
    const level = Math.floor(userData.xp / 100) + 1;
    const xpForNextLevel = 100;
    const currentXPInLevel = userData.xp % 100;
    document.getElementById("profile-level").textContent = level;
    document.getElementById("profile-xp").textContent = currentXPInLevel;
    document.getElementById("xp-to-next-level").textContent = xpForNextLevel;

    // Populate Quiz History
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = ""; // Clear
    if (userData.quizHistory && Object.keys(userData.quizHistory).length > 0) {
      for (const [quizId, result] of Object.entries(userData.quizHistory)) {
        const date = result.date.toDate().toLocaleDateString();
        const listItem = `<li>You scored ${result.score}/${result.total} on <strong>${quizId}</strong> on ${date}</li>`;
        historyList.innerHTML += listItem;
      }
    } else {
      historyList.innerHTML = "<li>No quizzes taken yet!</li>";
    }

    // We will call the badge renderer here in the next step
    // renderBadges(userData.badges);
  } else {
    console.error("No user data found in Firestore!");
    authGate.innerHTML =
      "<h1>Error</h1><p>Could not find your profile data.</p>";
    authGate.classList.remove("hidden");
    profilePage.classList.add("hidden");
  }
  await renderBadges(userData.badges || []);
}

async function renderBadges(badgeIds) {
  const badgesContainer = document.getElementById("badges-container");
  badgesContainer.innerHTML = "";

  if (!badgeIds || badgeIds.length === 0) {
    badgesContainer.innerHTML =
      "<p>No badges earned yet. Keep taking quizzes!</p>";
    return;
  }

  for (const badgeId of badgeIds) {
    const badgeRef = doc(db, "badges", badgeId); // NOTE: Here we use the badgeId as the document ID.
    // If you auto-generated IDs, you'd need to query by the 'id' field instead.
    const badgeSnap = await getDoc(badgeRef);

    if (badgeSnap.exists()) {
      const badgeData = badgeSnap.data();
      const badgeElement = `
                <div class="badge" title="${badgeData.description}">
                    <img src="${badgeData.imageUrl}" alt="${badgeData.name}">
                    <span>${badgeData.name}</span>
                </div>
            `;
      badgesContainer.innerHTML += badgeElement;
    }
  }
}
