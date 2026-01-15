checkAuth();

let user = getUser();
if (user) {
    document.getElementById('welcomeMsg').textContent = "Welcome back, " + user.name.split(' ')[0] + "!";
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
}

let quizGrid = document.getElementById('quizGrid');

let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');
let allQuizzes = [...myData, ...customQuizzes];

if (allQuizzes && quizGrid) {
    let html = "";
    for (let i = 0; i < allQuizzes.length; i++) {
        let quiz = allQuizzes[i];
        html += `
            <div class="quiz-card">
                <div class="quiz-icon">${quiz.id.startsWith('gk') ? '🌍' : quiz.id.startsWith('math') ? '🔢' : '📝'}</div>
                <h3>${quiz.title}</h3>
                <p style="color: grey; margin-bottom: 1rem; flex-grow: 1;">${quiz.description}</p>
                <div class="quiz-meta">
                    <span>⏱️ ${quiz.duration} mins</span>
                    <span>❓ ${quiz.questions.length} Questions</span>
                </div>
                <div class="quiz-footer">
                    <button onclick="startQuiz('${quiz.id}')" class="btn btn-primary" style="width: 100%;">
                        Start Quiz
                    </button>
                </div>
            </div>
        `;
    }
    quizGrid.innerHTML = html;
}

function startQuiz(quizId) {
    window.location.href = 'quiz.html?id=' + quizId;
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    let history = JSON.parse(localStorage.getItem('cbt_score_history') || '[]');
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (history.length === 0) {
        historyList.innerHTML = "<p style='color: var(--text-muted);'>No attempts yet. Take a quiz to see your history!</p>";
        return;
    }

    historyList.innerHTML = history.map(item => {
        const date = new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `
            <div class="history-item">
                <div class="history-info">
                    <strong style="color: var(--text-color);">${item.quizTitle}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${date} ${item.timeTaken ? `| ⏱️ ${item.timeTaken}` : ''}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="text-align: right;">
                        <span class="history-score">${item.score} / ${item.total}${item.pending > 0 ? ` <small>(${item.pending} pend.)</small>` : ''}</span>
                        <div class="history-percentage" style="display: inline-block; margin-left: 0.5rem;">${item.percentage}%</div>
                    </div>
                    <button onclick="viewResult('${item.timestamp}')" class="btn" style="padding: 0.4rem; background: var(--secondary-bg); color: var(--secondary-text); border-radius: 8px;" title="Print Result">
                        🖨️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function viewResult(timestamp) {
    // Find the full submission details
    let allSubmissions = JSON.parse(localStorage.getItem('cbt_all_submissions') || '[]');
    let sub = allSubmissions.find(s => s.timestamp === timestamp);

    if (sub) {
        localStorage.setItem('cbt_last_result', JSON.stringify(sub));
        window.location.href = 'result.html';
    } else {
        // If not in allSubmissions, try to reconstruct basic info from history (though details will be missing)
        let history = JSON.parse(localStorage.getItem('cbt_score_history') || '[]');
        let histItem = history.find(h => h.timestamp === timestamp);
        if (histItem) {
            // Minimal reconstruction
            let mockSub = {
                ...histItem,
                details: [] // We don't have details in history
            };
            localStorage.setItem('cbt_last_result', JSON.stringify(mockSub));
            window.location.href = 'result.html';
        }
    }
}

async function clearHistory() {
    const result = await Swal.fire({
        title: 'Clear history?',
        text: 'This will delete all your past scores. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--error-color)',
        confirmButtonText: 'Yes, clear it'
    });

    if (result.isConfirmed) {
        localStorage.removeItem('cbt_score_history');
        loadHistory();
        Swal.fire('Deleted!', 'Your history has been cleared.', 'success');
    }
}

document.addEventListener('DOMContentLoaded', loadHistory);

window.addEventListener('storage', (e) => {
    if (e.key === 'cbt_score_history') {
        loadHistory();
    }
});

window.addEventListener('pageshow', (e) => {
    loadHistory();
});
