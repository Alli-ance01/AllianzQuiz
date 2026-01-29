import { signUp, signIn, signOutUser, getCurrentUser, getUserProfile, onAuthChange, isAdmin, monitorUserStatus } from './firebase-auth.js';
import { showSuccess, showError, confirmAction } from './ui-helpers.js';
import { clearCache } from './firebase-db.js';

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


let currentAuthMode = 'signin';
let selectedRole = 'student';

window.switchAuthMode = function (mode) {
    currentAuthMode = mode;

    const signInTab = document.getElementById('signInTab');
    const signUpTab = document.getElementById('signUpTab');
    const nameGroup = document.getElementById('nameGroup');
    const roleGroup = document.getElementById('roleGroup');
    const submitBtn = document.getElementById('submitBtn');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const usernameInput = document.getElementById('username');

    if (mode === 'signup') {
        signInTab.classList.remove('active');
        signUpTab.classList.add('active');
        nameGroup.style.display = 'block';
        roleGroup.style.display = 'block';
        submitBtn.textContent = 'Create Account';
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Join AllianzQuiz today';
        usernameInput.required = true;
    } else {
        signInTab.classList.add('active');
        signUpTab.classList.remove('active');
        nameGroup.style.display = 'none';
        roleGroup.style.display = 'none';
        submitBtn.textContent = 'Sign In';
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Sign in to continue';
        usernameInput.required = false;
    }
};

window.selectRole = function (role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.role === role) {
            btn.classList.add('selected');
        }
    });
};

export async function getUser() {
    const user = getCurrentUser();
    if (!user) return null;

    const profile = await getUserProfile(user.uid);
    if (profile) {
        return {
            uid: user.uid,
            name: profile.displayName,
            email: profile.email,
            role: profile.role
        };
    }
    return null;
}

export async function logout() {
    const confirmed = await confirmAction('Logout?', 'Are you sure you want to log out?', 'Yes, logout');

    if (confirmed) {
        clearCache();
        await signOutUser();
        window.location.href = 'index.html';
    }
}

window.logout = logout;

export function checkAuth() {
    onAuthChange(async (user) => {
        const path = window.location.pathname;
        const isLoginPage = path.includes('index.html') || path.endsWith('/');
        const isAdminPage = path.includes('admin.html');
        const isDashboardPage = path.includes('dashboard.html');
        const isQuizPage = path.includes('quiz.html');

        if (!user) {
            if (!isLoginPage) window.location.href = 'index.html';
            return;
        }

        monitorUserStatus(user.uid, async (profile) => {
            if (!profile || profile.disabled) {
                await signOutUser();
                window.location.href = 'index.html';
                return;
            }

            const isAdminRole = profile.role === 'admin' || profile.role === 'teacher';

            if (isLoginPage) {
                window.location.href = isAdminRole ? 'admin.html' : 'dashboard.html';
            } else if (isAdminPage && !isAdminRole) {
                window.location.href = 'dashboard.html';
            } else if ((isDashboardPage || isQuizPage) && isAdminRole) {
                window.location.href = 'admin.html';
            }
        });
    });
}

function init() {
    applyTheme();
    checkAuth(); // Added centralized auth check

    let toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }

    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    let loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');

            submitBtn.disabled = true;
            submitBtn.textContent = currentAuthMode === 'signup' ? 'Creating Account...' : 'Signing In...';

            try {
                if (currentAuthMode === 'signup') {
                    const displayName = document.getElementById('username').value;

                    if (!displayName) {
                        throw new Error('Please enter your full name');
                    }

                    await signUp(email, password, displayName, selectedRole);
                    await showSuccess('Account Created!', 'Welcome to AllianzQuiz!');

                    if (selectedRole === 'admin' || selectedRole === 'teacher') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }

                } else {
                    await signIn(email, password);

                    const user = getCurrentUser();
                    const profile = await getUserProfile(user.uid);

                    if (profile && profile.disabled) {
                        await signOutUser();
                        throw new Error('Your account has been disabled. Please contact support.');
                    }

                    if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }

            } catch (error) {
                console.error('Auth error:', error);
                showError(error, currentAuthMode === 'signup' ? 'Signup Failed' : 'Signin Failed');

                submitBtn.disabled = false;
                submitBtn.textContent = currentAuthMode === 'signup' ? 'Create Account' : 'Sign In';
            }
        });
    }

    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');

    if (isLoginPage) {
        onAuthChange(async (user) => {
            if (user) {
                monitorUserStatus(user.uid, async (profile) => {
                    if (profile && profile.disabled) {
                        await signOutUser();
                        return;
                    }

                    if (profile) {
                        if (profile.role === 'admin' || profile.role === 'teacher') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    }
                });
            }
        });
    } else {
        onAuthChange(async (user) => {
            if (user) {
                monitorUserStatus(user.uid, async (profile) => {
                    if (profile && profile.disabled) {
                        await signOutUser();
                        window.location.href = 'index.html';
                    }
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        registerSW();
    });
} else {
    init();
    registerSW();
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }
}

export { applyTheme, toggleTheme };
