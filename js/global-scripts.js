/* ========================================= */
/* global-scripts.js - Hamburger Menu Toggle */
/* ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            // Toggle the 'active' class on the icon (changes to X)
            hamburger.classList.toggle('active');
            // Toggle the 'open' class on the menu (slides in/out)
            mobileMenu.classList.toggle('open');
            
            // Optional: Prevent scrolling when the menu is open
            document.body.classList.toggle('no-scroll');
        });
        
        // Close menu if a link is clicked (useful for single-page scrolling or navigation)
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
                document.body.classList.remove('no-scroll');
            });
        });
    }
});