(function () {
  const USER_ENDPOINT = "../backend/current_user.php";
  const ACTIVE_KEY = "activeUserId";

  async function fetchCurrentUser() {
    try {
      const response = await fetch(USER_ENDPOINT, {
        credentials: "same-origin",
        headers: { "Cache-Control": "no-cache" }
      });

      if (!response.ok) {
        // If no authenticated user (normal for new applications), use session ID
        return "temp_" + Date.now();
      }

      const data = await response.json();
      return data && data.success ? String(data.user_id) : "temp_" + Date.now();
    } catch (error) {
      console.warn("[user-session] Unable to fetch current user, using temporary ID:", error);
      return "temp_" + Date.now();
    }
  }

  function clearApplicantStorage() {
    try {
      // Only clear form data, keep other localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('form') || key.includes('step') || key.includes('progress'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn("[user-session] Unable to clear localStorage:", error);
    }
  }

  async function syncUserStorage() {
    const currentUserId = await fetchCurrentUser();
    if (!currentUserId) {
      return;
    }

    const storedUserId = localStorage.getItem(ACTIVE_KEY);
    if (storedUserId && storedUserId !== currentUserId && !storedUserId.startsWith('temp_')) {
      clearApplicantStorage();
    }

    localStorage.setItem(ACTIVE_KEY, currentUserId);
  }

  document.addEventListener("DOMContentLoaded", syncUserStorage);
})();

