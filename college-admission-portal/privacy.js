function showVideo() {
    document.getElementById('noticeCard').classList.add('hidden');
    document.getElementById('videoSection').classList.remove('hidden');
}

function nextStep() {
    // Go to the first step of the application process
    window.location.href = "readfirst.html";
}

// ===== SHOW APPLICATION START TOAST =====
(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get('started') === 'application') {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = 'Welcome! Let\'s begin your college application.';
        toast.className = 'toast success show';
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
})();