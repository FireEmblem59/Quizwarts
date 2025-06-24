// In assets/js/notifications.js

export function showNotification(title, message, type = "default") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", type); // e.g., 'toast', 'success'

  // Choose an icon based on type
  let icon = "✨"; // Default icon
  if (type === "success") icon = "🏆";
  if (type === "error") icon = "❌";

  toast.innerHTML = `
      <div class="icon">${icon}</div>
      <div class="text-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;

  container.appendChild(toast);

  // Automatically remove the toast from the DOM after the animation finishes
  setTimeout(() => {
    toast.remove();
  }, 5000); // 5000ms = 5 seconds
}
