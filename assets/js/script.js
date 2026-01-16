// Script.js - Student Dashboard functionality

import { getUser, logout, checkAuth } from './logic.js';
import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import { getPublicQuizzes, getQuizByAccessCode, getSubmissionsByUser } from './firebase-db.js';

// Check auth on page load
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

// Load quizzes for student dashboard
async function loadQuizzes() {
    const quizGrid = document.getElementById('quizGrid');
    if (!quizGrid) return;

    try {
        // Get default quizzes from data.js (myData is a global from data.js)
        const defaultQuizzes = typeof myData !== 'undefined' ? myData : [];

        // Get public quizzes from Firestore
        const publicQuizzes = await getPublicQuizzes();

        // Combine them
        const allQuizzes = [...defaultQuizzes, ...publicQuizzes];

        if (allQuizzes.length === 0) {
            quizGrid.innerHTML = '<p style="color: var(--text-muted);">No quizzes available yet.</p>';
            return;
        }

        let html = "";
        for (let i = 0; i < allQuizzes.length; i++) {
            const quiz = allQuizzes[i];
            const isFirestore = quiz.createdBy !== undefined;
            const icon = quiz.id.startsWith('gk') ? '🌍' : quiz.id.startsWith('math') ? '🔢' : '📝';

            html += `
                <div class="quiz-card">
                    <div class="quiz-icon">${icon}</div>
                    <h3>${quiz.title}</h3>
                    <p style="color: grey; margin-bottom: 1rem; flex-grow: 1;">${quiz.description}</p>
                    <div class="quiz-meta">
                        <span>⏱️ ${quiz.duration} mins</span>
                        <span>❓ ${quiz.questions.length} Questions</span>
                    </div>
                    <div class="quiz-footer">
                        <button onclick="startQuiz('${quiz.id}', ${isFirestore})" class="btn btn-primary" style="width: 100%;">
                            Start Quiz
                        </button>
                    </div>
                </div>
            `;
        }
        quizGrid.innerHTML = html;

    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizGrid.innerHTML = '<p style="color: var(--text-muted);">Error loading quizzes.</p>';
    }
}

// Start a quiz
window.startQuiz = function (quizId, isFirestore = false) {
    const suffix = isFirestore ? '&source=firestore' : '';
    window.location.href = `quiz.html?id=${quizId}${suffix}`;
};

// Join a private quiz via code
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

// Load user's quiz history
async function loadHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    try {
        const user = getCurrentUser();
        if (!user) return;

        const history = await getSubmissionsByUser(user.uid);

        if (history.length === 0) {
            historyList.innerHTML = "<p style='color: var(--text-muted);'>No attempts yet. Take a quiz to see your history!</p>";
            return;
        }

        historyList.innerHTML = history.map(item => {
            const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
            const dateStr = date.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <div class="history-item">
                    <div class="history-info">
                        <strong style="color: var(--text-color);">${item.quizTitle}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr} ${item.timeTaken ? `| ⏱️ ${item.timeTaken}` : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="text-align: right;">
                            <span class="history-score">${item.score} / ${item.total}${item.pending > 0 ? ` <small>(${item.pending} pend.)</small>` : ''}</span>
                            <div class="history-percentage" style="display: inline-block; margin-left: 0.5rem;">${item.percentage}%</div>
                        </div>
                        <button onclick="viewResult('${item.id}')" class="btn" style="padding: 0.4rem; background: var(--secondary-bg); color: var(--secondary-text); border-radius: 8px;" title="View Result">
                            👁️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = "<p style='color: var(--text-muted);'>Error loading history.</p>";
    }
}

// View a specific result
window.viewResult = function (submissionId) {
    window.location.href = `result.html?id=${submissionId}`;
};

// Clear history (now just a message since data is in Firestore)
window.clearHistory = async function () {
    Swal.fire({
        title: 'Note',
        text: 'History is stored in your account and cannot be cleared. This ensures academic integrity.',
        icon: 'info'
    });
};
