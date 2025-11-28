function showVideo() {
    document.getElementById('noticeCard').classList.add('hidden');
    document.getElementById('videoSection').classList.remove('hidden');
}

function nextStep() {
    // CHANGE THIS to your next page
    window.location.href = "index.html";
}

// ===== SHOW LOGIN SUCCESS TOAST (same style as landing page) =====
(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = 'Login successful!';
        toast.className = 'toast success show';
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }
})();