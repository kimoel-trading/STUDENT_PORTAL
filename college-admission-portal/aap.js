// =====================================================
// aap.js — patched: save progress + clear highlights fixes
// =====================================================

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
// SAFE PAGE NAME HANDLING
// =====================================================
let rawPage = window.location.pathname.split("/").pop().toLowerCase();
rawPage = rawPage.split("?")[0].split("#")[0];
let currentPage = rawPage === "" ? "index.html" : rawPage;

// Page map (index -> filename)
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

let currentStep = pageMap.indexOf(currentPage);
if (currentStep < 0) currentStep = 0;

// =====================================================
// UTIL: storage key (single source of truth)
// =====================================================
const STORAGE_KEY = "maxUnlockedStep";

// Load saved progress (max unlocked step)
let maxUnlockedStep = parseInt(localStorage.getItem(STORAGE_KEY));
if (isNaN(maxUnlockedStep)) maxUnlockedStep = 0;

// If user reached a new page (arrived at a later step), update storage
if (currentStep > maxUnlockedStep) {
  maxUnlockedStep = currentStep;
  localStorage.setItem(STORAGE_KEY, String(maxUnlockedStep));
}

// =====================================================
// EXTRA FIELD TOGGLING (transferred / bsu)
// =====================================================
const tYes = document.getElementById('transferred-yes');
const tNo = document.getElementById('transferred-no');
const bYes = document.getElementById('bsu-yes');
const bNo = document.getElementById('bsu-no');

if (tYes) tYes.addEventListener('change', () => {
  const tf = document.getElementById('transfer-fields');
  if (tf) tf.classList.remove('hidden');
});
if (tNo) tNo.addEventListener('change', () => {
  const tf = document.getElementById('transfer-fields');
  if (tf) tf.classList.add('hidden');
  const f = document.getElementById('transferredFrom');
  const y = document.getElementById('transferredYear');
  if (f) f.value = '';
  if (y) y.value = '';
});
if (bYes) bYes.addEventListener('change', () => {
  const bf = document.getElementById('bsu-field');
  if (bf) bf.classList.remove('hidden');
});
if (bNo) bNo.addEventListener('change', () => {
  const bf = document.getElementById('bsu-field');
  if (bf) bf.classList.add('hidden');
});

// =====================================================
// SHOW NOTIFICATION
// =====================================================
function showNotification(message) {
  const notif = document.getElementById('error-notif');
  if (!notif) return;
  notif.textContent = message;
  notif.style.display = 'block';
  setTimeout(() => { notif.style.opacity = 1; }, 30);

  setTimeout(() => {
    notif.style.opacity = 0;
    setTimeout(() => { notif.style.display = 'none'; }, 600);
  }, 5000);
}

// =====================================================
// FORM AUTO-SAVE + RESTORE (including radios & checkboxes)
// =====================================================

// Save function for individual fields
function saveField(field) {
  if (!field || !field.name) return;
  const key = "field_" + field.name;

  if (field.type === "checkbox") {
    localStorage.setItem(key, field.checked ? "true" : "false");
  } else if (field.type === "radio") {
    // save by radio group name: store selected value (if checked)
    if (field.checked) localStorage.setItem(key, field.value);
  } else {
    localStorage.setItem(key, field.value);
  }
}

// Restore all fields on load
function restoreFields() {
  document.querySelectorAll("input, select, textarea").forEach(field => {
    const key = "field_" + (field.name || "");
    const saved = localStorage.getItem(key);

    if (field.type === "radio") {
      if (saved !== null && field.value === saved) {
        field.checked = true;
      }
    } else if (field.type === "checkbox") {
      if (saved !== null) field.checked = saved === "true";
    } else {
      if (saved !== null) field.value = saved;
    }
  });

  // Also restore visibility of toggled areas based on saved values
  // transferred
  const transferredSaved = localStorage.getItem("field_transferred");
  if (transferredSaved === "yes") {
    const tf = document.getElementById('transfer-fields');
    if (tf) tf.classList.remove('hidden');
  } else {
    const tf = document.getElementById('transfer-fields');
    if (tf) tf.classList.add('hidden');
  }

  // bsu
  const bsuSaved = localStorage.getItem("field_bsuGraduate");
  if (bsuSaved === "yes") {
    const bf = document.getElementById('bsu-field');
    if (bf) bf.classList.remove('hidden');
  } else {
    const bf = document.getElementById('bsu-field');
    if (bf) bf.classList.add('hidden');
  }
}

