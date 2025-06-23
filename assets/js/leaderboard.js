import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const leaderboardBody = document.getElementById("leaderboard-body");
  const leaderboardTitle = document.getElementById("leaderboard-title");

  // For now, hardcode the quiz leaderboard to show.
  // In the future, you can use URL params like `leaderboard.html?id=potions-owl`
  const quizId = "potions-owl";
  leaderboardTitle.textContent = `Leaderboard: ${quizId.replace("-", " ")}`;

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
                          data.photoURL
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
});
