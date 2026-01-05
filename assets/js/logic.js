function applyTheme() {
    let saved = localStorage.getItem('cbt_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

function toggleTheme() {
    let current = localStorage.getItem('cbt_theme') || 'light';
    let next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('cbt_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    updateThemeIcon();
}

function updateThemeIcon() {
    let btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    let current = localStorage.getItem('cbt_theme') || 'light';
    btn.innerHTML = current === 'light' ? '🌙' : '☀️';
}

applyTheme();

function login(name, email) {
    let user = {
        name: name,
        email: email,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('cbt_user', JSON.stringify(user));
    return user;
}

function getUser() {
    let userStr = localStorage.getItem('cbt_user');
    if (userStr) {
        return JSON.parse(userStr);
    } else {
        return null;
    }
}

async function logout() {
    const result = await Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to log out?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary-color)',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout'
    });

    if (result.isConfirmed) {
        localStorage.removeItem('cbt_user');
        window.location.href = 'index.html';
    }
}

function checkAuth() {
    if (!getUser() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

function init() {
    applyTheme();
    let loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let name = document.getElementById('username').value;
            let email = document.getElementById('email').value;

            if (name && email) {
                login(name, email);
                window.location.href = 'dashboard.html';
            }
        });
    }

    let toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

document.addEventListener('DOMContentLoaded', init);
