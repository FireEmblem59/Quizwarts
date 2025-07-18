import { auth, db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { showNotification } from "./notifications.js";

import { playSound } from "./audio.js";

import { getAllQuizzes } from "./quiz-service.js";

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
const quizProgress = document.getElementById("quiz-progress");

// Quiz State
let currentQuizData = {};
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 0;
let finalResults = null;

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
  if (finalResults && !resultsContainer.classList.contains("hidden")) {
    renderResultsPage(user);
  }
});

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
    const quizzes = await getAllQuizzes();
    const quizInfo = quizzes.find((q) => q.id === id);

    if (!quizInfo) throw new Error("Quiz not found in manifest");

    // Use the filePath from the manifest
    const response = await fetch(`quizzes/${quizInfo.filePath}`);
    if (!response.ok) throw new Error("Quiz file not found at path");
    currentQuizData = await response.json();
    startQuiz();
  } catch (error) {
    console.error("Could not load quiz:", error);
  }
}

// --- QUIZ LOGIC ---
function startQuiz() {
  const quizId = new URLSearchParams(window.location.search).get("id");

  if (quizId && auth.currentUser) {
    const statRef = doc(db, "quiz_stats", quizId);
    setDoc(statRef, { playCount: increment(1) }, { merge: true }).catch(
      (error) => console.error("Could not update play count:", error)
    ); // Add a catch for safety
  }

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

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const padded = (num) => String(num).padStart(2, "0");

  if (hrs > 0) {
    return `${padded(hrs)}:${padded(mins)}:${padded(secs)}`;
  } else {
    return `${padded(mins)}:${padded(secs)}`;
  }
}