// Attach listeners to save on change/input and clear errors
document.querySelectorAll("input, select, textarea").forEach(field => {
  // Save and clear on change (covers select, checkbox, radio)
  field.addEventListener("change", function () {
    // Special case: radio groups — store the selected value for the group
    if (this.type === "radio") {
      const key = "field_" + this.name;
      if (this.checked) localStorage.setItem(key, this.value);
    } else if (this.type === "checkbox") {
      const key = "field_" + this.name;
      localStorage.setItem(key, this.checked ? "true" : "false");
    } else {
      saveField(this);
    }

    // Also special-case some named toggles so visibility restores
    if (this.name === "transferred") {
      localStorage.setItem("field_transferred", this.value);
    }
    if (this.name === "bsuGraduate") {
      localStorage.setItem("field_bsuGraduate", this.value);
    }

    // clear highlight and notif
    this.classList.remove("error");
    const q = this.closest(".question");
    if (q) q.classList.remove("error");
    const notif = document.getElementById("error-notif");
    if (notif) notif.style.display = "none";
  });

  // Save on input for text-like fields
  field.addEventListener("input", function () {
    if (this.type !== "radio" && this.type !== "checkbox") saveField(this);
    this.classList.remove("error");
    const q = this.closest(".question");
    if (q) q.classList.remove("error");
    const notif = document.getElementById("error-notif");
    if (notif) notif.style.display = "none";
  });

  // For accessibility: also clear errors on click (useful for radios)
  field.addEventListener("click", function () {
    this.classList.remove("error");
    const q = this.closest(".question");
    if (q) q.classList.remove("error");
    const notif = document.getElementById("error-notif");
    if (notif) notif.style.display = "none";
  });
});

// Restore on startup
restoreFields();

// =====================================================
// STEP NAVIGATION (clickable unlocked steps + save)
// =====================================================

const steps = document.querySelectorAll(".step");

// Update UI function
function updateStepsUI() {
  steps.forEach((stepEl, idx) => {
    stepEl.classList.toggle("active", idx === currentStep);
    stepEl.classList.toggle("unlocked", idx <= maxUnlockedStep);

    // ensure pointer and cursor
    stepEl.style.pointerEvents = (idx <= maxUnlockedStep) ? "auto" : "none";
    stepEl.style.cursor = (idx <= maxUnlockedStep) ? "pointer" : "default";
  });
}

// Make steps interactive
steps.forEach((stepEl, idx) => {
  if (idx <= maxUnlockedStep) {
    // attach handler — using delegation here ensures duplicates aren't attached on reload,
    // but we guard by removing previous handlers in case script is re-run
    stepEl.addEventListener('click', (ev) => {
      // Save progress: if user clicked ahead of current max, expand unlocked range
      if (idx > maxUnlockedStep) {
        maxUnlockedStep = idx;
        localStorage.setItem(STORAGE_KEY, String(maxUnlockedStep));
      }

      // Save the chosen step as current progress as well (so toggling persists)
      localStorage.setItem("lastVisitedStep", String(idx));

      // navigate to corresponding page
      const target = pageMap[idx] || pageMap[0];
      // small delay to ensure storage writes happen
      setTimeout(() => {
        window.location.href = target;
      }, 50);
    });
  }
});

// ensure UI reflects current values
updateStepsUI();

// =====================================================
// NEXT BUTTON HANDLER (AAP page)
// =====================================================
function handleNext() {
  const aapField = document.getElementById('aapField');
  const AFProg = document.querySelector('input[name="aap"]:checked');
  let error = false;

  if (!AFProg) {
    if (aapField) aapField.classList.add("error");
    error = true;
  } else {
    if (aapField) aapField.classList.remove("error");
    // save radio choice
    const key = "field_aap";
    localStorage.setItem(key, AFProg.value);
  }

  if (error) {
    showNotification("Please complete all required fields before proceeding.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Unlock next step and save progress
  const next = Math.max(maxUnlockedStep, currentStep + 1);
  maxUnlockedStep = next;
  localStorage.setItem(STORAGE_KEY, String(maxUnlockedStep));

  // Also store last visited/current step
  localStorage.setItem("lastVisitedStep", String(currentStep + 1));

  // Submit the form to backend to save AAP selection; backend redirects to next page
  const form = document.getElementById("aapForm");
  if (form) {
    form.submit();
  } else {
    // Fallback: if form not found, just go to next page
    window.location.href = "personal.html";
  }
}

// Expose handleNext to global scope so onclick HTML can call it
window.handleNext = handleNext;

// =====================================================
// OPTIONAL: helper to clear all stored fields (for debugging)
// =====================================================
// function clearSavedFields() {
//   Object.keys(localStorage).forEach(k => {
//     if (k.startsWith("field_") || k === STORAGE_KEY || k === "lastVisitedStep") {
//       localStorage.removeItem(k);
//     }
//   });
// }
// window.clearSavedFields = clearSavedFields;
