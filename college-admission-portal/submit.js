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
};

// ====== Get current page ======
const currentPage = window.location.pathname.split("/").pop();

// ====== Load progress safely ======
let savedStep = parseInt(localStorage.getItem("currentStep"));
let currentStep = pageToStep[currentPage] !== undefined ? pageToStep[currentPage] : (savedStep || 0);
let maxUnlockedStep = parseInt(localStorage.getItem("maxUnlockedStep")) || currentStep;

// Update maxUnlockedStep if current page is further than saved progress
if (currentStep > maxUnlockedStep) {
  maxUnlockedStep = currentStep;
}

document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");

  // ====== Update step UI ======
  function updateSteps() {
    steps.forEach((step, index) => {
      // ACTIVE step (highlighted)
      step.classList.toggle("active", index === currentStep);

      // Make all steps up to maxUnlockedStep clickable
      if (index <= maxUnlockedStep) {
        step.classList.add("clickable");
        step.style.pointerEvents = "auto";
        step.style.opacity = "1";
        step.style.cursor = "pointer";
      } else {
        // Locked steps
        step.classList.remove("clickable");
        step.style.pointerEvents = "none";
        step.style.opacity = "0.5";
        step.style.cursor = "not-allowed";
      }
    });

    // Save progress
    localStorage.setItem("currentStep", currentStep);
    localStorage.setItem("maxUnlockedStep", maxUnlockedStep);
  }

  // ====== Step click navigation ======
  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      // Allow navigation to any unlocked step (including backward navigation)
      if (index > maxUnlockedStep) {
        console.log('Step locked:', index);
        return;
      }

      currentStep = index;
      updateSteps();

      // Navigate to the corresponding page
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

      if (pageMap[index]) {
        window.location.href = pageMap[index];
      }
    });
  });

  // ====== Initial render ======
  updateSteps();
});

// --- signature functionality (file upload + draw) ---
const fileInput = document.getElementById('fileInput');
const chooseFileBtn = document.getElementById('chooseFileBtn');
const fileName = document.getElementById('fileName');
const signatureImage = document.getElementById('signatureImage');
const placeholder = document.getElementById('placeholder');
const certifyCheckbox = document.getElementById('certifyCheckbox');
const submitBtn = document.getElementById('submitBtn');
const drawBtn = document.getElementById('drawBtn');
const canvas = document.getElementById('signatureCanvas');

