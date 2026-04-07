// Overview Page JavaScript

// Create animated confetti
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#ffffff', '#93c5fd', '#60a5fa'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.width = Math.random() * 4 + 2 + 'px';
        confetti.style.height = Math.random() * 15 + 8 + 'px';

        container.appendChild(confetti);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Create confetti animation
    createConfetti();

    // Add parallax effect to feature cards
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.03)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Handle back to home button with animation
    const backHomeBtn = document.getElementById('backHomeBtn');

    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Add fade out effect
            document.querySelector('.overview-page').classList.add('fade-out');

            // Navigate after animation (0.1s = 100ms)
                setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        });
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
});

// Add floating animation to cards on scroll
window.addEventListener('scroll', function() {
    const cards = document.querySelectorAll('.feature-card');
    const scrollPosition = window.pageYOffset;

    cards.forEach((card, index) => {
        const cardPosition = card.offsetTop;
        const cardHeight = card.offsetHeight;

        if (scrollPosition + window.innerHeight > cardPosition + cardHeight / 3) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Console message
console.log('%cKIOSORA Overview', 'color: #fbbf24; font-size: 24px; font-weight: bold;');
console.log('%cStudent Portal System - Overview Page', 'color: #6b7280; font-size: 14px;');
console.log('%cAll rights reserved © 2026', 'color: #6b7280; font-size: 12px;');
