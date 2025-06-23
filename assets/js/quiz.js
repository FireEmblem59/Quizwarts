import { auth, db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  setDoc,
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

  const question = currentQuizData.questions[currentQuestionIndex];
  questionText.textContent = question.question;

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("option-btn");
    button.dataset.index = index;
    button.addEventListener("click", handleAnswer);
    optionsContainer.appendChild(button);
  });
}

function handleAnswer(event) {
  const selectedButton = event.target;
  const selectedIndex = parseInt(selectedButton.dataset.index);
  const question = currentQuizData.questions[currentQuestionIndex];

  // Disable all buttons after one is clicked
  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => (btn.disabled = true));

  if (selectedIndex === question.answer) {
    score++;
    selectedButton.classList.add("correct");
  } else {
    selectedButton.classList.add("wrong");
    // Highlight the correct answer
    document
      .querySelector(`.option-btn[data-index='${question.answer}']`)
      .classList.add("correct");
  }

  // Show lore if it exists
  if (question.lore) {
    loreText.textContent = question.lore;
    loreContainer.classList.remove("hidden");
  }

  nextQuestionBtn.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.questions.length) {
      displayQuestion();
    } else {
      endQuiz();
    }
  };
}

async function endQuiz() {
  clearInterval(timer);
  quizContainer.classList.add("hidden");
  resultsContainer.classList.remove("hidden");

  const totalQuestions = currentQuizData.questions.length;
  const xpEarned = score * 10;

  document.getElementById(
    "final-score"
  ).textContent = `${score} / ${totalQuestions}`;
  document.getElementById("xp-earned").textContent = xpEarned;

  // ---- LEADERBOARD LOGIC ----
  const user = auth.currentUser;
  if (user) {
    const quizId = new URLSearchParams(window.location.search).get("id");

    // Update user profile (existing logic)
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      xp: increment(xpEarned),
      [`quizHistory.${quizId}`]: {
        score: score,
        total: totalQuestions,
        date: new Date(),
      },
    });

    // Add/Update score on the leaderboard
    // We use setDoc here to overwrite the user's previous best score.
    const leaderboardRef = doc(db, "leaderboards", quizId, "scores", user.uid);
    await setDoc(leaderboardRef, {
      score: score,
      displayName: user.displayName,
      photoURL: user.photoURL,
      uid: user.uid,
      timestamp: new Date(),
    });
    console.log("Score posted to leaderboard!");
    await checkAndAwardBadges(user, quizId, score, totalQuestions);
  }
}

async function checkAndAwardBadges(user, quizId, score, totalQuestions) {
  const userRef = doc(db, "users", user.uid);

  // Badge 1: Perfect Score on a specific quiz
  if (quizId === "potions-owl" && score === totalQuestions) {
    await updateDoc(userRef, {
      badges: arrayUnion("potions-perfect"), // 'potions-perfect' is the badge ID from Firestore
    });
    console.log("Awarded 'Potions Perfect Score' badge!");
    // You can add a visual pop-up here to notify the user!
  }

  // Badge 2: General achievement (e.g., first quiz taken)
  // This is just an example of another type of badge
  // const userData = (await getDoc(userRef)).data();
  // if (Object.keys(userData.quizHistory).length === 1) {
  //    await updateDoc(userRef, { badges: arrayUnion('first-quiz') });
  // }
}
