import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardTitle = document.getElementById("leaderboard-title");

// A predefined list of quizzes for a dropdown selector
const availableQuizzes = {
  "potions-owl": "Potions O.W.L.",
  "jedi-trials": "Jedi Trials", // Add more as you create them
  "sorting-hat": "Sorting Hat",
};

function createQuizSelector(currentQuizId) {
  let selectorHtml = `<label for="quiz-select">Select Leaderboard: </label>
    <select id="quiz-select">`;
  for (const [id, title] of Object.entries(availableQuizzes)) {
    const selected = id === currentQuizId ? "selected" : "";
    selectorHtml += `<option value="${id}" ${selected}>${title}</option>`;
  }
  selectorHtml += `</select>`;
  leaderboardTitle.insertAdjacentHTML("afterend", selectorHtml);

  document.getElementById("quiz-select").addEventListener("change", (e) => {
    // Change the URL without reloading the page to load the new leaderboard
    window.location.search = `?id=${e.target.value}`;
  });
}

async function fetchAndDisplayLeaderboard(quizId) {
  leaderboardTitle.textContent = `Leaderboard: ${
    availableQuizzes[quizId] || "Unknown"
  }`;
  leaderboardBody.innerHTML =
    '<tr><td colspan="3">Loading rankings...</td></tr>';

  try {
    const scoresQuery = query(
      collection(db, "leaderboards", quizId, "scores"),
      orderBy("score", "desc"),
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
                          data.photoURL || "https://via.placeholder.com/40"
                        }" alt="avatar" class="avatar-small">
                        <span>${data.displayName}</span>
                    </td>
                    <td>${data.score}</td>
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

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  let quizId = urlParams.get("id");

  if (!quizId || !availableQuizzes[quizId]) {
    quizId = "potions-owl"; // Default to potions-owl if no/invalid ID is provided
  }

  createQuizSelector(quizId);
  fetchAndDisplayLeaderboard(quizId);
});
