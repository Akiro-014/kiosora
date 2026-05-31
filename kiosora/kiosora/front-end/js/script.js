// Main JavaScript file for Student Portal System

// Add smooth animations on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements
    const animatedElements = document.querySelectorAll('.hero-content, .form-container, .dashboard-content');
    animatedElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Format Date Helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Console message for developers
console.log('%cStudent Portal System', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
console.log('%cDeveloped for Siembre High School', 'color: #6b7280; font-size: 14px;');

// ============= SECRET EXIT (5 taps on school logo) =============
(function () {
    let tapCount = 0;
    let tapTimer = null;
    const REQUIRED_TAPS = 5;
    const TAP_WINDOW_MS = 6000; // must complete 5 taps within 6 seconds

    function resetTaps() {
        tapCount = 0;
        clearTimeout(tapTimer);
        tapTimer = null;
    }

    function handleSecretTap() {
        tapCount++;

        clearTimeout(tapTimer);
        tapTimer = setTimeout(resetTaps, TAP_WINDOW_MS);

        if (tapCount >= REQUIRED_TAPS) {
            resetTaps();
            // Primary: works in Chromium kiosk with --app flag
            window.close();
            // Fallback
            setTimeout(() => {
                window.open('', '_self').close();
            }, 100);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const secretBtn = document.getElementById('secretExitBtn');
        if (!secretBtn) return;

        // Touch for Raspberry Pi touchscreen
        secretBtn.addEventListener('touchstart', function (e) {
            e.stopPropagation();
            handleSecretTap();
        }, { passive: true });

        // Mouse fallback for testing on desktop
        secretBtn.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            handleSecretTap();
        });
    });
})();