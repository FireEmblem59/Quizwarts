// In assets/js/quiz-service.js

let quizManifest = null;

/**
 * Fetches the quiz manifest if it hasn't been fetched already.
 * Caches the result to avoid multiple network requests.
 * @returns {Promise<Array>} A promise that resolves to the array of quiz objects.
 */
async function getQuizManifest() {
  if (quizManifest) {
    return quizManifest;
  }

  try {
    const response = await fetch("../quizzes/manifest.json");
    if (!response.ok) {
      throw new Error("Could not load quiz manifest.");
    }
    const data = await response.json();
    quizManifest = data.quizzes;
    return quizManifest;
  } catch (error) {
    console.error(error);
    return []; // Return empty array on error
  }
}

/**
 * Gets the full list of all available quizzes.
 * @returns {Promise<Array>}
 */
export async function getAllQuizzes() {
  return await getQuizManifest();
}

/**
 * Gets a map of quiz IDs to titles, perfect for dropdowns.
 * @returns {Promise<Object>}
 */
export async function getQuizTitlesMap() {
  const quizzes = await getQuizManifest();
  const map = {};
  quizzes.forEach((quiz) => {
    map[quiz.id] = quiz.title;
  });
  return map;
}