if (!canvas) {
  console.warn('Signature canvas not found - signature functionality disabled.');
} else {
  let ctx = canvas.getContext('2d');
  let isDrawing = false;
  let drawMode = false;
  let hasSignature = false;

  function fitSignatureCanvas() {
    const box = document.getElementById('signatureBox');
    if (!box || !canvas) return;
    const rect = box.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
  }

  window.addEventListener('DOMContentLoaded', fitSignatureCanvas);
  window.addEventListener('resize', fitSignatureCanvas);

  function showCanvas() {
    canvas.style.display = 'block';
    canvas.classList.add('active');
    signatureImage && signatureImage.classList.remove('show');
    placeholder.style.display = 'none';
    fitSignatureCanvas();
  }
  function hideCanvas() {
    canvas.style.display = 'none';
    canvas.classList.remove('active');
  }
  function showImage() {
    if (!signatureImage) return;
    signatureImage.classList.add('show');
    signatureImage.style.display = 'block';
    hideCanvas();
    placeholder.style.display = 'none';
  }
  function hideImage() {
    if (!signatureImage) return;
    signatureImage.classList.remove('show');
    signatureImage.style.display = 'none';
  }
  function showPlaceholder() {
    placeholder.style.display = 'block';
    hideCanvas();
    hideImage();
  }

  function showSuccessNotif() {
    const overlay = document.getElementById("notifOverlay");
    if (overlay) overlay.style.display = "flex";
  }

  function checkSubmitEligibility() {
    const enabled = !!hasSignature && !!(certifyCheckbox && certifyCheckbox.checked);
    if (submitBtn) submitBtn.disabled = !enabled;
  }

  if (chooseFileBtn && fileInput) {
    chooseFileBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      fileName && (fileName.textContent = file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (signatureImage) signatureImage.src = ev.target.result;
        showImage();
        ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMode = false;
        if (drawBtn) {
          drawBtn.innerHTML = `<svg class="pen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg> Draw Signature`;
        }
        hasSignature = true;
        checkSubmitEligibility();
      };
      reader.readAsDataURL(file);
    });
  }

  if (drawBtn) {
    drawBtn.addEventListener('click', () => {
      drawMode = !drawMode;
      if (drawMode) {
        showCanvas();
        hideImage();
        drawBtn.textContent = 'Clear Drawing';
        fitSignatureCanvas();
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hideCanvas();
        showPlaceholder();
        drawBtn.innerHTML = `<svg class="pen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg> Draw Signature`;
        hasSignature = false;
        checkSubmitEligibility();
      }
    });
  }

  canvas.style.touchAction = 'none';

  function getCanvasPointCSS(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (evt.clientX !== undefined) ? evt.clientX : (evt.touches && evt.touches[0] && evt.touches[0].clientX);
    const clientY = (evt.clientY !== undefined) ? evt.clientY : (evt.touches && evt.touches[0] && evt.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function pointerDownHandler(e) {
    if (!drawMode) return;
    e.preventDefault();
    if (e.pointerId) canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    const p = getCanvasPointCSS(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function pointerMoveHandler(e) {
    if (!isDrawing || !drawMode) return;
    e.preventDefault();
    const p = getCanvasPointCSS(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasSignature) {
      hasSignature = true;
      checkSubmitEligibility();
    }
  }

  function pointerUpHandler(e) {
    if (!drawMode) return;
    e.preventDefault();
    if (e.pointerId) canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);
    if (isDrawing) {
      isDrawing = false;
      ctx.closePath();
    }
  }

  canvas.addEventListener('pointerdown', pointerDownHandler);
  canvas.addEventListener('pointermove', pointerMoveHandler);
  canvas.addEventListener('pointerup', pointerUpHandler);
  canvas.addEventListener('pointercancel', pointerUpHandler);
  canvas.addEventListener('pointerleave', pointerUpHandler);

  if (certifyCheckbox) {
  // LOAD SAVED CHECKBOX STATE
  const savedCheck = localStorage.getItem("savedCertify");
  if (savedCheck === "true") {
    certifyCheckbox.checked = true;
  }

  certifyCheckbox.addEventListener('change', () => {
    localStorage.setItem("savedCertify", certifyCheckbox.checked ? "true" : "false");
    checkSubmitEligibility();
  });
}

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!hasSignature) {
        alert('Please upload or draw your signature before submitting.');
        return;
      }
      if (!certifyCheckbox || !certifyCheckbox.checked) {
        alert('Please check the certification box.');
        return;
      }

      const overlay = document.getElementById('notifOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => {
          overlay.style.display = 'none';
          window.location.href = 'educattach.html';
        }, 2500);
      }
    });
  }

  canvas.style.display = 'none';
  if (signatureImage && signatureImage.src) {
    hasSignature = true;
    showImage();
  } else {
    showPlaceholder();
  }

  checkSubmitEligibility();
}

  // =====================================================
// SIGNATURE SAVING / RESTORING (Upload + Drawing)
// =====================================================

// Save signature image or canvas drawing
function saveSignature() {
  let data = "";

  if (signatureImage && signatureImage.style.display === "block") {
    // Uploaded image
    data = signatureImage.src;
  } else if (canvas && canvas.style.display === "block") {
    // Drawn signature
    data = canvas.toDataURL("image/png");
  }

  if (data) {
    localStorage.setItem("savedSignature", data);
  }
}

// Restore saved signature
function loadSignature() {
  const saved = localStorage.getItem("savedSignature");
  if (!saved) return false;

  // Uploaded Image
  if (!saved.startsWith("data:image/png")) {
    signatureImage.src = saved;
    showImage();
    hasSignature = true;
    return true;
  }

  // Drawn Signature
  const img = new Image();
  img.onload = () => {
    showCanvas();
    fitSignatureCanvas();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    hasSignature = true;
    checkSubmitEligibility();
  };
  img.src = saved;

  return true;
}
