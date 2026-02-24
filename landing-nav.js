/**
 * Shared Landing Navigation Logic for Flashly
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('landing-mobile-menu-toggle');
    const navModal = document.getElementById('mobile-nav-modal');

    if (!toggleBtn || !navModal) return;

    const toggleMenu = () => {
        const isActive = navModal.classList.toggle('active');
        toggleBtn.classList.toggle('active');

        // Change icon from hamburger to cross
        if (isActive) {
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-md">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            `;
            document.body.style.overflow = 'hidden';
        } else {
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-md">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            `;
            document.body.style.overflow = '';
        }
    };

    toggleBtn.addEventListener('click', toggleMenu);

    // Detect if we are on the main landing page
    const isMainPage =
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/index.html') ||
        window.location.pathname.endsWith('/flashly/') ||
        document.getElementById('auth-view') !== null; // Robust check for the main page section

    // Simple helper to get the path to index.html from subfolders
    const getRootPath = () => {
        if (isMainPage) return './index.html';
        return '../index.html';
    };

    // Special handling for auth buttons in the mobile menu
    const loginBtns = document.querySelectorAll('.btn-login-toggle, .mobile-login-btn');
    const signupBtns = document.querySelectorAll('.btn-signup-toggle, .mobile-signup-btn');

    loginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isMainPage) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = getRootPath() + '?auth=login';
            }
        });
    });

    signupBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isMainPage) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = getRootPath() + '?auth=signup';
            }
        });
    });

    // Close menu when clicking links (but NOT auth buttons)
    navModal.querySelectorAll('a, button').forEach(el => {
        // Skip auth buttons - they have their own handlers
        if (el.classList.contains('btn-login-toggle') ||
            el.classList.contains('mobile-login-btn') ||
            el.classList.contains('btn-signup-toggle') ||
            el.classList.contains('mobile-signup-btn')) {
            return;
        }

        el.addEventListener('click', () => {
            if (navModal.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // Handle scroll for nav highlight
    const nav = document.getElementById('lp-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }
});
