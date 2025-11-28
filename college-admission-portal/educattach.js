// Debug: Verify script is loaded
console.log("[DEBUG] educattach.js script loaded successfully");

const downloads = [
  'assets/grades_form_1.pdf', // for the first card
  'assets/grades_form_2.pdf'  // for the second card
];

const cssEscape =
  (window.CSS && CSS.escape) ||
  function (value) {
    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  };

document.querySelectorAll('.grade-card').forEach((card, index) => {
  card.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = downloads[index];
    link.download = downloads[index].split('/').pop(); // set filename
    link.click();
  });
});

// ====== Map pages to step index ======
const pageToStep = {
  "index.html": 0,
  "readfirst.html": 1,
  "confirmation.html": 2,
  "aap.html": 3,
  "personal.html": 4,
  "educattach.html": 5,
  "programs.html": 6,
  "form.html": 7,
  "submit.html": 8,
  // add more pages if needed
};

// ====== Get current page ======
const currentPage = window.location.pathname.split("/").pop();

// ====== Load progress safely ======
let savedStep = parseInt(localStorage.getItem("currentStep"));
let currentStep = pageToStep[currentPage] !== undefined ? pageToStep[currentPage] : (savedStep || 5);
let maxUnlockedStep = parseInt(localStorage.getItem("maxUnlockedStep")) || currentStep;

document.addEventListener("DOMContentLoaded", () => {
  console.log("[DEBUG] DOMContentLoaded - Page ready");
  const steps = document.querySelectorAll(".step");

  // ====== Update step UI ======
  function updateSteps() {
    steps.forEach((step, index) => {
      // ACTIVE step (green)
      step.classList.toggle("active", index === currentStep);

      // CLICKABLE or LOCKED
      if (index <= maxUnlockedStep) {
        step.classList.add("clickable");
        step.style.pointerEvents = "auto";
        step.style.opacity = "1";
      } else {
        step.classList.remove("clickable");
        step.style.pointerEvents = "none";
        step.style.opacity = "1";
      }
    });

    // Save progress
    localStorage.setItem("currentStep", currentStep);
    localStorage.setItem("maxUnlockedStep", maxUnlockedStep);
  }

  // ====== Step click navigation ======
  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      if (index > maxUnlockedStep) return; // block locked steps

      currentStep = index;
      updateSteps();

      // Optional: show section if you have this function
      if (typeof showSection === "function") showSection(currentStep);

      // Navigate pages based on step
      switch (index) {
      case 0: window.location.href = "index.html"; break;
      case 1: window.location.href = "readfirst.html"; break;
      case 2: window.location.href = "confirmation.html"; break;
      case 3: window.location.href = "aap.html"; break;
      case 4: window.location.href = "personal.html"; break;
      case 5: window.location.href = "educattach.html"; break;
      case 6: window.location.href = "programs.html"; break;
      case 7: window.location.href = "form.html"; break;
      case 8: window.location.href = "submit.html"; break;
        // Add more steps/pages here
      }
    });
  });

  // ====== Initial render ======
  updateSteps();
});

// =====================================================
// FILE STORAGE (store file + type)
// =====================================================
let uploadedFiles = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null
};

// =====================================================
// HANDLE FILE UPLOAD
// - label param optional. If not passed, reads data-type from the input element.
// - removes red error highlights for that upload box when file is selected
// =====================================================
function handleFileUpload(num, label) {
  const input = document.getElementById(`file${num}`);
  const status = document.getElementById(`status${num}`);
  const file = input && input.files ? input.files[0] : null;

  if (file) {
    // Check file size (3MB = 3 * 1024 * 1024 bytes)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      showNotification(`File "${file.name}" is too large. Maximum file size is 3.0 MB. Please choose a smaller file.`, "error");
      input.value = ''; // Clear the input
      return;
    }

    const type = label || (input && input.dataset && input.dataset.type) || "Required";
    uploadedFiles[num] = { file, type };

    // update status text
    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
        ${escapeHtml(file.name)}
      `;
    }

    // Remove red highlight from upload box (if any)
    const uploadBox = input ? input.closest(".upload-controls") : null;
    if (uploadBox) uploadBox.classList.remove("input-error");

    // Also remove 'input-error' from any required text input inside the same upload-controls area
    if (uploadBox) {
      const requiredInside = uploadBox.querySelectorAll(".form-input.input-error");
      requiredInside.forEach(el => el.classList.remove("input-error"));
    }

    updateFileList();
  }
}

// =====================================================
// UPDATE FILE LIST TABLE
// =====================================================
function updateFileList() {
  const tableBody = document.getElementById("fileTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  let noFiles = true;

  Object.keys(uploadedFiles).forEach(key => {
    const slot = uploadedFiles[key];
    if (!slot) return;

    noFiles = false;
    const { file, type } = slot;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(key)}</td>
      <td>${escapeHtml(type)}</td>
      <td>${escapeHtml(file.name)}</td>
      <td>${(file.size / 1024).toFixed(1)} KB</td>
      <td style="text-align:center;">
        <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  if (noFiles) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">No Attached files</div>
          </div>
        </td>
      </tr>
    `;
  }
}

