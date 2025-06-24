// assets/js/quiz-library.js

import { getAllQuizzes } from "./quiz-service.js";

document.addEventListener("DOMContentLoaded", async () => {
  const quizGrid = document.getElementById("quiz-library-grid");
  const quizList = await getAllQuizzes();

  quizGrid.innerHTML = ""; // Clear any placeholders

  quizList.forEach((quiz) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `
            <h3>${quiz.title}</h3>
            <p>${quiz.description}</p>
            <a href="quiz.html?id=${quiz.id}" class="cta-button">Begin</a>
        `;
    quizGrid.appendChild(card);
  });
});
