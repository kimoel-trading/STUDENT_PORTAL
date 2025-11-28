// ===== Switch Modals =====
function showForgot() {
  document.getElementById("loginModal").classList.remove("active");
  document.getElementById("forgotModal").classList.add("active");
}

function showLogin() {
  document.getElementById("forgotModal").classList.remove("active");
  document.getElementById("loginModal").classList.add("active");
  document.getElementById("applicationDetails").innerHTML = "";
}

// ===== Notification Toast =====
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => (toast.className = "toast"), 3000);
}

// ===== LOGIN =====
function login() {
  const appNumber = document.getElementById("appNumber").value.trim();
  const pin = document.getElementById("pin").value.trim();

  // Validate with regex
  const appPattern = /^\d{2}-\d{5}$/;  // 2 digits, dash, 5 digits
  const pinPattern = /^\d{4}$/;        // 4 digits

  if (!appPattern.test(appNumber)) {
    showToast(" Application Number format invalid. Use XX-XXXXX.", "error");
    return;
  }

  if (!pinPattern.test(pin)) {
    showToast(" PIN format invalid. Enter 4 digits.", "error");
    return;
  }

  // If format is correct, proceed
  showToast("Login successful!", "success");
  setTimeout(() => { window.location.href = "privacy.html"; }, 1000);
}

// Optional: auto-format app number while typing
document.getElementById('appNumber').addEventListener('input', function(e) {
  let value = e.target.value.replace(/[^0-9]/g, ''); // only numbers
  if (value.length > 2) value = value.slice(0,2) + '-' + value.slice(2,7);
  if (value.length > 8) value = value.slice(0,8); // max 8 chars (2+dash+5)
  e.target.value = value;
});

// ===== SEND EMAIL =====
function sendEmail() {
  const email = document.getElementById("emailSend").value.trim();

  if (!email) {
    showToast(" Please enter your email.", "error");
    return;
  }

  showToast(`Verification email sent to ${email}`, "success");
  setTimeout(showLogin, 1500);
}

// ===== VERIFY APPLICANT =====
function verifyApplicant() {
  const last = document.getElementById("lastName").value.trim();
  const first = document.getElementById("firstName").value.trim();
  const birth = document.getElementById("birthDate").value;
  const email = document.getElementById("emailVerify").value.trim();
  const details = document.getElementById("applicationDetails");

  if (!last || !first || !birth || !email) {
    details.innerHTML = `<div class="alert error">Please fill in all fields.</div>`;
    return;
  }

  // Simulated matching data
  if (last.toLowerCase() === "dela cruz" && first.toLowerCase() === "juan") {
    details.innerHTML = `
      <div class="alert success">
         Applicant Found
        <br><strong>Name:</strong> ${first} ${last}<br>
        <strong>Birthdate:</strong> ${birth}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Application No:</strong> 21-12345<br>
        <strong>PIN:</strong> 1234
      </div>
    `;
    showToast("Applicant verified successfully!", "success");
    setTimeout(showLogin, 2500);
  } else {
    details.innerHTML = `<div class="alert error"> No applicant found. Please check your details.</div>`;
    showToast("No applicant found.", "error");
  }
}