// small helper to avoid HTML injection in file names/types
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// =====================================================
// NOTIFICATION/ALERT SYSTEM
// - showNotification(message, status, autoHideMs)
// - status: "error"|"success"|undefined
// =====================================================
function showNotification(message) {
  let noti = document.getElementById("notification");
  let notiText;

  // If notification container does not exist, create one
  if (!noti) {
    noti = document.createElement("div");
    noti.id = "notification";

    noti.style.position = "fixed";
    noti.style.right = "20px";
    noti.style.top = "20px";
    noti.style.zIndex = "9999";
    noti.style.display = "flex";
    noti.style.alignItems = "center";
    noti.style.padding = "12px 16px";
    noti.style.borderRadius = "8px";
    noti.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
    noti.style.fontSize = "15px";
    noti.style.fontWeight = "500";

    // RED ALERT STYLE
    noti.style.background = "#ffe3e3";
    noti.style.color = "#c20000";

    notiText = document.createElement("div");
    notiText.id = "notification-text";

    noti.appendChild(notiText); // NO CLOSE BUTTON ANYMORE
    document.body.appendChild(noti);
  } else {
    notiText = document.getElementById("notification-text");
  }

  // Set message
  notiText.innerText = message;

  // Ensure red styling even if the element is reused
  noti.style.background = "#ffe3e3";
  noti.style.border = "1px solid #ff9b9b";
  noti.style.color = "#c20000";

  // Show it
  noti.style.display = "flex";

  // Auto-hide after 4 seconds
  if (noti._hideTimeout) clearTimeout(noti._hideTimeout);

  noti._hideTimeout = setTimeout(() => {
    noti.style.display = "none";
  }, 4000);
}

// =====================================================
// REMOVE FILE (with confirm box fallback)
// - When removing, add red error highlight back to upload box
// =====================================================
window.removeFile = function (fileNumber) {
  const confirmBox = document.getElementById("confirmBox");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  const doRemove = () => {
    uploadedFiles[fileNumber] = null;
    const input = document.getElementById(`file${fileNumber}`);
    if (input) input.value = "";
    const status = document.getElementById(`status${fileNumber}`);
    if (status) status.textContent = "No file chosen";

    // add input-error class back to upload box to indicate missing
    if (input) {
      const uploadBox = input.closest(".upload-controls");
      if (uploadBox) uploadBox.classList.add("input-error");
    }

    updateFileList();
    showNotification("File removed. Please upload a file for this slot.", "error");
  };

  if (confirmBox && confirmYes && confirmNo) {
    confirmBox.style.display = "flex";
    confirmYes.onclick = () => {
      doRemove();
      confirmBox.style.display = "none";
    };
    confirmNo.onclick = () => confirmBox.style.display = "none";
  } else {
    // no confirm modal available -> remove immediately
    doRemove();
  }
};

