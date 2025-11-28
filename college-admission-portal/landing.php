<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Batangas State University - College Admission Online Application</title>
  <link rel="stylesheet" href="landing.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>

<body>
  <!-- ===== HEADER / BANNER ===== -->
  <header class="bsu-banner">
    <div class="banner-bg">
      <img src="assets/front bsu.jpg" alt="BatStateU Banner Background">
    </div>

    <div class="banner-overlay">
      <div class="banner-top">
        <img src="assets/logo bsu.png" alt="Batangas State University Logo">
        <div class="banner-name">
          <h1>BATANGAS STATE UNIVERSITY</h1>
          <p class="tagline-red">The National Engineering University</p>
        </div>
      </div>

      <div class="banner-text">
        <h2 class="big-line">COLLEGE ADMISSION</h2>
        <h2 class="big-line">ONLINE APPLICATION</h2>
      </div>

      <img src="assets/alangilan bg remove.png" alt="Alangilan Campus" class="logo-bottom-right">

      <div class="banner-footer">
        <p>Leading Innovations, Transforming Lives, Building the Nation</p>
      </div>
    </div>
  </header>

  <!-- ===== LOGIN SECTION ===== -->
  <section class="login-container">
    <div class="overlay"></div>

    <!-- LOGIN MODAL -->
    <div id="loginModal" class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <img src="assets/user.png" alt="Info" class="modal-icon">
          <span>LOGIN</span>
        </div>
        <div class="modal-body">
          <p class="welcome">Welcome to College Applicant's Portal</p>
          <p class="subtitle">Please login</p>

          <!-- FORM for Login -->
          <form id="loginForm" method="POST" action="../backend/login.php">
            <div class="form-group">
              <label for="appNumber">Application Number</label>
              <input 
                type="text" 
                id="appNumber" 
                name="application_number" 
                placeholder="21-12345" 
                pattern="\d{2}-\d{5}" 
                required 
              >
              <label for="pin">PIN</label> 
              <input 
                type="password" 
                id="pin" 
                name="pin" 
                placeholder="••••" 
                pattern="\d{4}" 
                required 
                minlength="4" 
                maxlength="4"
              >

              <div class="info-box">
                <img src="assets/information-button.png" alt="Info" class="info-icon">
                <span>Your PIN is the 4-digit number sent to your email during your successful application.</span>
              </div>
            </div>

            <!-- Display error messages from login.php -->
            <?php if (isset($_GET['error'])) { ?>
              <div class="error-message" style="color: red;">
                <?php echo htmlspecialchars($_GET['error']); ?>
              </div>
            <?php } ?>

            <div class="button-group">
              <button type="button" class="btn btn-forgot" onclick="showForgot()">
                <img src="assets/question.png" alt="Info" class="forgot-icon"> Forgot PIN? Click here
              </button>

              <button type="button" class="btn btn-login" onclick="login()">
                <img src="assets/unlock.png" alt="Info" class="login-icon"> Sign-in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== FOOTER ===== -->
  <footer>
    <div class="footer-content">
      <div class="footer-left">
        <h4>Contact Us</h4>
        <p>📧 iao@g.batstate-u.edu.ph</p>
        <p>☎️ Local: 1148</p>
        <p>👥 facebook.com/TAOBatStateU</p>
      </div>

      <div class="footer-center">
        <h4>Trunklines</h4>
        <p>980-0385; 425-0139 | 980-0387; 425-0143</p>
        <p>980-0392; 425-7160 | 980-0393; 425-7161</p>
        <p>980-0394; 425-7162 | 779-8400; 779-8401</p>
        <p>779-8402; 779-8403 | 779-8404; 779-8406</p>
      </div>

      <div class="footer-right">
        <img src="assets/spartan (1).png" alt="Spartan Logo">
      </div>
    </div>
  </footer>

  <!-- Toast notification element -->
  <div id="toast"></div>

  <script>
    // ===== Notification Toast =====
    function showToast(message, type = "info") {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.className = `toast ${type} show`;
      setTimeout(() => (toast.className = "toast"), 3000);
    }

// ===== LOGIN WITH SUCCESS BANNER =====
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

  // If format is correct, show success toast and submit form to backend
  showToast("Login successful!", "success");

  // Submit the form after a brief delay to let user see the toast
  setTimeout(() => {
    document.getElementById("loginForm").submit();
  }, 1000);
}

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

    // Optional: auto-format app number while typing
    document.getElementById('appNumber').addEventListener('input', function(e) {
      let value = e.target.value.replace(/[^0-9]/g, ''); // only numbers
      if (value.length > 2) value = value.slice(0,2) + '-' + value.slice(2,7);
      if (value.length > 8) value = value.slice(0,8); // max 8 chars (2+dash+5)
      e.target.value = value;
    });
  </script>
</body>
</html>
