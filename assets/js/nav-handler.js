// nav-handler.js - Shared logic for premium navigation

export function initNavigation() {
    // ---- Hamburger Menu ----
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = mobileMenu.classList.toggle('open');
            this.classList.toggle('open', isOpen);
        });
    }

    window.closeMobileMenu = function () {
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (hamburgerBtn) hamburgerBtn.classList.remove('open');
    };

    // ---- Profile Dropdown ----
    const navAvatarBtn = document.getElementById('navAvatarBtn');
    const navDropdown = document.getElementById('navDropdown');
    
    if (navAvatarBtn && navDropdown) {
        navAvatarBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navDropdown.classList.toggle('open');
        });
    }

    window.closeNavDropdown = function () {
        if (navDropdown) navDropdown.classList.remove('open');
    };

    // ---- Outside Click Handler ----
    document.addEventListener('click', function (e) {
        if (mobileMenu && hamburgerBtn) {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                window.closeMobileMenu();
            }
        }
        if (navDropdown && navAvatarBtn) {
            if (!navDropdown.contains(e.target) && !navAvatarBtn.contains(e.target)) {
                window.closeNavDropdown();
            }
        }
    });

    // ---- Theme Toggle Sync ----
    const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    const syncTheme = () => {
        let current = localStorage.getItem('cbt_theme') || 'light';
        let next = current === 'light' ? 'dark' : 'light';
        localStorage.setItem('cbt_theme', next);
        document.documentElement.setAttribute('data-theme', next);
        const icon = next === 'dark' ? '☀️' : '🌙';
        
        if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = icon;
        if (themeToggleBtn) themeToggleBtn.innerHTML = icon;
    };

    if (themeToggleBtnMobile) themeToggleBtnMobile.addEventListener('click', syncTheme);
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', syncTheme);

    // ---- Update Nav Profile Info ----
    window.updateNavProfile = function (name, email) {
        const initial = (name || 'U').charAt(0).toUpperCase();
        
        // Desktop elements
        const initialEl = document.getElementById('navAvatarInitial');
        const dropAvatarEl = document.getElementById('navDropdownAvatar');
        const dropNameEl = document.getElementById('navDropdownName');
        const dropEmailEl = document.getElementById('navDropdownEmail');
        
        if (initialEl) initialEl.textContent = initial;
        if (dropAvatarEl) dropAvatarEl.textContent = initial;
        if (dropNameEl) dropNameEl.textContent = name || 'User';
        if (dropEmailEl) dropEmailEl.textContent = email || '';

        // Mobile elements
        const mobAvatarEl = document.getElementById('mobileMenuAvatar');
        const mobNameEl = document.getElementById('mobileMenuName');
        const mobEmailEl = document.getElementById('mobileMenuEmail');

        if (mobAvatarEl) mobAvatarEl.textContent = initial;
        if (mobNameEl) mobNameEl.textContent = name || 'User';
        if (mobEmailEl) mobEmailEl.textContent = email || '';
    };
}