// =====================================================
// FORM VALIDATION & NEXT BUTTON
// - Single consolidated next-button handler
// =====================================================
(function setupNextButton() {
  const nextBtn = document.querySelector(".next-btn");
  if (!nextBtn) return;

  nextBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const requiredInputs = document.querySelectorAll(".form-input[required]");
    let isValid = true;

    // Remove previous error highlights
    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));

    // Check required inputs
    requiredInputs.forEach(input => {
      if (!input.value || !input.value.trim()) {
        input.classList.add("input-error");
        isValid = false;
      }
    });

    // Check file uploads - require files 1, 2, 3, and 4
    // File 1: Grades Form 1
    // File 2: Junior High School Form 137
    // File 3: Senior High School Form 137
    // File 4: Certificate of Enrollment
    const requiredFiles = [1, 2, 3, 4];
    
    requiredFiles.forEach(key => {
      if (!uploadedFiles[key]) {
        const fileInput = document.getElementById(`file${key}`);
        if (fileInput) {
          const uploadBox = fileInput.closest(".upload-controls");
          if (uploadBox) uploadBox.classList.add("input-error");
        }
        isValid = false;
      } else {
        const fileInput = document.getElementById(`file${key}`);
        if (fileInput) {
          const uploadBox = fileInput.closest(".upload-controls");
          if (uploadBox) uploadBox.classList.remove("input-error");
        }
      }
    });

    // Check grade table inputs (Junior High School)
    const gradeInputsJHS = document.querySelectorAll('.grades-table input[type="number"]');
    let hasEmptyGrades = false;
    gradeInputsJHS.forEach(input => {
      if (!input.value || input.value.trim() === "" || input.value === "0") {
        input.classList.add("input-error");
        hasEmptyGrades = true;
        isValid = false;
      }
    });
    
    // Highlight content1 container if JHS grades are empty
    if (hasEmptyGrades) {
      const content1Box = document.querySelector('.content1');
      if (content1Box) content1Box.classList.add("input-error");
    }

    // Check Senior High School grade inputs and selects
    const gradeInputsSHS = document.querySelectorAll('.grades-table2 input[type="number"]');
    const gradeSelects = document.querySelectorAll('.grades-table2 select');
    let hasEmptySHSGrades = false;

    gradeInputsSHS.forEach(input => {
      // Find the corresponding N/A checkbox by matching the name
      // e.g., g11MathGrade1 -> g11MathNA1, g11ScienceGrade2 -> g11ScienceNA2
      const inputName = input.name;
      let naCheckbox = null;
      
      if (inputName) {
        // Extract the base name and number (e.g., "g11MathGrade1" -> "g11Math" and "1")
        // Pattern: g11MathGrade1, g11ScienceGrade2, etc.
        const match = inputName.match(/^(.+?Grade)(\d+)$/);
        if (match) {
          const baseName = match[1].replace(/Grade$/, ""); // e.g., "g11MathGrade" -> "g11Math"
          const semesterNum = match[2]; // e.g., "1" or "2"
          const naName = `${baseName}NA${semesterNum}`; // e.g., "g11MathNA1"
          naCheckbox = document.querySelector(`input[type="checkbox"][name="${naName}"]`);
          console.log(`[Validation] Checking N/A for ${inputName}: looking for ${naName}, found:`, naCheckbox);
        } else {
          // Fallback: try to find checkbox in the same row, same position
          const row = input.closest('tr');
          if (row) {
            const cells = Array.from(row.querySelectorAll('td'));
            const inputCell = input.closest('td');
            const inputCellIndex = cells.indexOf(inputCell);
            
            // N/A checkbox is typically in the next cell after the grade input
            if (inputCellIndex >= 0 && inputCellIndex < cells.length - 1) {
              const nextCell = cells[inputCellIndex + 1];
              naCheckbox = nextCell ? nextCell.querySelector('input[type="checkbox"]') : null;
            }
          }
        }
      }
      
      if (naCheckbox && naCheckbox.checked) {
        // Clear any error styling since N/A is checked
        input.classList.remove("input-error");
        return; // Skip this input if N/A is checked
      }
      
      if (!input.value || input.value.trim() === "" || input.value === "0") {
        input.classList.add("input-error");
        hasEmptySHSGrades = true;
        isValid = false;
      }
    });

    gradeSelects.forEach(select => {
      // Find the corresponding N/A checkbox by matching the name
      // e.g., g11MathAlt1 -> g11MathNA1, g11ScienceAlt2 -> g11ScienceNA2
      const selectName = select.name;
      let naCheckbox = null;
      
      if (selectName) {
        // Extract the base name and number (e.g., "g11MathAlt1" -> "g11Math" and "1")
        const match = selectName.match(/^(.+?)(Alt)(\d+)$/);
        if (match) {
          const baseName = match[1]; // e.g., "g11Math"
          const semesterNum = match[3]; // e.g., "1" or "2"
          const naName = `${baseName}NA${semesterNum}`; // e.g., "g11MathNA1"
          naCheckbox = document.querySelector(`input[type="checkbox"][name="${naName}"]`);
        }
      }
      
      if (naCheckbox && naCheckbox.checked) {
        // Clear any error styling since N/A is checked
        select.classList.remove("input-error");
        return; // Skip this select if N/A is checked
      }
      
      // Only flag as error if a select is used but empty
      if (select.value && select.value.trim() !== "") {
        // Select has a value, no error
      } else {
        // Check if alternative subject was needed but not selected
        // You can add more specific logic here if needed
      }
    });

    // Highlight content2 container if SHS grades are empty
    if (hasEmptySHSGrades) {
      const content2Boxes = document.querySelectorAll('.content2');
      content2Boxes.forEach(box => {
        // Only highlight the one with grades-table2
        if (box.querySelector('.grades-table2')) {
          box.classList.add("input-error");
        }
      });
    }

    if (!isValid) {
      // Debug: Log what's failing
      const errorDetails = {
        missingFiles: [],
        missingInputs: [],
        missingGrades: [],
        missingSHSGrades: []
      };
      
      // Check files - only required files (1, 2, 3)
      const requiredFiles = [1, 2, 3];
      requiredFiles.forEach(key => {
        if (!uploadedFiles[key]) {
          errorDetails.missingFiles.push(`File ${key}`);
          const st = document.getElementById(`status${key}`);
          if (st) {
            st.innerHTML = `
              <i class="fa-solid fa-circle-xmark" style="color:#dc3545;"></i> Missing file
            `;
          }
        }
      });
      
      // Check required inputs
      document.querySelectorAll(".form-input[required].input-error").forEach(input => {
        errorDetails.missingInputs.push(input.name || input.id);
      });
      
      // Check JHS grades
      document.querySelectorAll('.grades-table input[type="number"].input-error').forEach(input => {
        errorDetails.missingGrades.push(input.name);
      });
      
      // Check SHS grades
      document.querySelectorAll('.grades-table2 input[type="number"].input-error').forEach(input => {
        errorDetails.missingSHSGrades.push(input.name);
      });
      
      console.warn("[Validation Failed] Details:", errorDetails);
      
      // Priority: Scroll to file upload errors first (go to top), then form errors, then grade errors
      let targetError = null;
      let shouldScrollToTop = false;

      // 1. Check for file upload errors (highest priority - scroll to top where attachments are)
      const fileError = document.querySelector(".upload-controls.input-error");
      if (fileError) {
        console.log("[Validation] File upload error found - scrolling to top (attachments section)");
        shouldScrollToTop = true;
        targetError = fileError;
      }

      // 2. Check for form input errors
      if (!targetError) {
        const formError = document.querySelector(".form-input.input-error");
        if (formError) {
          console.log("[Validation] Form input error found:", formError);
          targetError = formError;
        }
      }

      // 3. Check for grade table errors
      if (!targetError) {
        const gradeError = document.querySelector(".grades-table input.input-error, .grades-table2 input.input-error");
        if (gradeError) {
          console.log("[Validation] Grade input error found:", gradeError);
          targetError = gradeError;
        }
      }

      // 4. Fallback to any error element
      if (!targetError) {
        targetError = document.querySelector(".input-error");
        if (targetError) {
          console.log("[Validation] Generic error element found:", targetError);
        }
      }

      if (shouldScrollToTop) {
        // Scroll to top where attachments section is located
        console.log("[Validation] Scrolling to top for file upload error");
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Also highlight the specific error element
        if (targetError) {
          setTimeout(() => {
            targetError.style.transition = "box-shadow 0.3s";
            targetError.style.boxShadow = "0 0 15px rgba(220, 53, 69, 0.8)";
            setTimeout(() => {
              targetError.style.boxShadow = "";
            }, 3000);
          }, 500); // Small delay after scroll
        }
      } else if (targetError) {
        console.log("[Validation] Scrolling to error element:", targetError);
        targetError.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add a temporary highlight animation
        targetError.style.transition = "box-shadow 0.3s";
        targetError.style.boxShadow = "0 0 15px rgba(220, 53, 69, 0.8)";
        setTimeout(() => {
          targetError.style.boxShadow = "";
        }, 3000);
      } else {
        console.warn("[Validation] No .input-error elements found, but validation failed!");
        // Try to find any empty required fields
        const emptyRequired = document.querySelector(".form-input[required]:not(:valid)");
        if (emptyRequired) {
          emptyRequired.scrollIntoView({ behavior: "smooth", block: "center" });
          emptyRequired.style.border = "2px solid red";
        }
      }

      showNotification("Please fill out all required fields, complete all grades, and upload all attachments!", "error");
      return;
    }

    // Save to database before proceeding
    saveEducationData();
  });
})();

