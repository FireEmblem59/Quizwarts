// In assets/js/audio.js

/**
 * Plays a sound effect if audio is enabled in the user's settings.
 * @param {string} src The path to the audio file.
 */
export function playSound(src) {
  // Check localStorage. If the item is 'false', we don't play.
  // If the item doesn't exist (null), it means the user hasn't set it, so we default to playing.
  const isAudioEnabled = localStorage.getItem("audioEnabled") !== "false";

  if (!isAudioEnabled) {
    return; // Exit the function if audio is disabled
  }

  const sound = new Audio(src);
  sound.play().catch((error) => {
    // The .play() method can sometimes be blocked by the browser.
    // This prevents console errors if that happens.
    console.warn("Audio play was prevented:", error);
  });
}
