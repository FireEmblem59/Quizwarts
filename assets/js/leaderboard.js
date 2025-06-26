// In assets/js/leaderboard.js

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  startAfter,
  documentId,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { getQuizTitlesMap } from "./quiz-service.js";

// --- Global DOM Elements ---
const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardTitle = document.getElementById("leaderboard-title");
const userRankContainer = document.getElementById("user-rank-container");
const userRankTable = document.getElementById("user-rank-table");
let availableQuizzes = {};
let currentUser = null;

// --- Listen for Auth State Changes ---
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  // Re-initialize page to show/hide user rank if login state changes
  initializePage();
});

// --- Functions ---

/**
 * Formats seconds into a MM:SS or HH:MM:SS string.
 * @param {number} seconds The total number of seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) {
    return "--:--"; // Return a placeholder for invalid data
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60); // Use Math.floor to handle potential decimals

  const padded = (num) => String(num).padStart(2, "0");

  if (hrs > 0) {
    return `${padded(hrs)}:${padded(mins)}:${padded(secs)}`;
  } else {
    return `${padded(mins)}:${padded(secs)}`;
  }
}

/**
 * Creates the dropdown menu for selecting a leaderboard.
 * @param {string} currentQuizId The ID of the currently selected quiz.
 */
function createQuizSelector(currentQuizId) {
  let selectorHtml = `<label for="quiz-select">Select Leaderboard: </label>
    <select id="quiz-select">`;
  for (const [id, title] of Object.entries(availableQuizzes)) {
    const selected = id === currentQuizId ? "selected" : "";
    selectorHtml += `<option value="${id}" ${selected}>${title}</option>`;
  }
  selectorHtml += `</select>`;

  // Clear any old selector before adding a new one
  const oldSelector = document.getElementById("quiz-select-container");
  if (oldSelector) oldSelector.remove();

  const selectorContainer = document.createElement("div");
  selectorContainer.id = "quiz-select-container";
  selectorContainer.innerHTML = selectorHtml;
  leaderboardTitle.insertAdjacentElement("afterend", selectorContainer);

  document.getElementById("quiz-select").addEventListener("change", (e) => {
    // Change the URL which will trigger a page reload and fetch the new leaderboard
    window.location.search = `?id=${e.target.value}`;
  });
}

async function fetchUserRank(quizId, user) {
  if (!user) {
    userRankContainer.classList.add("hidden");
    return;
  }

  const scoresRef = collection(db, "leaderboards", quizId, "scores");

  // First, get the user's own score document to know what score to look for.
  const userScoreDoc = await getDoc(doc(scoresRef, user.uid));
  if (!userScoreDoc.exists()) {
    userRankContainer.classList.add("hidden"); // User hasn't played this quiz
    return;
  }

  const userScoreData = userScoreDoc.data();
  const userScore = userScoreData.score;
  const userTime = userScoreData.timeTaken;

  // Now, create a query to count how many players have a better score.
  const betterScoresQuery = query(scoresRef, where("score", ">", userScore));

  // Create another query to count players with the SAME score but a FASTER time.
  const sameScoreBetterTimeQuery = query(
    scoresRef,
    where("score", "==", userScore),
    where("timeTaken", "<", userTime)
  );

  const betterScoresSnapshot = await getDocs(betterScoresQuery);
  const sameScoreBetterTimeSnapshot = await getDocs(sameScoreBetterTimeQuery);

  // The user's rank is 1 + the number of people better than them.
  const rank = 1 + betterScoresSnapshot.size + sameScoreBetterTimeSnapshot.size;

  // Display the rank
  userRankContainer.classList.remove("hidden");
  userRankTable.innerHTML = `
      <tbody>
          <tr>
              <td>${rank}</td>
              <td class="player-cell">
                  <img src="${
                    user.photoURL || "assets/images/default-avatar.png"
                  }" alt="avatar" class="avatar-small">
                  <span>${user.displayName} (You)</span>
              </td>
              <td>${userScore}</td>
              <td class="time-cell">${formatTime(userTime)}</td>
          </tr>
      </tbody>
  `;
}

/**
 * Fetches and displays the top 10 scores for a given quiz.
 * @param {string} quizId The ID of the quiz to fetch the leaderboard for.
 */
async function fetchAndDisplayLeaderboard(quizId) {
  leaderboardTitle.textContent = `Leaderboard: ${
    availableQuizzes[quizId] || "Select a Quiz"
  }`;
  leaderboardBody.innerHTML =
    '<tr><td colspan="4">Loading rankings...</td></tr>';
  userRankContainer.classList.add("hidden"); // Hide user rank initially

  try {
    const scoresQuery = query(
      collection(db, "leaderboards", quizId, "scores"),
      orderBy("score", "desc"),
      orderBy("timeTaken", "asc"),
      limit(10)
    );
    const querySnapshot = await getDocs(scoresQuery);
    leaderboardBody.innerHTML = "";

    let isUserInTop10 = false;
    if (querySnapshot.empty) {
      leaderboardBody.innerHTML =
        '<tr><td colspan="4">No scores yet. Be the first!</td></tr>';
    } else {
      let rank = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (currentUser && data.uid === currentUser.uid) {
          isUserInTop10 = true;
        }
        leaderboardBody.innerHTML += `
            <tr>
                <td>${rank++}</td>
                <td class="player-cell">
                    <img src="${
                      data.photoURL || "assets/images/default-avatar.png"
                    }" alt="avatar" class="avatar-small">
                    <span>${data.displayName}</span>
                </td>
                <td>${data.score}</td>
                <td class="time-cell">${formatTime(data.timeTaken)}</td>
            </tr>
          `;
      });
    }

    // If user is logged in AND not in the top 10, fetch their specific rank.
    if (currentUser && !isUserInTop10) {
      await fetchUserRank(quizId, currentUser);
    }
  } catch (error) {
    console.error("Error fetching leaderboard: ", error);
    leaderboardBody.innerHTML =
      '<tr><td colspan="4">Could not load rankings.</td></tr>';
  }
}

/**
 * Main initialization function that runs on page load.
 */
async function initializePage() {
  availableQuizzes = await getQuizTitlesMap();
  const urlParams = new URLSearchParams(window.location.search);
  let currentQuizId = urlParams.get("id");
  const quizIds = Object.keys(availableQuizzes);
  if (!currentQuizId || !quizIds.includes(currentQuizId)) {
    currentQuizId = quizIds[0] || null;
  }
  createQuizSelector(currentQuizId);
  if (currentQuizId) {
    fetchAndDisplayLeaderboard(currentQuizId);
  } else {
    leaderboardTitle.textContent = "No Quizzes Available";
    leaderboardBody.innerHTML =
      '<tr><td colspan="4">Add quizzes to the manifest to see leaderboards.</td></tr>';
  }
}

// --- Run the app ---
initializePage();