// =====================================================
// SAVE EDUCATION DATA TO DATABASE
// =====================================================
async function saveEducationData() {
  try {
    // Convert files to Base64 - required files (1, 2, 3, 4)
    const filesBase64 = {};
    const requiredFiles = [1, 2, 3, 4];
    
    for (let i of requiredFiles) {
      let file = null;
      
      // Check if we have a real File object in uploadedFiles
      if (uploadedFiles[i] && uploadedFiles[i].file) {
        // Check if it's actually a File/Blob object
        if (uploadedFiles[i].file instanceof File || uploadedFiles[i].file instanceof Blob) {
          file = uploadedFiles[i].file;
        } else {
          // Not a real File object (probably restored from localStorage)
          // Try to get the actual file from the input element
          const fileInput = document.getElementById(`file${i}`);
          if (fileInput && fileInput.files && fileInput.files[0]) {
            file = fileInput.files[0];
            // Update uploadedFiles with the real file
            uploadedFiles[i].file = file;
          }
        }
      } else {
        // Try to get file from input element directly
        const fileInput = document.getElementById(`file${i}`);
        if (fileInput && fileInput.files && fileInput.files[0]) {
          file = fileInput.files[0];
        }
      }
      
      if (file && (file instanceof File || file instanceof Blob)) {
        const base64 = await fileToBase64(file);
        filesBase64[i] = base64;
      } else {
        showNotification(`Please upload file ${i} (${i === 1 ? 'Grades Form 1' : i === 2 ? 'JHS Form 137' : i === 3 ? 'SHS Form 137' : 'Certificate of Enrollment'}).`, "error");
        return;
      }
    }

    // All required files uploaded (files 1-4)

    // Helpers to gather Grade 11 inputs
    const getInputValue = selector => document.querySelector(selector)?.value.trim() || '';
    const getSelectValue = selector => document.querySelector(selector)?.value || '';
    const getCheckboxValue = selector => document.querySelector(selector)?.checked || false;

    // Collect junior high school final grades
    const finalGrades = {
      math: getInputValue('input[name="jhsMath"]'),
      science: getInputValue('input[name="jhsScience"]'),
      english: getInputValue('input[name="jhsEnglish"]')
    };

    // Collect Grade 11 records (priority vs alternative subjects)
    const grade11Records = {
      s1_math: {
        priority: 'Pre-Calculus',
        alternative: getSelectValue('select[name="g11MathAlt1"]'),
        grade: getInputValue('input[name="g11MathGrade1"]'),
        na: getCheckboxValue('input[name="g11MathNA1"]')
      },
      s1_science: {
        priority: 'Earth Science',
        alternative: getSelectValue('select[name="g11ScienceAlt1"]'),
        grade: getInputValue('input[name="g11ScienceGrade1"]'),
        na: getCheckboxValue('input[name="g11ScienceNA1"]')
      },
      s1_english: {
        priority: 'Oral Communication',
        alternative: getSelectValue('select[name="g11EnglishAlt1"]'),
        grade: getInputValue('input[name="g11EnglishGrade1"]'),
        na: getCheckboxValue('input[name="g11EnglishNA1"]')
      },
      s2_math: {
        priority: 'Basic Calculus',
        alternative: getSelectValue('select[name="g11MathAlt2"]'),
        grade: getInputValue('input[name="g11MathGrade2"]'),
        na: getCheckboxValue('input[name="g11MathNA2"]')
      },
      s2_science: {
        priority: 'General Chemistry I',
        alternative: getSelectValue('select[name="g11ScienceAlt2"]'),
        grade: getInputValue('input[name="g11ScienceGrade2"]'),
        na: getCheckboxValue('input[name="g11ScienceNA2"]')
      },
      s2_english: {
        priority: 'Reading and Writing',
        alternative: getSelectValue('select[name="g11EnglishAlt2"]'),
        grade: getInputValue('input[name="g11EnglishGrade2"]'),
        na: getCheckboxValue('input[name="g11EnglishNA2"]')
      }
    };

    // Collect form data
    const formData = {
      shs: document.querySelector('input[name="shsName"]')?.value.trim() || '',
      shs_email: document.querySelector('input[name="shsEmail"]')?.value.trim() || '',
      school_type: document.querySelector('input[name="schoolType"]:checked')?.value || '',
      track: document.querySelector('select[name="track"]')?.value || '',
      strand: document.querySelector('select[name="strand"]')?.value || '',
      specialization: document.querySelector('input[name="specialization"]')?.value.trim() || '',
      junior_hs_completion_year: document.querySelector('input[name="jhsCompletionYear"]')?.value.trim() || '',
      senior_hs_completion_year: document.querySelector('input[name="shsCompletionYear"]')?.value.trim() || '',
      category_of_applicant: document.querySelector('input[name="category"]:checked')?.value || '',
      files: filesBase64,
      final_grades: finalGrades,
      grade_11_records: grade11Records
    };

    // Send to backend
    const response = await fetch('../backend/save_education.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to save education data.');
    }

    // Persist eligibility snapshot for the Programs page
    try {
      localStorage.setItem('eligibilityData', JSON.stringify({
        final_grades: finalGrades,
        grade_11_records: grade11Records
      }));
      localStorage.setItem('selected_strand', formData.strand || '');
      // Save educational data for form preview
      localStorage.setItem('edu-shsName', formData.shs || '');
      localStorage.setItem('edu-track', formData.track || '');
      localStorage.setItem('edu-strand', formData.strand || '');
      localStorage.setItem('edu-specialization', formData.specialization || 'N/A');
      localStorage.setItem('edu-jhsCompletionYear', formData.junior_hs_completion_year || '');
      localStorage.setItem('edu-shsCompletionYear', formData.senior_hs_completion_year || '');
      localStorage.setItem('edu-schoolType', formData.school_type || 'public');
    } catch (err) {
      console.warn('Unable to cache eligibility data:', err);
    }

    // Update max unlocked step
    const nextStep = Math.max(parseInt(localStorage.getItem('maxUnlockedStep')) || 5, 6);
    localStorage.setItem('maxUnlockedStep', nextStep);

    // Navigate to next page
    window.location.href = 'programs.html';
  } catch (error) {
    console.error('Failed to save education data:', error);
    showNotification(error.message || 'Unable to save your information. Please try again.');
  }
}

