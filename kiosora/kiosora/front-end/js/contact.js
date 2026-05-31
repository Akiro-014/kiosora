// Contact Us Panel — Siembre High School Portal

function openContactPanel(e) {
    if (e) e.preventDefault();
    document.getElementById('contactOverlay').classList.add('open');
    document.getElementById('contactPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeContactPanel() {
    document.getElementById('contactOverlay').classList.remove('open');
    document.getElementById('contactPanel').classList.remove('open');
    document.body.style.overflow = '';
}

// Close on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeContactPanel();
});

// Expose globally so index.html inline onclick works
window.openContactPanel  = openContactPanel;
window.closeContactPanel = closeContactPanel;