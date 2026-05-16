// Logic.js - Theme management and Firebase Authentication

import { signUp, signIn, signOutUser, getCurrentUser, getUserProfile, onAuthChange, isAdmin, monitorUserStatus } from './firebase-auth.js';
import { showSuccess, showError, confirmAction } from './ui-helpers.js';
import { clearCache } from './firebase-db.js';

// ==================== THEME MANAGEMENT ====================

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

// Apply theme immediately
applyTheme();

// ==================== AUTH STATE ====================

let currentAuthMode = 'signin';
let selectedRole = 'student';
let userStatusUnsubscribe = null;
let isSigningUp = false; // Guard flag: prevents onAuthChange from racing against form signup handler

// Switch between Sign In and Sign Up modes
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

// Select role (student/admin)
window.selectRole = function (role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.role === role) {
            btn.classList.add('selected');
        }
    });
};

// ==================== AUTHENTICATION ====================

// Get user from Firestore (replaces localStorage getUser)
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

// Logout function
export async function logout() {
    const confirmed = await confirmAction('Logout?', 'Are you sure you want to log out?', 'Yes, logout');

    if (confirmed) {
        clearCache();
        await signOutUser();
        window.location.href = 'index.html';
    }
}

// Make logout available globally
window.logout = logout;

// Monitor user status in real-time
export function setupStatusMonitoring(user) {
    if (!user || userStatusUnsubscribe) return;

    userStatusUnsubscribe = monitorUserStatus(user.uid, async (profile) => {
        if (profile && profile.disabled) {
            if (userStatusUnsubscribe) {
                userStatusUnsubscribe();
                userStatusUnsubscribe = null;
            }
            await signOutUser();
            window.location.href = 'index.html';
        }
    });
}

// Check if user is authenticated (for protected pages)
export function checkAuth() {
    onAuthChange(async (user) => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');

        if (!user) {
            if (!isLoginPage) {
                // Not logged in and not on login page - redirect to login
                if (userStatusUnsubscribe) {
                    userStatusUnsubscribe();
                    userStatusUnsubscribe = null;
                }
                window.location.href = 'index.html';
            }
            return;
        }

        // Start monitoring status
        setupStatusMonitoring(user);

        if (isLoginPage) {
            // Logged in but on login page - redirect to appropriate dashboard
            const profile = await getUserProfile(user.uid);

            // Quick check before redirect
            if (profile && profile.disabled) {
                if (userStatusUnsubscribe) {
                    userStatusUnsubscribe();
                    userStatusUnsubscribe = null;
                }
                await signOutUser();
                return;
            }

            if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }
    });
}

// ==================== INITIALIZATION ====================

function init() {
    applyTheme();

    // Theme toggle button
    // Only add listener here for simple pages (like index.html) that don't use nav-handler.js.
    // Pages with a full nav (dashboard, admin, result, leaderboard) have themeToggleBtnMobile
    // and nav-handler.js already registers the click handler for BOTH buttons via syncTheme.
    // Adding a second listener here causes a double-toggle that cancels itself out on desktop.
    let toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn && !document.getElementById('themeToggleBtnMobile')) {
        toggleBtn.addEventListener('click', toggleTheme);
    }

    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    // Login form handler
    let loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = currentAuthMode === 'signup' ? 'Creating Account...' : 'Signing In...';

            try {
                if (currentAuthMode === 'signup') {
                    const displayName = document.getElementById('username').value;

                    if (!displayName) {
                        throw new Error('Please enter your full name');
                    }

                    // Set guard BEFORE signUp so onAuthChange doesn't race and redirect wrong page
                    isSigningUp = true;

                    await signUp(email, password, displayName, selectedRole);
                    await showSuccess('Account Created!', 'Welcome to AllianzQuiz!');

                    // Redirect based on role (isSigningUp guard prevents onAuthChange from interfering)
                    if (selectedRole === 'admin' || selectedRole === 'teacher') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }

                } else {
                    await signIn(email, password);

                    // Get user profile to determine redirect
                    const user = getCurrentUser();
                    const profile = await getUserProfile(user.uid);

                    // Check if user is disabled
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
                isSigningUp = false; // Reset guard on failure so login page redirect still works
                showError(error, currentAuthMode === 'signup' ? 'Signup Failed' : 'Signin Failed');

                submitBtn.disabled = false;
                submitBtn.textContent = currentAuthMode === 'signup' ? 'Create Account' : 'Sign In';
            }
        });
    }

    // Check auth state for login page redirect
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');

    if (isLoginPage) {
        // On login page, check if already logged in
        onAuthChange(async (user) => {
            // If the form submit handler is mid-signup, skip this redirect to avoid race condition
            if (isSigningUp) return;

            if (user) {
                const profile = await getUserProfile(user.uid);

                // Check if user is disabled
                if (profile && profile.disabled) {
                    await signOutUser();
                    return; // Stays on login page
                }

                if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
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
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg);
                    // Force update check
                    reg.update();
                })
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }
}

// Export for other modules
export { applyTheme, toggleTheme };
