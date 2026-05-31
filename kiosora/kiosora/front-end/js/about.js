// About Page JavaScript
// FAQ Accordion, Search, and Interactive Features

document.addEventListener('DOMContentLoaded', function() {
    // ===== FAQ Accordion Functionality =====
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Check if current item is active
            const isActive = item.classList.contains('active');

            // Close all FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item (open if it wasn't active)
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ===== Search Functionality =====
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn && searchInput) {
        // Search on button click
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
            } else {
                clearSearch();
            }
        });

        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    performSearch(searchTerm);
                } else {
                    clearSearch();
                }
            }
        });

        // Clear search when input is emptied
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                clearSearch();
            }
        });
    }

    // Search function - highlights matching text
    function performSearch(term) {
        const content = document.querySelector('.about-content');
        if (!content) return;

        // Get all text nodes
        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        // Remove previous highlights
        clearSearch();

        let matches = 0;
        const nodesToReplace = [];

        // Find all text nodes containing the search term
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const parentElement = node.parentElement;

            // Skip script tags and already highlighted content
            if (parentElement.tagName === 'SCRIPT' ||
                parentElement.tagName === 'STYLE' ||
                parentElement.classList.contains('highlight')) {
                continue;
            }

            const text = node.textContent;
            const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');

            if (regex.test(text)) {
                nodesToReplace.push({ node, text, regex });
                matches++;
            }
        }

        // Replace text nodes with highlighted version
        nodesToReplace.forEach(({ node, text, regex }) => {
            const span = document.createElement('span');
            span.innerHTML = text.replace(regex, '<mark class="highlight">$1</mark>');
            node.parentNode.replaceChild(span, node);
        });

        // Scroll to first match
        if (matches > 0) {
            const firstMatch = document.querySelector('.highlight');
            if (firstMatch) {
                firstMatch.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }

            // Show result count (optional)
            console.log(`Found ${matches} matches for "${term}"`);
        } else {
            alert(`No results found for "${term}"`);
        }
    }

    // Clear search highlights
    function clearSearch() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(mark => {
            const parent = mark.parentElement;
            const text = mark.textContent;
            const textNode = document.createTextNode(text);

            // If parent is a span we created, unwrap it
            if (parent.tagName === 'SPAN' && parent.childNodes.length > 0) {
                const fragment = document.createDocumentFragment();
                Array.from(parent.childNodes).forEach(node => {
                    if (node.classList && node.classList.contains('highlight')) {
                        fragment.appendChild(document.createTextNode(node.textContent));
                    } else {
                        fragment.appendChild(node.cloneNode(true));
                    }
                });
                parent.parentNode.replaceChild(fragment, parent);
            }
        });
    }

    // Escape special regex characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ===== Scroll to Top Button =====
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
    `;
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollToTopBtn);

    // Show/hide scroll to top button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top on click
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ===== Scroll Animation Observer =====
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Optionally unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Animate team members on scroll
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach((member, index) => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(member);
    });

    // Animate FAQ items on scroll
    const faqItemsToAnimate = document.querySelectorAll('.faq-item');
    faqItemsToAnimate.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(item);
    });

    // ===== Smooth Scroll for Internal Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== Add Loading Animation =====
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Log initialization
    console.log('About page initialized successfully!');
    console.log(`- ${faqItems.length} FAQ items loaded`);
    console.log(`- ${teamMembers.length} team members loaded`);
});
