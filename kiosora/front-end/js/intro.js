// Intro Page JavaScript

// Fade in effect for KIOSORA text (letter by letter)
function fadeInLetters() {
    const text = "KIOSORA";
    const element = document.getElementById('introText');
    let index = 0;

    function showLetter() {
        if (index < text.length) {
            const span = document.createElement('span');
            span.textContent = text.charAt(index);
            span.style.animationDelay = `${index * 0.15}s`;
            element.appendChild(span);
            index++;
            setTimeout(showLetter, 150); // 150ms delay between each letter
        }
    }

    // Start fade in after logo animation completes (1.5 seconds)
    setTimeout(showLetter, 1500);
}

// Initialize when page loads
window.addEventListener('load', function() {
    const introScreen = document.querySelector('.intro-screen');
    
    // Start fade in effect
    fadeInLetters();

    // Fade out and redirect after 3.5 seconds
    setTimeout(function() {
        introScreen.classList.add('fade-out');
        
        // Redirect after fade out animation completes
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 100); // 800ms for fade out animation
    }, 3500);
});
