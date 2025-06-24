# The Grand Archive of Quizzes

Welcome to the Grand Archive, a magical and immersive quiz website themed around popular fantasy and sci-fi franchises. This project is built with vanilla HTML, CSS, and JavaScript, using Firebase for backend services. It is designed to be hosted for free on GitHub Pages.

This document provides all the necessary information for developers to set up, run, and contribute to the project.

## ✨ Features

- **Dynamic Quizzes:** Multiple-choice, timed trivia and personality quizzes.
- **Progression System:** Users earn XP, levels, and badges for completing quizzes.
- **User Authentication:** Secure login via Google, powered by Firebase Auth.
- **User Profiles:** Personalized pages to track progress, stats, and achievements.
- **Leaderboards:** Global rankings for each quiz.
- **Dynamic Theming:** Light mode and "Marauder's Map" night mode.
- **Automated Content:** Quizzes are managed via a central manifest, making additions easy.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend:** Firebase (Authentication, Firestore Database)
- **Hosting:** GitHub Pages
- **Icons:** FontAwesome

## 🚀 Getting Started

To run this project locally, you'll need a code editor (like VS Code) and a local development server.

### 1. Prerequisites

- A web browser (Chrome, Firefox, etc.)
- [VS Code](https://code.visualstudio.com/) with the **Live Server** extension is highly recommended for easy local hosting.

### 2. Local Setup

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/FireEmblem59/Quizwarts.git
    cd Quizwarts
    ```

2.  **Set Up Firebase:**
    This project requires its own Firebase project to function.

    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - **Enable Authentication:** In the console, go to `Build > Authentication > Sign-in method` and enable the **Google** provider.
    - **Create Firestore Database:** Go to `Build > Firestore Database` and create a database. Start in **Test Mode** for now. You will secure it later.
    - **Register a Web App:** In your Project Settings (⚙️), add a new Web App (`</>`).
    - **Get Config:** Firebase will provide a `firebaseConfig` object. Copy this object.

3.  **Configure the Project:**

    - In the project folder, navigate to `assets/js/`.
    - Open `firebase-config.js`.
    - Paste your `firebaseConfig` object into this file, replacing the placeholder.

4.  **Authorize Your Domain:**

    - To allow Google Sign-In to work locally, go back to `Firebase Console > Authentication > Settings > Authorized domains`.
    - Click **"Add domain"** and add `localhost` and `127.0.0.1`.

5.  **Run the Website:**
    - If using VS Code with Live Server, right-click on `index.html` and select **"Open with Live Server"**.
    - Your website will open in your browser, typically at `http://127.0.0.1:5500`.

## 🪄 How to Add a New Quiz (Step-by-Step)

Adding a new quiz is designed to be simple. You only need to edit/create **two files**.

### Step 1: Create the Quiz JSON File

This file contains the questions, answers, and metadata for your quiz.

1.  Navigate to the `quizzes/` directory.
2.  Choose the appropriate category subfolder (e.g., `harry-potter`, `star-wars`) or create a new one.
3.  Create a new `.json` file (e.g., `charms-newt.json`). The filename should be URL-friendly (lowercase, no spaces).
4.  Structure the JSON like this:

    ```json
    {
      "title": "Charms N.E.W.T. Exam",
      "category": "Harry Potter",
      "difficulty": "N.E.W.T.",
      "timeLimit": 240,
      "questions": [
        {
          "question": "What is the incantation for the Shield Charm?",
          "options": ["Protego", "Expelliarmus", "Stupefy", "Expecto Patronum"],
          "answer": 0,
          "lore": "The Shield Charm, 'Protego', deflects minor to moderate hexes and jinxes."
        },
        {
          "question": "Which charm would you use to summon an object?",
          "options": ["Accio", "Alohomora", "Lumos", "Wingardium Leviosa"],
          "answer": 0,
          "lore": "The Summoning Charm, 'Accio', is one of the oldest and most useful spells known to wizardkind."
        }
      ]
    }
    ```

    **Important:** The `answer` field is a zero-based index corresponding to the `options` array. `0` is the first option, `1` is the second, and so on.

### Step 2: Update the Quiz Manifest

This is the **single source of truth** for all quizzes in the app.

1.  Open the `quizzes/manifest.json` file.
2.  Add a new JSON object to the `quizzes` array for your new quiz. Make sure to add a comma after the previous entry.

    ```json
    {
      "quizzes": [
        {
          "id": "potions-owl",
          "title": "Potions O.W.L.",
          "description": "Test your knowledge of potions and their properties.",
          "category": "Harry Potter",
          "filePath": "harry-potter/potions-owl.json"
        },
        // ... other quizzes ...
        {
          "id": "charms-newt",
          "title": "Charms N.E.W.T.",
          "description": "Test your mastery of advanced charm-work.",
          "category": "Harry Potter",
          "filePath": "harry-potter/charms-newt.json"
        }
      ]
    }
    ```

    - **`id`**: Must be unique and match the filename (without `.json`). This is used in URLs.
    - **`title`**: The user-friendly name of the quiz.
    - **`description`**: A short sentence that appears on the quiz card.
    - **`category`**: The franchise or group it belongs to.
    - **`filePath`**: The relative path to the quiz's JSON file from the `quizzes/` directory.

**That's it!** Save both files. The Quiz Library, Leaderboard dropdown, and Featured Quizzes on the homepage will now automatically include your new quiz.

## 🔒 Securing Your Application

The `firebaseConfig` is meant to be public. Security is handled by **Firestore Rules**.

1.  Navigate to `Firebase Console > Firestore Database > Rules`.
2.  Ensure your rules are **not** in test mode (`allow read, write: if true;`).
3.  Use the provided `firestore.rules` in the repository as a baseline for secure access control. These rules ensure users can only edit their own data.

## 📁 Project Structure

```
/Quizwarts
├── 📄 index.html — Homepage / Main Portal
├── 📄 quiz.html — Page where quizzes are taken
├── 📄 quiz-library.html — Lists all available quizzes
├── 📄 profile.html — User profile page
├── 📄 leaderboard.html — Leaderboards page
├── 📄 settings.html — User settings page
│
├── 📁 assets — Static assets (CSS, JS, images, audio)
│ ├── 📁 css
│ ├── 📁 js — All JavaScript modules
│ ├── 📁 images — Site images and badges
│ └── 📁 audio — Sound effects
│
├── 📁 quizzes — All quiz content
│ ├── 📄 manifest.json — Master list of all quizzes
│ └── 📁 harry-potter — Category folder
│ └── 📄 potions-owl.json
│
└── 📄 README.md — Project documentation

```
