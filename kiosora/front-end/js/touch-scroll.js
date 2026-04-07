// ============= KIOSORA TOUCH SCROLL =============

(function () {

    // Force override any CSS blocking scroll
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            overflow: auto !important;
            height: auto !important;
            min-height: 100% !important;
            touch-action: pan-y pan-x !important;
            -webkit-overflow-scrolling: touch !important;
        }

        /* Fix page containers that block scrolling */
        .home-page,
        .about-page,
        .login-page,
        .dashboard-page,
        .overview-page,
        .admin-dashboard,
        .login-selection-page {
            overflow: visible !important;
            min-height: 100vh;
            height: auto !important;
        }

        /* Fix fixed backgrounds - use attachment instead of fixed position */
        .about-page::before,
        .about-page::after {
            position: fixed !important;
        }

        * {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            -webkit-touch-callout: none !important;
        }

        input, textarea, select, [contenteditable] {
            -webkit-user-select: text !important;
            user-select: text !important;
        }

        a, button, label {
            -webkit-tap-highlight-color: transparent !important;
        }
    `;
    document.head.appendChild(style);

    // Force inline styles on html/body
    function forceScrollable() {
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
        document.documentElement.style.setProperty('height', 'auto', 'important');
        document.documentElement.style.setProperty('touch-action', 'pan-y', 'important');
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.body.style.setProperty('height', 'auto', 'important');
        document.body.style.setProperty('touch-action', 'pan-y', 'important');

        // Fix any page wrapper divs
        const pageWrappers = document.querySelectorAll(
            '.home-page, .about-page, .login-page, .dashboard-page, .overview-page, .admin-dashboard, .login-selection-page'
        );
        pageWrappers.forEach(el => {
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('height', 'auto', 'important');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceScrollable);
    } else {
        forceScrollable();
    }

    // ---- Touch scroll ----
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let startScrollY = 0;
    let startScrollX = 0;
    let tracking = false;
    let moved = false;
    let animFrame = null;
    let velX = 0;
    let velY = 0;
    let scrollEl = null;

    function getScrollable(el) {
        let node = el;
        while (node && node !== document.documentElement) {
            if (node.id === 'vk-keyboard' || node.id === 'vk-overlay') return null;
            const s = window.getComputedStyle(node);
            const oy = s.overflowY;
            const ox = s.overflowX;
            if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 2) return node;
            if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth > node.clientWidth + 2) return node;
            node = node.parentElement;
        }
        return null;
    }

    document.addEventListener('touchstart', function(e) {
        if (e.target.closest && (e.target.closest('#vk-keyboard') || e.target.closest('#vk-overlay'))) return;
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

        const t = e.touches[0];
        startX = lastX = t.clientX;
        startY = lastY = t.clientY;
        tracking = true;
        moved = false;
        velX = 0;
        velY = 0;

        scrollEl = getScrollable(e.target);
        startScrollX = scrollEl ? scrollEl.scrollLeft : window.scrollX;
        startScrollY = scrollEl ? scrollEl.scrollTop : window.scrollY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!tracking) return;
        if (e.target.closest && (e.target.closest('#vk-keyboard') || e.target.closest('#vk-overlay'))) return;

        const t = e.touches[0];
        const dx = startX - t.clientX;
        const dy = startY - t.clientY;

        velX = lastX - t.clientX;
        velY = lastY - t.clientY;
        lastX = t.clientX;
        lastY = t.clientY;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;

        if (moved) {
            if (scrollEl) {
                scrollEl.scrollLeft = startScrollX + dx;
                scrollEl.scrollTop = startScrollY + dy;
            } else {
                window.scrollTo(startScrollX + dx, startScrollY + dy);
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', function() {
        if (!tracking || !moved) { tracking = false; return; }
        tracking = false;

        let vx = velX;
        let vy = velY;
        let curX = scrollEl ? scrollEl.scrollLeft : window.scrollX;
        let curY = scrollEl ? scrollEl.scrollTop : window.scrollY;

        function momentum() {
            if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) return;
            vx *= 0.95;
            vy *= 0.95;
            curX += vx;
            curY += vy;
            if (scrollEl) {
                scrollEl.scrollLeft = curX;
                scrollEl.scrollTop = curY;
            } else {
                window.scrollTo(curX, curY);
            }
            animFrame = requestAnimationFrame(momentum);
        }
        animFrame = requestAnimationFrame(momentum);
    }, { passive: true });

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());

})();