// =====================================================
// CONVERT FILE TO BASE64
// =====================================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Validate that file is actually a File or Blob
    if (!(file instanceof File) && !(file instanceof Blob)) {
      reject(new Error(`Invalid file type: expected File or Blob, got ${typeof file}. File may have been restored from localStorage. Please re-upload the file.`));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/png;base64, prefix if present
      const base64 = reader.result.split(',')[1] || reader.result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =====================================================
// RESTORE & SAVE ALL PROGRESS (JHS, SHS, Uploaded Files)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {

  // ---------- Helper to remove highlights if all filled ----------
  function checkContainerHighlight(container, inputs) {
    const empty = Array.from(inputs).some(input => !input.value || input.value.trim() === "" || input.value === "0");
    if (!empty && container) container.classList.remove("input-error");
  }

  // ------------------- JHS GRADES -------------------
  const jhsInputs = document.querySelectorAll('.grades-table input[type="number"]');
  const content1Box = document.querySelector('.content1');

  jhsInputs.forEach(input => {
    const saved = localStorage.getItem(`jhs-${input.name}`);
    if (saved) input.value = saved;

    // Remove highlight if filled
    if (input.value && input.value.trim() !== "" && input.value !== "0") {
      input.classList.remove("input-error");
    }

    // Save & remove highlights on input
    input.addEventListener("input", () => {
      localStorage.setItem(`jhs-${input.name}`, input.value);
      input.classList.remove("input-error");
      checkContainerHighlight(content1Box, jhsInputs);
    });
  });

  // ------------------- SHS GRADES -------------------
  const shsInputs = document.querySelectorAll('.grades-table2 input[type="number"]');
  const shsSelects = document.querySelectorAll('.grades-table2 select');

  shsInputs.forEach(input => {
    const saved = localStorage.getItem(`shs-${input.name}`);
    if (saved) input.value = saved;

    input.addEventListener("input", () => {
      localStorage.setItem(`shs-${input.name}`, input.value);
      input.classList.remove("input-error");

      // Remove content2 highlight if all filled/N/A checked
      const content2Box = input.closest('.content2');
      const rows = content2Box.querySelectorAll('tr');
      let empty = false;
      rows.forEach(row => {
        const na = row.querySelector('input[type="checkbox"]');
        const val = row.querySelector('input[type="number"]');
        if (val && (!val.value || val.value.trim() === "" || val.value === "0") && !(na && na.checked)) {
          empty = true;
        }
      });
      if (!empty) content2Box.classList.remove("input-error");
    });
  });

  shsSelects.forEach(select => {
    const saved = localStorage.getItem(`shs-${select.name}`);
    if (saved) select.value = saved;

    select.addEventListener("change", () => {
      localStorage.setItem(`shs-${select.name}`, select.value);
    });
  });

  // ------------------- UPLOADED FILES -------------------
  Object.keys(uploadedFiles).forEach(key => {
    const saved = localStorage.getItem(`file-${key}`);
    if (saved) {
      const fileInput = document.getElementById(`file${key}`);
      if (fileInput) {
        // Cannot restore actual File object, but we can restore status text
        const status = document.getElementById(`status${key}`);
        if (status) status.innerHTML = `
          <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
          ${saved}
        `;
        // Mark uploadedFiles for reference
        uploadedFiles[key] = { file: { name: saved }, type: fileInput.dataset.type || "Required" };
        const uploadBox = fileInput.closest(".upload-controls");
        if (uploadBox) uploadBox.classList.remove("input-error");
      }
    }
  });

});

