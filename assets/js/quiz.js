import { auth, db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// DOM Elements
const quizContainer = document.getElementById("quiz-container");
const resultsContainer = document.getElementById("results-container");
const loadingScreen = document.getElementById("loading-screen");
const quizTitle = document.getElementById("quiz-title");
const timerDisplay = document.querySelector("#timer span");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const loreContainer = document.getElementById("lore-container");
const loreText = document.getElementById("lore-text");
const nextQuestionBtn = document.getElementById("next-question-btn");

// Quiz State
let currentQuizData = {};
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 0;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");

  if (quizId) {
    await loadQuiz(quizId);
  } else {
    quizContainer.innerHTML =
      "<h1>Quiz not found!</h1><p>Please select a quiz from the main page.</p>";
  }
});

async function loadQuiz(id) {
  try {
    const response = await fetch(`./quizzes/harry-potter/${id}.json`);
    if (!response.ok) throw new Error("Quiz file not found");
    currentQuizData = await response.json();

    startQuiz();
  } catch (error) {
    console.error("Could not load quiz:", error);
    loadingScreen.innerHTML = `<p>Error: Could not load the quiz. Please try again later.</p>`;
  }
}

// --- QUIZ LOGIC ---
function startQuiz() {
  loadingScreen.classList.add("hidden");
  quizContainer.classList.remove("hidden");

  quizTitle.textContent = currentQuizData.title;
  timeLeft = currentQuizData.timeLimit;
  currentQuestionIndex = 0;
  score = 0;

  shuffleArray(currentQuizData.questions);

  startTimer();
  displayQuestion();
}

function startTimer() {
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

function displayQuestion() {
  loreContainer.classList.add("hidden");
  optionsContainer.innerHTML = "";
  // Re-enable the next question button if it was disabled
  nextQuestionBtn.disabled = false;

  const question = currentQuizData.questions[currentQuestionIndex];
  questionText.textContent = question.question;

  const correctAnswerText = question.options[question.answer];
  const shuffledOptions = [...question.options]; // Create a copy to shuffle
  shuffleArray(shuffledOptions);

  shuffledOptions.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("option-btn");

    // Mark the correct answer with a data attribute
    if (option === correctAnswerText) {
      button.dataset.correct = "true";
    }

    button.addEventListener("click", handleAnswer);
    optionsContainer.appendChild(button);
  });
}

function handleAnswer(event) {
  const selectedButton = event.target;
  // Disable all option buttons
  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => (btn.disabled = true));
  // Disable the next question button until lore is read
  nextQuestionBtn.disabled = true;

  if (selectedButton.dataset.correct === "true") {
    score++;
    selectedButton.classList.add("correct");
  } else {
    selectedButton.classList.add("wrong");
    // Find and highlight the correct button
    const correctButton = optionsContainer.querySelector(
      '[data-correct="true"]'
    );
    if (correctButton) {
      correctButton.classList.add("correct");
    }
  }

  const question = currentQuizData.questions[currentQuestionIndex];
  if (question.lore) {
    loreText.textContent = question.lore;
    loreContainer.classList.remove("hidden");
  }

  // Set a small delay before the "Next" button is clickable, allows user to see feedback
  setTimeout(() => {
    nextQuestionBtn.disabled = false;
  }, 1000); // 1 second delay

  nextQuestionBtn.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.questions.length) {
      displayQuestion();
    } else {
      endQuiz();
    }
  };
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

async function endQuiz() {
  clearInterval(timer);
  quizContainer.classList.add("hidden");
  resultsContainer.classList.remove("hidden");

  const quizId = new URLSearchParams(window.location.search).get("id");
  document.getElementById("results-container").innerHTML = `
    <h2>Quiz Complete!</h2>
    <p>Your Score: <span id="final-score">${score} / ${totalQuestions}</span></p>
    <p>XP Earned: <span id="xp-earned">${xpEarned}</span></p>
    <div class="results-actions">
        <a href="quiz.html?id=${quizId}" class="cta-button">Try Again</a>
        <a href="leaderboard.html?id=${quizId}" class="cta-button">View Leaderboard</a>
        <a href="index.html" class="cta-button">Choose Another Quiz</a>
    </div>
`;

  const totalQuestions = currentQuizData.questions.length;
  const xpEarned = score * 10;

  document.getElementById(
    "final-score"
  ).textContent = `${score} / ${totalQuestions}`;
  document.getElementById("xp-earned").textContent = xpEarned;

  const user = auth.currentUser;
  if (user) {
    const quizId = new URLSearchParams(window.location.search).get("id");
    const userRef = doc(db, "users", user.uid);

    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Check if the user has ALREADY played this quiz.
    if (!userData.quizHistory || !userData.quizHistory[quizId]) {
      console.log(
        "First time playing this quiz. Awarding XP and posting to leaderboard."
      );

      // This is their first time, so update XP and leaderboard
      await updateDoc(userRef, {
        xp: increment(xpEarned),
      });

      // Add/Update score on the leaderboard
      const leaderboardRef = doc(
        db,
        "leaderboards",
        quizId,
        "scores",
        user.uid
      );
      await setDoc(leaderboardRef, {
        score: score,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
        timestamp: new Date(),
      });

      // Check for badges
      await checkAndAwardBadges(userRef, quizId, score, totalQuestions);
    } else {
      console.log("Quiz already played. No XP or leaderboard update.");
      // Optionally, tell the user why they didn't get XP
      document.getElementById(
        "xp-earned"
      ).textContent = `${xpEarned} (XP only awarded on first completion)`;
    }

    // Always update the history, regardless of whether it's the first time
    await updateDoc(userRef, {
      [`quizHistory.${quizId}`]: {
        score: score,
        total: totalQuestions,
        date: new Date(),
      },
    });
  }
}
async function checkAndAwardBadges(userRef, quizId, score, totalQuestions) {
  if (quizId === "potions-owl" && score === totalQuestions) {
    await updateDoc(userRef, {
      badges: arrayUnion("potions-perfect"),
    });
    // Let's add a fun notification!
    alert(
      "✨ New Badge Unlocked: Potions Perfect Score! ✨\nCheck your profile to see it."
    );
  }
}
