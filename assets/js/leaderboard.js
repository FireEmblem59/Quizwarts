// In assets/js/leaderboard.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getQuizTitlesMap } from "./quiz-service.js";

// --- Global DOM Elements ---
const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardTitle = document.getElementById("leaderboard-title");
let availableQuizzes = {}; // This will be populated dynamically

// --- Functions ---

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

/**
 * Fetches and displays the top 10 scores for a given quiz.
 * @param {string} quizId The ID of the quiz to fetch the leaderboard for.
 */
async function fetchAndDisplayLeaderboard(quizId) {
  leaderboardTitle.textContent = `Leaderboard: ${
    availableQuizzes[quizId] || "Select a Quiz"
  }`;
  leaderboardBody.innerHTML =
    '<tr><td colspan="3">Loading rankings...</td></tr>';

  try {
    const scoresQuery = query(
      collection(db, "leaderboards", quizId, "scores"),
      orderBy("score", "desc"), // First, order by highest score
      orderBy("timeTaken", "asc"), // Then, order by lowest (fastest) time
      limit(10)
    );
    const querySnapshot = await getDocs(scoresQuery);
    leaderboardBody.innerHTML = ""; // Clear loading message

    if (querySnapshot.empty) {
      leaderboardBody.innerHTML =
        '<tr><td colspan="3">No scores yet. Be the first!</td></tr>';
      return;
    }

    let rank = 1;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = `
        <tr>
            <td>${rank++}</td>
            <td class="player-cell">
                <img src="${
                  data.photoURL || "assets/images/default-avatar.png"
                }" alt="avatar" class="avatar-small">
                <span>${data.displayName}</span>
            </td>
            <td>${data.score}</td>
            <td class="time-cell">${data.timeTaken || "-"}s</td>
        </tr>
      `;
      leaderboardBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching leaderboard: ", error);
    leaderboardBody.innerHTML =
      '<tr><td colspan="3">Could not load rankings.</td></tr>';
  }
}

/**
 * Main initialization function that runs on page load.
 */
async function initializePage() {
  // 1. Fetch the list of all quizzes automatically
  availableQuizzes = await getQuizTitlesMap();

  // 2. Determine which quiz to show
  const urlParams = new URLSearchParams(window.location.search);
  let currentQuizId = urlParams.get("id");

  // Default to the first quiz in the list if the ID is invalid or not provided
  const quizIds = Object.keys(availableQuizzes);
  if (!currentQuizId || !quizIds.includes(currentQuizId)) {
    currentQuizId = quizIds[0] || null;
  }

  // 3. Build the UI
  createQuizSelector(currentQuizId);
  if (currentQuizId) {
    fetchAndDisplayLeaderboard(currentQuizId);
  } else {
    leaderboardTitle.textContent = "No Quizzes Available";
    leaderboardBody.innerHTML =
      '<tr><td colspan="3">Add quizzes to the manifest to see leaderboards.</td></tr>';
  }
}

// --- Run the app ---
initializePage();
