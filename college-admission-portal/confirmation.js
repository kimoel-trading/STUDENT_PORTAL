// =====================================================
// GRADE CARD DOWNLOAD ALERT
// =====================================================
const downloads = [
  'assets/grades_form_1.pdf',
  'assets/grades_form_2.pdf'
];

document.querySelectorAll('.grade-card').forEach((card, index) => {
  card.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = downloads[index];
    link.download = downloads[index].split('/').pop();
    link.click();
  });
});

// =====================================================
// EXTRA FIELD TOGGLING
// =====================================================
document.getElementById('transferred-yes').addEventListener('change', () => {
  document.getElementById('transfer-fields').classList.remove('hidden');
});

document.getElementById('transferred-no').addEventListener('change', () => {
  document.getElementById('transfer-fields').classList.add('hidden');
  document.getElementById('transferredFrom').value = '';
  document.getElementById('transferredYear').value = '';
});

document.getElementById('bsu-yes').addEventListener('change', () => {
  document.getElementById('bsu-field').classList.remove('hidden');
});

document.getElementById('bsu-no').addEventListener('change', () => {
  document.getElementById('bsu-field').classList.add('hidden');
});

// =====================================================
// CLEAR ERRORS WHEN USER TYPES
// =====================================================
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('error');
    const q = el.closest('.question');
    if (q) q.classList.remove('error');
    const notif = document.getElementById('error-notif');
    notif.style.display = 'none';
  });
});

// =====================================================
// SHOW NOTIFICATION
// =====================================================
function showNotification(message) {
  const notif = document.getElementById('error-notif');
  notif.textContent = message;
  notif.style.display = 'block';
  notif.style.opacity = 1;

  setTimeout(() => {
    notif.style.opacity = 0;
    setTimeout(() => {
      notif.style.display = 'none';
    }, 500);
  }, 4000);
}

// =====================================================
// STEP NAVIGATION — FIXED & UNIFIED
// =====================================================

// Page → Step index map
const pageMap = [
  "index.html",
  "readfirst.html",
  "confirmation.html",
  "aap.html",
  "personal.html",
  "educattach.html",
  "programs.html",
  "form.html",
  "submit.html"
];

// Detect this page
let currentPage = window.location.pathname.split("/").pop().toLowerCase();
if (!currentPage) currentPage = "index.html";

let currentStep = pageMap.indexOf(currentPage);

// Load saved progress (UNIFIED KEY)
let maxUnlockedStep = parseInt(localStorage.getItem("maxUnlockedStep")) || 0;

// If user reached a new step → unlock it
if (currentStep > maxUnlockedStep) {
  maxUnlockedStep = currentStep;
  localStorage.setItem("maxUnlockedStep", maxUnlockedStep);
}

const steps = document.querySelectorAll(".step");

// APPLY UI
steps.forEach((step, index) => {

  // highlight active
  if (index === currentStep) {
    step.classList.add("active");
  }

  // UNLOCKED steps
  if (index <= maxUnlockedStep) {
    step.classList.add("unlocked");
    step.style.cursor = "pointer";

    // avoid blocking clicks
    step.querySelectorAll("*").forEach(el => el.style.pointerEvents = "none");

    // click → navigate + save progress
    step.addEventListener("click", () => {
      localStorage.setItem("maxUnlockedStep", Math.max(maxUnlockedStep, index));
      window.location.href = pageMap[index];
    });
  }
});

// =====================================================
// HANDLE NEXT BUTTON
// =====================================================
function handleNext() {
  let error = false;

  document.querySelectorAll('.question').forEach(q => q.classList.remove('error'));
  document.querySelectorAll('input[type="text"], select').forEach(t => t.classList.remove('error'));

  const q1 = document.querySelector('input[name="academicStatus"]:checked');
  const q2 = document.querySelector('input[name="alreadyEnrolled"]:checked');
  const q3 = document.querySelector('input[name="firstTimeApplying"]:checked');

  if (!q1) { document.getElementById('q1').classList.add('error'); error = true; }
  if (!q2) { document.getElementById('q2').classList.add('error'); error = true; }
  if (!q3) { document.getElementById('q3').classList.add('error'); error = true; }

  const transferred = document.querySelector('input[name="transferred"]:checked');
  if (!transferred) {
    document.getElementById('q4').classList.add('error');
    error = true;
  } else if (transferred.value === "yes") {
    const school = document.getElementById('transferredFrom');
    const year = document.getElementById('transferredYear');
    if (!school.value.trim()) { school.classList.add('error'); error = true; }
    if (!year.value.trim()) { year.classList.add('error'); error = true; }
  }

  const bsu = document.querySelector('input[name="bsuGraduate"]:checked');
  if (!bsu) {
    document.getElementById('q5').classList.add('error');
    error = true;
  } else if (bsu.value === "yes") {
    const school = document.getElementById('bsuSchool');
    if (!school.value) { school.classList.add('error'); error = true; }
  }

  if (error) {
    showNotification("Please complete all required fields before proceeding.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Unlock next step in local storage
  localStorage.setItem("maxUnlockedStep", Math.max(maxUnlockedStep, currentStep + 1));

  // Submit the form to backend PHP to save answers
  const form = document.getElementById("confirmationForm");
  if (form) {
    form.submit();
  } else {
    // Fallback: if form not found, just go to next page
    window.location.href = "aap.html";
  }
}

// =====================================================
// AUTO-SAVE FIELD VALUES (FULLY FIXED: radio, select, text)
// =====================================================

document.querySelectorAll("input, select, textarea").forEach(field => {
  const key = "field_" + field.name;

  // SAVE
  field.addEventListener("input", () => {
    if (field.type === "radio") {
      if (field.checked) localStorage.setItem(key, field.value);
    } else {
      localStorage.setItem(key, field.value);
    }
  });

  // LOAD
  const savedValue = localStorage.getItem(key);
  if (savedValue !== null) {
    if (field.type === "radio") {
      if (field.value === savedValue) {
        field.checked = true;

        // Trigger dependencies (show/hide extra fields)
        field.dispatchEvent(new Event("change"));
      }
    } else {
      field.value = savedValue;
    }
  }
});

