// Script.js - Student Dashboard functionality

import { getUser, logout, checkAuth } from './logic.js';
import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import { getPublicQuizzes, getQuizByAccessCode, getSubmissionsByUser } from './firebase-db.js';

// ==================== GLOBAL STATE ====================

let currentUserId = null;

// ==================== AUTH CHECK ====================

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Verify this is a student (not admin)
    const profile = await getUserProfile(user.uid);
    if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
        // Admins should be on admin.html
        window.location.href = 'admin.html';
        return;
    }

    currentUserId = user.uid;

    // Load user info
    document.getElementById('welcomeMsg').textContent = "Welcome back, " + (profile?.displayName || 'User').split(' ')[0] + "!";
    document.getElementById('userName').textContent = profile?.displayName || 'User';
    document.getElementById('userEmail').textContent = profile?.email || user.email;
    document.getElementById('userAvatar').textContent = (profile?.displayName || 'U').charAt(0).toUpperCase();

    // Load quizzes and history
    await loadQuizzes();
    await loadHistory();
});

// Make logout available globally
window.logout = logout;

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
            Swal.fire('Invalid Code', 'No quiz found with that code. Please check and try again.', 'error');
        }
    } catch (error) {
        console.error('Error joining quiz:', error);
        Swal.fire('Error', 'Failed to find quiz. Please try again.', 'error');
    }
};

window.clearHistory = async function () {
    Swal.fire({
        title: 'Note',
        text: 'History is stored in your account and cannot be cleared. This ensures academic integrity.',
        icon: 'info'
    });
};
