import { getUser, logout, checkAuth, setupStatusMonitoring } from './logic.js';
import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import { getPublicQuizzes, getQuizByAccessCode, getSubmissionsByUser } from './firebase-db.js';
import { showError, showSuccess } from './ui-helpers.js';

// ==================== GLOBAL STATE ====================

let currentUserId = null;

// ==================== AUTH CHECK ====================

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Start monitoring status in real-time
    setupStatusMonitoring(user);

    // Verify this is a student (not admin)
    const profile = await getUserProfile(user.uid);

    // Global block for disabled users
    if (profile && profile.disabled) {
        const { signOutUser } = await import('./firebase-auth.js');
        await signOutUser();
        window.location.href = 'index.html';
        return;
    }

    if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
        // Admins should be on admin.html
        window.location.href = 'admin.html';
        return;
    }

    currentUserId = user.uid;

    const displayName = profile?.displayName || '';
    const displayEmail = profile?.email || user.email || '';
    const firstName = displayName.split(' ')[0] || 'User';
    const initial = (displayName || 'U').charAt(0).toUpperCase();

    // Set page-level user info directly — works regardless of nav-handler.js load order
    const welcomeMsgEl = document.getElementById('welcomeMsg');
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    if (welcomeMsgEl) welcomeMsgEl.textContent = `Welcome back, ${firstName}!`;
    if (userNameEl) userNameEl.textContent = displayName || 'User';
    if (userEmailEl) userEmailEl.textContent = displayEmail;
    if (userAvatarEl) userAvatarEl.textContent = initial;

    // Also update the nav dropdown profile if nav-handler has already initialised
    if (typeof window.updateNavProfile === 'function') {
        window.updateNavProfile(displayName || 'User', displayEmail);
    } else {
        // Nav handler may not be ready yet — update the nav elements directly as a fallback
        const navInitialEl = document.getElementById('navAvatarInitial');
        const navDropdownAvatarEl = document.getElementById('navDropdownAvatar');
        const navDropdownNameEl = document.getElementById('navDropdownName');
        const navDropdownEmailEl = document.getElementById('navDropdownEmail');
        const mobileAvatarEl = document.getElementById('mobileMenuAvatar');
        const mobileNameEl = document.getElementById('mobileMenuName');
        const mobileEmailEl = document.getElementById('mobileMenuEmail');
        if (navInitialEl) navInitialEl.textContent = initial;
        if (navDropdownAvatarEl) navDropdownAvatarEl.textContent = initial;
        if (navDropdownNameEl) navDropdownNameEl.textContent = displayName || 'User';
        if (navDropdownEmailEl) navDropdownEmailEl.textContent = displayEmail;
        if (mobileAvatarEl) mobileAvatarEl.textContent = initial;
        if (mobileNameEl) mobileNameEl.textContent = displayName || 'User';
        if (mobileEmailEl) mobileEmailEl.textContent = displayEmail;
    }

    // Load quizzes and history
    await loadQuizzes();
    await loadHistory();
});

// Load logic to handle side-effects like theme and service worker
import './logic.js';

// Make logout available globally
window.logout = (await import('./logic.js')).logout;

// ==================== SKELETON LOADERS ====================

const initialHistorySkeleton = `
    <div class="card skeleton-card" style="margin-bottom:0.75rem;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
    </div>
`.repeat(3);

const initialQuizSkeleton = `
    <div class="card skeleton-card" style="display: flex; flex-direction: column;">
        <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%; margin-bottom: 1rem;"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text" style="height: 3rem; margin-bottom: 1.5rem;"></div>
        <div class="skeleton" style="width: 40%; height: 2rem; margin-top: auto;"></div>
    </div>
`.repeat(4);

// ==================== LOADING FUNCTIONS ====================

async function loadQuizzes() {
    const grid = document.getElementById('quizGrid');
    if (!grid) return;

    grid.innerHTML = initialQuizSkeleton;

    try {
        const publicQuizzes = await getPublicQuizzes();
        const defaultQuizzes = typeof myData !== 'undefined' ? myData : [];
        const allQuizzes = [...defaultQuizzes, ...publicQuizzes];

        if (allQuizzes.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted);">No quizzes available yet.</p>';
            return;
        }

        grid.innerHTML = allQuizzes.map(q => `
            <div class="card quiz-card fade-in">
                <div class="quiz-icon">📝</div>
                <h3>${q.title}</h3>
                <p>${q.description}</p>
                <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${q.duration} mins | ${q.questions.length} Qs</span>
                    <a href="quiz.html?id=${q.id}${q.createdBy ? '&source=firestore' : ''}" class="btn btn-primary">Start Quiz</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading quizzes:', error);
        grid.innerHTML = "<p style='color: var(--text-muted);'>Error loading quizzes.</p>";
    }
}

async function loadHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    list.innerHTML = initialHistorySkeleton;

    try {
        const historyData = await getSubmissionsByUser(currentUserId);

        if (historyData.length === 0) {
            list.innerHTML = "<p style='color: var(--text-muted); padding: 1rem;'>No recent activity. Start a quiz to see your history!</p>";
            return;
        }

        list.innerHTML = historyData.map(h => {
            const date = h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp);
            const dateStr = date.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <div class="history-item card fade-in">
                    <div>
                        <strong>${h.quizTitle}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} | Score: ${h.score}/${h.total}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <div class="percentage-badge ${h.percentage >= 50 ? 'pass' : 'fail'}">${h.percentage}%</div>
                        <a href="result.html?id=${h.id}" class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: var(--bg-color); color: var(--text-muted);">View</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        list.innerHTML = "<p style='color: var(--text-muted);'>Error loading history.</p>";
    }
}

// ==================== ACTIONS ====================

window.joinPrivateQuiz = async function () {
    const codeInput = document.getElementById('quizCodeInput');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        Swal.fire('Error', 'Please enter a quiz code', 'error');
        return;
    }

    try {
        const quiz = await getQuizByAccessCode(code);

        if (quiz) {
            window.location.href = `quiz.html?id=${quiz.id}&source=firestore`;
        } else {
            showError({ message: 'No quiz found with that code. Please check and try again.' }, 'Invalid Code');
        }
    } catch (error) {
        console.error('Error joining quiz:', error);
        showError(error, 'Join Failed');
    }
};

window.clearHistory = async function () {
    Swal.fire({
        title: 'Note',
        text: 'History is stored in your account and cannot be cleared. This ensures academic integrity.',
        icon: 'info'
    });
};

// Profile actions are now handled by nav-handler.js