function startTimer() {
  timerDisplay.textContent = formatTime(timeLeft);
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

function displayQuestion() {
  quizProgress.textContent = `${currentQuestionIndex + 1} / ${
    currentQuizData.questions.length
  }`;

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
    playSound("assets/audio/correct.mp3");
    score++;
    selectedButton.classList.add("correct");
  } else {
    playSound("assets/audio/wrong.mp3");
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

function renderResultsPage(user) {
  if (!finalResults) return; // Should not happen, but a good safety check

  const { quizId, score, totalQuestions, timeTaken, xpEarned } = finalResults;

  if (user) {
    // --- RENDER LOGGED-IN VIEW ---
    resultsContainer.innerHTML = `
            <h2>Quiz Complete!</h2>
            <p>Your Score: <span id="final-score">${score} / ${totalQuestions}</span></p>
            <p>Time Taken: <span>${timeTaken} seconds</span></p>
            <p>XP Earned: <span id="xp-earned">${xpEarned}</span></p>
            <div class="results-actions">
                <a href="quiz.html?id=${quizId}" class="cta-button">Try Again</a>
                <a href="leaderboard.html?id=${quizId}" class="cta-button" id="leaderboard-result-btn">View Leaderboard</a>
                <a href="index.html" class="cta-button">Choose Another Quiz</a>
            </div>
        `;
  } else {
    // --- RENDER GUEST VIEW ---
    resultsContainer.innerHTML = `
            <h2>Quiz Complete!</h2>
            <p>Your Score: <span id="final-score">${score} / ${totalQuestions}</span></p>
            <p>Time Taken: <span>${timeTaken} seconds</span></p>
            <div class="save-score-prompt">
                <p>Your score won't be saved to the leaderboards or your profile.</p>
                <button id="login-to-save-btn" class="cta-button">Login to Save Your Score</button>
            </div>
            <div class="results-actions">
                <a href="quiz.html?id=${quizId}" class="cta-button">Try Again</a>
                <a href="index.html" class="cta-button">Choose Another Quiz</a>
            </div>
        `;
    // Add click listener for the guest button
    document
      .getElementById("login-to-save-btn")
      .addEventListener("click", () => {
        sessionStorage.setItem(
          "pendingQuizResult",
          JSON.stringify(finalResults)
        );
        window.dispatchEvent(new Event("requestLogin"));
      });
  }
}

async function endQuiz() {
  clearInterval(timer);

  finalResults = {
    quizId: new URLSearchParams(window.location.search).get("id"),
    score: score,
    totalQuestions: currentQuizData.questions.length,
    timeTaken: currentQuizData.timeLimit - timeLeft,
    xpEarned: score * 10,
  };

  // Hide quiz, show results container
  quizContainer.classList.add("hidden");
  resultsContainer.classList.remove("hidden");

  // Initial render of the results page based on current login state
  renderResultsPage(auth.currentUser);

  // If the user is logged in, proceed to save their score immediately
  if (auth.currentUser) {
    await saveScoreForUser(auth.currentUser, finalResults);
  }
}

async function saveScoreForUser(user, results) {
  console.log("User is logged in. Saving score...");

  const { quizId, score, totalQuestions, timeTaken, xpEarned } = results;

  // Show spinner on leaderboard button
  const leaderboardButton = document.getElementById("leaderboard-result-btn");
  if (leaderboardButton) {
    leaderboardButton.innerHTML =
      '<span class="button-spinner"></span> Saving...';
    leaderboardButton.style.pointerEvents = "none";
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    console.error("Could not find user document to save score.");
    return; // Exit if user doc isn't ready for some reason
  }
  const userData = userDoc.data();

  // XP Logic
  if (!userData.quizHistory || !userData.quizHistory[quizId]) {
    const oldLevel = Math.floor(userData.xp / 100) + 1;
    const newLevel = Math.floor((userData.xp + xpEarned) / 100) + 1;
    if (newLevel > oldLevel) {
      localStorage.setItem("levelUp", "true");
    }
    await updateDoc(userRef, { xp: increment(xpEarned) });
  } else {
    const xpElement = document.getElementById("xp-earned");
    if (xpElement) {
      xpElement.innerHTML = `${xpEarned} (XP only awarded on first completion)`;
    }
  }

  // Leaderboard Logic
  const leaderboardRef = doc(db, "leaderboards", quizId, "scores", user.uid);
  const leaderboardSnap = await getDoc(leaderboardRef);
  let shouldUpdateLeaderboard = true;
  if (leaderboardSnap.exists()) {
    const existingScoreData = leaderboardSnap.data();
    if (
      existingScoreData.score > score ||
      (existingScoreData.score === score &&
        existingScoreData.timeTaken < timeTaken)
    ) {
      shouldUpdateLeaderboard = false;
    }
  }
  if (shouldUpdateLeaderboard) {
    await setDoc(leaderboardRef, {
      score,
      timeTaken,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
      timestamp: new Date(),
    });
  }

  // Badges and History
  await checkAndAwardBadges(userRef, userData, quizId, score, totalQuestions);
  await updateDoc(userRef, {
    [`quizHistory.${quizId}`]: {
      score,
      total: totalQuestions,
      timeTaken,
      date: new Date(),
    },
  });

  // Restore button
  if (leaderboardButton) {
    leaderboardButton.textContent = "View Leaderboard";
    leaderboardButton.style.pointerEvents = "auto";
  }
}

async function checkAndAwardBadges(
  userRef,
  userData,
  quizId,
  score,
  totalQuestions
) {
  // --- Badge 1: Perfect Score ---
  if (quizId === "potions-owl" && score === totalQuestions) {
    await updateDoc(userRef, {
      badges: arrayUnion("potions-perfect"),
    });
    showNotification("Badge Unlocked!", "Potions Perfect Score", "success");
  }

  // --- Badge 2: First Quiz Completed ---
  // Check if the user has a 'badges' array and if it already includes our badge
  const hasFirstQuizBadge =
    userData.badges && userData.badges.includes("first-quiz-completed");

  // If the history is empty AND they don't have the badge yet, award it.
  if (
    (!userData.quizHistory || Object.keys(userData.quizHistory).length === 0) &&
    !hasFirstQuizBadge
  ) {
    await updateDoc(userRef, {
      badges: arrayUnion("first-quiz-completed"),
    });
    setTimeout(() => {
      showNotification(
        "Badge Unlocked!",
        "First Steps: You completed your first quiz!",
        "success"
      );
    }, 300);
  }
}