// =====================================================
// SAVE FILE UPLOADS TO LOCALSTORAGE
// =====================================================
function handleFileUpload(num, label) {
  const input = document.getElementById(`file${num}`);
  const status = document.getElementById(`status${num}`);
  const file = input && input.files ? input.files[0] : null;

  if (file) {
    const type = label || (input && input.dataset && input.dataset.type) || "Required";
    uploadedFiles[num] = { file, type };

    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
        ${escapeHtml(file.name)}
      `;
    }

    const uploadBox = input ? input.closest(".upload-controls") : null;
    if (uploadBox) uploadBox.classList.remove("input-error");

    // Save file name to localStorage for persistence
    localStorage.setItem(`file-${num}`, file.name);

    updateFileList();
  }
}

// =====================================================
// REMOVE FILE & LOCALSTORAGE ENTRY
// =====================================================
window.removeFile = function (fileNumber) {
  uploadedFiles[fileNumber] = null;
  const input = document.getElementById(`file${fileNumber}`);
  if (input) input.value = "";
  const status = document.getElementById(`status${fileNumber}`);
  if (status) status.textContent = "No file chosen";

  const uploadBox = input.closest(".upload-controls");
  if (uploadBox) uploadBox.classList.add("input-error");

  // Remove from localStorage
  localStorage.removeItem(`file-${fileNumber}`);

  updateFileList();
  showNotification("File removed. Please upload a file for this slot.", "error");
};

// =====================================================
// SAVE & RESTORE FORM PROGRESS (Education Fields + Uploaded Files)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  // ---------- EDUCATIONAL INFORMATION ----------
  const eduFields = document.querySelectorAll('.container2 input, .container2 select, .container2 textarea');
  eduFields.forEach(field => {
    const saved = localStorage.getItem(`edu-${field.name}`);
    if (saved !== null) {
      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = saved === "true";
      } else {
        field.value = saved;
      }
      field.classList.remove("input-error");
    }

   // SAVE
document.querySelectorAll('.container2 input, .container2 select, .container2 textarea').forEach(field => {
  field.addEventListener('change', () => {
    localStorage.setItem(`edu-${field.name}`, field.type === "checkbox" ? field.checked : field.value);
  });
});

// RESTORE
document.querySelectorAll('.container2 input, .container2 select, .container2 textarea').forEach(field => {
  const saved = localStorage.getItem(`edu-${field.name}`);
    if (saved !== null) {
        if (field.type === "radio") field.checked = (field.value === saved);
        else if (field.type === "checkbox") field.checked = (saved === "true");
        else field.value = saved;
    }
});

  // ---------- Sync strand selection for Programs filtering (run after restore) ----------
  const strandField = document.querySelector('select[name="strand"]');
  if (strandField) {
    const storeStrand = () => {
      const value = strandField.value || '';
      localStorage.setItem('selected_strand', value.toLowerCase());
    };
    // Delay initial store until restored value is applied
    setTimeout(storeStrand, 0);
    strandField.addEventListener('change', storeStrand);
  }

    // Also listen to change events for selects/radio
    field.addEventListener("change", () => {
      if (field.type === "checkbox" || field.type === "radio") {
        localStorage.setItem(`edu-${field.name}`, field.checked);
      } else {
        localStorage.setItem(`edu-${field.name}`, field.value);
      }
      field.classList.remove("input-error");
    });
  });

  // ---------- JHS GRADES ----------
  const jhsInputs = document.querySelectorAll('.grades-table input[type="number"]');
  const content1Box = document.querySelector('.content1');
  jhsInputs.forEach(input => {
    const saved = localStorage.getItem(`jhs-${input.name}`);
    if (saved) input.value = saved;
    if (input.value) input.classList.remove("input-error");

    input.addEventListener("input", () => {
      localStorage.setItem(`jhs-${input.name}`, input.value);
      input.classList.remove("input-error");

      const empty = Array.from(jhsInputs).some(i => !i.value || i.value.trim() === "" || i.value === "0");
      if (!empty && content1Box) content1Box.classList.remove("input-error");
    });
  });

  // ---------- SHS GRADES ----------
  const shsInputs = document.querySelectorAll('.grades-table2 input[type="number"]');
  const shsSelects = document.querySelectorAll('.grades-table2 select');

  shsInputs.forEach(input => {
    const saved = localStorage.getItem(`shs-${input.name}`);
    if (saved) input.value = saved;
    input.addEventListener("input", () => {
      localStorage.setItem(`shs-${input.name}`, input.value);
      input.classList.remove("input-error");
    });
  });

  shsSelects.forEach(select => {
    const saved = localStorage.getItem(`shs-${select.name}`);
    if (saved) select.value = saved;

    select.addEventListener("change", () => {
      localStorage.setItem(`shs-${select.name}`, select.value);
    });
  });

  // ---------- UPLOADED FILES ----------
  Object.keys(uploadedFiles).forEach(key => {
    const saved = localStorage.getItem(`file-${key}-data`);
    if (saved) {
      const data = JSON.parse(saved);
      uploadedFiles[key] = data;

      const status = document.getElementById(`status${key}`);
      if (status) {
        status.innerHTML = `
          <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
          ${data.file.name}
        `;
      }

      const input = document.getElementById(`file${key}`);
      if (input) {
        const uploadBox = input.closest(".upload-controls");
        if (uploadBox) uploadBox.classList.remove("input-error");
      }
    }
  });

  updateFileList();
});

// ---------- HANDLE FILE UPLOAD ----------
function handleFileUpload(num, label) {
  const input = document.getElementById(`file${num}`);
  const status = document.getElementById(`status${num}`);
  const file = input && input.files ? input.files[0] : null;

  if (file) {
    const type = label || (input.dataset && input.dataset.type) || "Required";
    uploadedFiles[num] = { file, type };

    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
        ${escapeHtml(file.name)}
      `;
    }

    const uploadBox = input ? input.closest(".upload-controls") : null;
    if (uploadBox) uploadBox.classList.remove("input-error");

    localStorage.setItem(`file-${num}-data`, JSON.stringify({
      file: { name: file.name, size: file.size },
      type
    }));

    updateFileList();
  }
}

// ---------- REMOVE FILE ----------
window.removeFile = function (fileNumber) {
  uploadedFiles[fileNumber] = null;
  const input = document.getElementById(`file${fileNumber}`);
  if (input) input.value = "";
  const status = document.getElementById(`status${fileNumber}`);
  if (status) status.textContent = "No file chosen";

  const uploadBox = input.closest(".upload-controls");
  if (uploadBox) uploadBox.classList.add("input-error");

  localStorage.removeItem(`file-${fileNumber}-data`);
  updateFileList();
  showNotification("File removed. Please upload a file for this slot.", "error");
};

  // Update the file list table after restoring
  updateFileList();

// =====================================================
// HANDLE FILE UPLOAD WITH AI ANALYSIS & PERSISTENCE
// =====================================================
const AI_ANALYZE_ENDPOINT = "http://127.0.0.1:5001/attachments/analyze";
const AI_ANALYZE_TIMEOUT = 120000; // 120s for larger multi-page PDFs

