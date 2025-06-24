// In assets/js/settings.js
import { showNotification } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
  const audioToggle = document.getElementById("audio-toggle");
  const clearCacheBtn = document.getElementById("clear-cache-btn");

  // --- Initialize the toggle based on saved setting ---
  // We default to 'true' (audio on) if no setting is found
  const isAudioEnabled = localStorage.getItem("audioEnabled") !== "false";
  audioToggle.checked = isAudioEnabled;

  // --- Event Listener for the audio toggle ---
  audioToggle.addEventListener("change", () => {
    // Save the new setting to localStorage
    localStorage.setItem("audioEnabled", audioToggle.checked);

    // Provide feedback to the user
    if (audioToggle.checked) {
      showNotification(
        "Audio Enabled",
        "Sound effects will now play.",
        "success"
      );
    } else {
      showNotification("Audio Disabled", "Sound effects have been muted.");
    }
  });

  // --- Event Listener for the clear cache button ---
  clearCacheBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear local settings? This will re-enable audio and the dark mode preference."
      )
    ) {
      // Clear specific items instead of everything
      localStorage.removeItem("audioEnabled");
      localStorage.removeItem("theme");
      localStorage.removeItem("levelUp"); // Also clear the level up flag
      showNotification(
        "Cache Cleared",
        "Your local settings have been reset.",
        "success"
      );
      // Optionally, reload the page to reflect changes
      window.location.reload();
    }
  });
});
