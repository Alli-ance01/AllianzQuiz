// Profile Actions (Available globally)
window.editProfile = async function () {
    const currentName = document.getElementById('navDropdownName')?.textContent || 'User';
    
    // Use global Swal if available, else try to find it
    const MySwal = window.Swal || (await import('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.js')).default;
    
    const { value: newName } = await MySwal.fire({
        title: 'Edit Profile',
        input: 'text',
        inputLabel: 'Display Name',
        inputValue: currentName,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) return 'You need to write something!';
        }
    });

    if (newName && newName !== currentName) {
        try {
            const { updateUserProfile } = await import('./firebase-auth.js');
            await updateUserProfile(newName);
            
            // Update everything immediately
            const email = document.getElementById('navDropdownEmail')?.textContent || '';
            if (typeof window.updateNavProfile === 'function') {
                window.updateNavProfile(newName, email);
            }
            
            MySwal.fire({ icon: 'success', title: 'Success', text: 'Profile updated successfully!', timer: 1500, showConfirmButton: false });
        } catch (error) {
            console.error('Error updating profile:', error);
            MySwal.fire('Error', 'Update Failed', 'error');
        }
    }
};

window.changePassword = async function () {
    const MySwal = window.Swal || (await import('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.js')).default;
    
    const { value: currentPassword } = await MySwal.fire({
        title: 'Change Password',
        text: 'Enter your current password to continue',
        input: 'password',
        inputPlaceholder: 'Current password',
        inputAttributes: { autocomplete: 'current-password' },
        showCancelButton: true,
        confirmButtonText: 'Next →',
        inputValidator: (v) => !v && 'Please enter your current password'
    });
    if (!currentPassword) return;

    const { value: formValues } = await MySwal.fire({
        title: 'New Password',
        html:
            '<input id="swal-new-pass" type="password" class="swal2-input" placeholder="New (min 6 chars)" autocomplete="new-password">' +
            '<input id="swal-confirm-pass" type="password" class="swal2-input" placeholder="Confirm" autocomplete="new-password">',
        showCancelButton: true,
        confirmButtonText: 'Change Password',
        focusConfirm: false,
        preConfirm: () => {
            const np = document.getElementById('swal-new-pass').value;
            const cp = document.getElementById('swal-confirm-pass').value;
            if (!np || np.length < 6) { MySwal.showValidationMessage('Password too short'); return false; }
            if (np !== cp) { MySwal.showValidationMessage('Passwords do not match'); return false; }
            return { newPassword: np };
        }
    });
    if (!formValues) return;

    try {
        const { changeUserPassword } = await import('./firebase-auth.js');
        await changeUserPassword(currentPassword, formValues.newPassword);
        MySwal.fire({ icon: 'success', title: 'Success', text: 'Password updated.', timer: 2000, showConfirmButton: false });
    } catch (error) {
        console.error('Password change error:', error);
        MySwal.fire({ icon: 'error', title: 'Error', text: 'Incorrect current password or update failed.' });
    }
};

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

        // Sync other page elements if they exist
        const pageName = document.getElementById('userName');
        const pageAvatar = document.getElementById('userAvatar');
        const welcomeMsg = document.getElementById('welcomeMsg');

        if (pageName) pageName.textContent = name || 'User';
        if (pageAvatar) pageAvatar.textContent = initial;
        if (welcomeMsg) {
            // Handle both "Welcome, Name!" (Admin) and "Welcome back, Name!" (Student)
            if (welcomeMsg.textContent.includes('Welcome back')) {
                welcomeMsg.textContent = "Welcome back, " + (name || 'User').split(' ')[0] + "!";
            } else if (welcomeMsg.textContent.includes('Welcome')) {
                welcomeMsg.textContent = "Welcome, " + (name || 'User') + "!";
            }
        }
    };
}