// Debug: Log endpoint configuration
console.log("[DEBUG] AI_ANALYZE_ENDPOINT configured:", AI_ANALYZE_ENDPOINT);
console.log("[DEBUG] Ready to handle file uploads");

async function handleFileUpload(num, label) {
  console.log(`[DEBUG] handleFileUpload called: num=${num}, label=${label}`);
  const input = document.getElementById(`file${num}`);
  const status = document.getElementById(`status${num}`);
  const file = input && input.files ? input.files[0] : null;

  if (!file) {
    console.warn(`[DEBUG] No file selected for file${num}`);
    return;
  }
  
  console.log(`[DEBUG] File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

  const type = label || (input.dataset && input.dataset.type) || "Required";
  uploadedFiles[num] = { file, type, analysis: null };

  if (status) {
    status.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin" style="color:#0d6efd;"></i>
      Analyzing ${escapeHtml(file.name)}...
    `;
  }

  const uploadBox = input ? input.closest(".upload-controls") : null;
  if (uploadBox) uploadBox.classList.remove("input-error");

  try {
    console.log(`[DEBUG] Starting AI analysis for file: ${file.name}`);
    const analysis = await analyzeAttachmentWithAI(file, type);
    console.log(`[DEBUG] AI analysis completed:`, analysis);
    uploadedFiles[num].analysis = analysis;

    if (analysis?.quality && analysis.quality.passed === false) {
      throw new Error(
        analysis.quality.warnings?.join(" ") ||
          "AI detected that this file is cropped or blurred. Please upload a clearer copy."
      );
    }

    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color:#28a745;"></i>
        ${escapeHtml(file.name)}
        <span class="ai-indicator" title="AI validation passed">AI ✓</span>
      `;
    }

    // Save metadata for persistence (actual File can't be stored)
    localStorage.setItem(
      `file-${num}-data`,
      JSON.stringify({
        file: { name: file.name, size: file.size },
        type,
        analysis: analysis?.quality || null,
      })
    );

    // Only auto-fill when Grades Form 1 (file #1) is processed
    if (num === 1) {
      if (analysis?.fields) {
        console.log("AI Analysis Result (Grades Form 1):", analysis.fields);
        applyAutoFillFromAI(analysis.fields);
      } else {
        console.warn("No fields found in AI analysis for Grades Form 1:", analysis);
      }
    } else {
      console.log(`[DEBUG] Skipping auto-fill for file slot ${num}; auto-fill is restricted to Grades Form 1.`);
    }

    updateFileList();
  } catch (error) {
    console.error("AI analysis failed:", error);
    uploadedFiles[num] = null;
    if (input) input.value = "";
    if (status) {
      status.innerHTML = `
        <i class="fa-solid fa-circle-xmark" style="color:#dc3545;"></i>
        ${error.message || "AI analysis failed. Please try another file."}
      `;
    }
    if (uploadBox) uploadBox.classList.add("input-error");
    showNotification(
      error.message ||
        "We couldn't validate that attachment. Please upload a clearer copy.",
      "error"
    );
  }
}

async function analyzeAttachmentWithAI(file, documentLabel) {
  console.log(`[DEBUG] analyzeAttachmentWithAI called: file=${file.name}, label=${documentLabel}`);
  if (!AI_ANALYZE_ENDPOINT) {
    console.error("[DEBUG] AI_ANALYZE_ENDPOINT is not set!");
    return null;
  }

  console.log(`[DEBUG] Converting file to base64...`);
  const base64 = await fileToBase64(file);
  console.log(`[DEBUG] Base64 conversion complete, length: ${base64.length}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_ANALYZE_TIMEOUT);

  try {
    console.log(`[DEBUG] Sending request to: ${AI_ANALYZE_ENDPOINT}`);
    const response = await fetch(AI_ANALYZE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        document_type: documentLabel,
        data: base64,
      }),
      signal: controller.signal,
    });

    console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const message = await safeReadError(response);
      console.error(`[DEBUG] API error: ${message}`);
      throw new Error(message || "AI service rejected this file.");
    }

    const result = await response.json();
    console.log(`[DEBUG] API response received:`, result);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safeReadError(response) {
  try {
    const payload = await response.json();
    return payload?.detail || payload?.message || response.statusText;
  } catch (err) {
    return response.statusText;
  }
}

