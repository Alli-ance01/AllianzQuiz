// Leaderboard Logic
import { onAuthChange } from './firebase-auth.js';
import { getPublicQuizzes, getTopSubmissionsByQuiz } from './firebase-db.js';
import { setupStatusMonitoring, applyTheme, toggleTheme } from './logic.js';

let publicQuizzes = [];

// Initialize Theme
applyTheme();
document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    setupStatusMonitoring(user);
    await initLeaderboard();
});

async function initLeaderboard() {
    const selector = document.getElementById('quizSelector');
    selector.addEventListener('change', loadLeaderboardData);

    try {
        const dbQuizzes = await getPublicQuizzes();
        // Merge legacy quizzes (myData from data.js) with Firestore quizzes
        publicQuizzes = typeof myData !== 'undefined' ? [...myData, ...dbQuizzes] : dbQuizzes;
        
        if (publicQuizzes.length > 0) {
            publicQuizzes.forEach(q => {
                const option = document.createElement('option');
                option.value = q.id;
                option.textContent = q.title;
                selector.appendChild(option);
            });
            
            // Auto-select first quiz
            selector.value = publicQuizzes[0].id;
            loadLeaderboardData();
        } else {
            document.getElementById('leaderboardBody').innerHTML = `
                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">No quizzes available yet.</td></tr>
            `;
        }
    } catch (error) {
        console.error("Error loading quizzes:", error);
    }
}

async function loadLeaderboardData() {
    const quizId = document.getElementById('quizSelector').value;
    const tbody = document.getElementById('leaderboardBody');
    
    if (!quizId) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">Select a quiz to view the leaderboard.</td></tr>`;
        return;
    }

    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 3rem;">Loading rankings...</td></tr>`;

    try {
        const topSubmissions = await getTopSubmissionsByQuiz(quizId, 10);
        
        if (topSubmissions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">No attempts for this quiz yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = topSubmissions.map((sub, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            return `
                <tr class="fade-in">
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td style="font-weight: 500;">${sub.userName || 'Anonymous'}</td>
                    <td>
                        <span style="font-weight: 700; color: var(--primary-color);">${sub.score}/${sub.total}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.25rem;">(${sub.percentage}%)</span>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">⏱️ ${sub.timeTaken || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error fetching top submissions:", error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 3rem;">Failed to load leaderboard data.</td></tr>`;
    }
}
