// In assets/js/homepage.js
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAllQuizzes } from "./quiz-service.js";

async function displayFeaturedQuizzes() {
  const quizGrid = document.querySelector(".quiz-selection .quiz-grid");
  if (!quizGrid) return;

  quizGrid.innerHTML = "<p>Loading featured challenges...</p>";

  try {
    // 1. Get the list of all possible quizzes from our manifest
    const allQuizzes = await getAllQuizzes();
    const quizzesById = {};
    allQuizzes.forEach((q) => {
      quizzesById[q.id] = q;
    });

    // 2. Query Firestore for the top 3 most played quizzes
    const statsQuery = query(
      collection(db, "quiz_stats"),
      orderBy("playCount", "desc"),
      limit(3) // Feature the top 3
    );
    const statsSnapshot = await getDocs(statsQuery);

    // 3. Combine the data and render the cards
    const featuredQuizzes = [];
    statsSnapshot.forEach((doc) => {
      const quizId = doc.id;
      if (quizzesById[quizId]) {
        featuredQuizzes.push(quizzesById[quizId]);
      }
    });

    // If there are no stats yet, fall back to showing the first few quizzes
    if (featuredQuizzes.length === 0) {
      featuredQuizzes.push(...allQuizzes.slice(0, 2));
    }

    // 4. Render the final list
    renderQuizCards(quizGrid, featuredQuizzes);
  } catch (error) {
    console.error("Could not load featured quizzes:", error);
    quizGrid.innerHTML =
      "<p>Could not load challenges. Please try again later.</p>";
  }
}

function renderQuizCards(container, quizList) {
  container.innerHTML = "";
  quizList.forEach((quiz) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `
            <h3>${quiz.title}</h3>
            <p>${quiz.description}</p>
            <a href="quiz.html?id=${quiz.id}" class="cta-button">Begin</a>
        `;
    container.appendChild(card);
  });
}

// Run the function on page load
displayFeaturedQuizzes();