function applyAutoFillFromAI(fields) {
  if (!fields) {
    console.warn("applyAutoFillFromAI: No fields provided");
    return;
  }

  console.log("Applying auto-fill from AI:", fields);

  if (fields.inputs) {
    console.log("Filling inputs:", fields.inputs);
    console.log("Inputs object keys:", Object.keys(fields.inputs));
    console.log("Inputs object entries:", Object.entries(fields.inputs));
    if (Object.keys(fields.inputs).length === 0) {
      console.warn("⚠️ Inputs object is empty! Check AI service terminal for Nanonets response.");
    }
    Object.entries(fields.inputs).forEach(([name, value]) => {
      console.log(`Setting input ${name} = ${value}`);
      setFormValueByName(name, value);
    });
  } else {
    console.warn("⚠️ No inputs field in response");
  }

  if (fields.selects) {
    console.log("Filling selects:", fields.selects);
    console.log("Selects object keys:", Object.keys(fields.selects));
    if (Object.keys(fields.selects).length === 0) {
      console.warn("⚠️ Selects object is empty! Check AI service terminal for Nanonets response.");
    }
    Object.entries(fields.selects).forEach(([name, value]) => {
      console.log(`Setting select ${name} = ${value}`);
      setFormValueByName(name, value, "select");
    });
  } else {
    console.warn("⚠️ No selects field in response");
  }

  if (fields.checkboxes) {
    Object.entries(fields.checkboxes).forEach(([name, checked]) => {
      setCheckboxByName(name, Boolean(checked));
    });
  }

  // Handle Grade 11 entries from Nanonets/AI
  if (fields.grade11 && Array.isArray(fields.grade11)) {
    console.log("Filling Grade 11 entries:", fields.grade11);
    fields.grade11.forEach(entry => {
      if (!entry.gradeField || !entry.grade) {
        console.warn(`[DEBUG] Skipping grade11 entry - missing gradeField or grade:`, entry);
        return;
      }

      console.log(`[DEBUG] Processing grade11 entry:`, entry);
      
      // Set the grade value
      const gradeInput = document.querySelector(`input[name="${cssEscape(entry.gradeField)}"]`);
      if (gradeInput) {
        console.log(`[DEBUG] Setting grade ${entry.gradeField} = ${entry.grade}`);
        gradeInput.value = entry.grade;
        gradeInput.classList.remove("input-error");
        gradeInput.dispatchEvent(new Event("input", { bubbles: true }));
        persistAutoFillValue(gradeInput, entry.grade);
      } else {
        console.warn(`[DEBUG] Grade input not found: ${entry.gradeField}`);
      }

      // If using alternative subject, set the alternative select
      if (entry.useAlternative && entry.altSelectField && entry.altValue) {
        console.log(`[DEBUG] Setting alternative for ${entry.gradeField}: ${entry.altSelectField} = ${entry.altValue}`);
        const altSelect = document.querySelector(`select[name="${cssEscape(entry.altSelectField)}"]`);
        if (altSelect) {
          // Find option that matches the altValue
          const options = Array.from(altSelect.options);
          console.log(`[DEBUG] Available options:`, options.map(opt => ({text: opt.textContent.trim(), value: opt.value})));
          
          const matchingOption = options.find(opt => {
            const optText = opt.textContent.trim();
            const optValue = opt.value;
            const match = optText === entry.altValue || optValue === entry.altValue;
            if (match) {
              console.log(`[DEBUG] Found match: "${optText}" (value: "${optValue}")`);
            }
            return match;
          });
          
          if (matchingOption) {
            // For selects without explicit values, use the option index or text
            if (matchingOption.value) {
              altSelect.value = matchingOption.value;
            } else {
              // If no value attribute, set by index
              altSelect.selectedIndex = matchingOption.index;
            }
            console.log(`[DEBUG] Set alternative select to: ${altSelect.value || matchingOption.textContent.trim()}`);
            altSelect.classList.remove("input-error");
            altSelect.dispatchEvent(new Event("change", { bubbles: true }));
            persistAutoFillValue(altSelect, altSelect.value || matchingOption.textContent.trim());
          } else {
            console.warn(`[DEBUG] No matching option found for "${entry.altValue}" in select ${entry.altSelectField}`);
          }
        } else {
          console.warn(`[DEBUG] Alternative select not found: ${entry.altSelectField}`);
        }
      } else {
        console.log(`[DEBUG] Not using alternative for ${entry.gradeField}: useAlternative=${entry.useAlternative}, altSelectField=${entry.altSelectField}, altValue=${entry.altValue}`);
      }
    });
  }
}

function setFormValueByName(name, value, typeOverride) {
  if (value === undefined || value === null || value === "") {
    console.warn(`Skipping empty value for ${name}`);
    return;
  }
  const selector =
    typeOverride === "select"
      ? `select[name="${cssEscape(name)}"]`
      : `input[name="${cssEscape(name)}"]`;

  const element = document.querySelector(selector);
  if (!element) {
    // Some fields are extracted by Nanonets but not needed in the form (e.g., fullName, schoolAddress)
    // These are just for reference in the softcopy, not required in the web form
    const optionalFields = ["fullName", "schoolAddress"];
    if (optionalFields.includes(name)) {
      // Silently skip - these are expected to not exist in the form
      return;
    } else {
      console.warn(`Element not found for selector: ${selector}`);
    }
    return;
  }
  
  console.log(`Setting ${name} to ${value} (found element: ${element.tagName})`);

  element.value = value;
  element.classList.remove("input-error");

  const eventName = element.tagName === "SELECT" ? "change" : "input";
  element.dispatchEvent(new Event(eventName, { bubbles: true }));

  persistAutoFillValue(element, value);
}

function setCheckboxByName(name, checked) {
  const element = document.querySelector(
    `input[name="${cssEscape(name)}"][type="checkbox"]`
  );
  if (!element) return;

  element.checked = checked;
  element.classList.remove("input-error");
  element.dispatchEvent(new Event("change", { bubbles: true }));
  persistAutoFillValue(element, checked);
}

function persistAutoFillValue(element, value) {
  const name = element.name;
  if (!name) return;

  if (element.closest(".grades-table")) {
    localStorage.setItem(`jhs-${name}`, value);
  } else if (element.closest(".grades-table2")) {
    localStorage.setItem(`shs-${name}`, value);
  } else if (element.closest(".container2")) {
    localStorage.setItem(`edu-${name}`, value);
  }
}

// =====================================================
// REMOVE FILE & LOCALSTORAGE ENTRY
// =====================================================
window.removeFile = function (fileNumber) {
  uploadedFiles[fileNumber] = null;
  const input = document.getElementById(`file${fileNumber}`);
  if (input) input.value = "";
  const status = document.getElementById(`status${fileNumber}`);
  if (status) status.textContent = "No file chosen";

  const uploadBox = input ? input.closest(".upload-controls") : null;
  if (uploadBox) uploadBox.classList.add("input-error");

  localStorage.removeItem(`file-${fileNumber}-data`);
  updateFileList();
  showNotification("File removed. Please upload a file for this slot.", "error");
};

// =====================================================
// Initialize: optionally call updateFileList to show initial state
// =====================================================
updateFileList();