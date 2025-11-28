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
        return null;
      }

      const data = await response.json();
      return data && data.success ? String(data.user_id) : null;
    } catch (error) {
      console.warn("[user-session] Unable to fetch current user:", error);
      return null;
    }
  }

  function clearApplicantStorage() {
    try {
      localStorage.clear();
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
    if (storedUserId && storedUserId !== currentUserId) {
      clearApplicantStorage();
    }

    localStorage.setItem(ACTIVE_KEY, currentUserId);
  }

  document.addEventListener("DOMContentLoaded", syncUserStorage);
})();

