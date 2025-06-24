// In assets/js/audio.js

/**
 * Plays a sound effect if audio is enabled in the user's settings.
 * @param {string} src The path to the audio file.
 */
// Replace your entire audio.js with this
export function playSound(src) {
  // Read the setting from the body's data attribute
  const isAudioEnabled = document.body.dataset.audio !== "false";

  if (!isAudioEnabled) {
    return;
  }

  const sound = new Audio(src);
  sound
    .play()
    .catch((error) => console.warn("Audio play was prevented:", error));
}
