let questions = [];
let editingQuizId = null;

function addQuestion(data = null) {
    const q = data || {
        id: Date.now() + Math.random(),
        type: 'mcq', // mcq, tf, sa
        scoring: 'exact', // exact, manual (only for sa)
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        correctText: '' // for short answer
    };
    questions.push(q);
    renderQuestions();
}

function removeQuestion(index) {
    questions.splice(index, 1);
    renderQuestions();
}

function updateQuestionText(index, text) {
    questions[index].text = text;
}

function updateOption(qIndex, oIndex, text) {
    questions[qIndex].options[oIndex] = text;
}

function setCorrect(qIndex, oIndex) {
    questions[qIndex].correct = oIndex;
    renderQuestions();
}

function updateCorrectText(index, text) {
    questions[index].correctText = text;
}

function setType(index, type) {
    questions[index].type = type;
    if (type === 'tf') {
        questions[index].options = ['True', 'False'];
        questions[index].correct = 0;
    } else if (type === 'sa') {
        questions[index].scoring = 'exact';
    } else {
        questions[index].options = ['', '', '', ''];
    }
    renderQuestions();
}

function setScoring(index, mode) {
    questions[index].scoring = mode;
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById('questionsList');
    container.innerHTML = "";

    questions.forEach((q, qIdx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-form-card';

        let typeControls = `
            <div class="type-selector">
                <button type="button" class="type-btn ${q.type === 'mcq' ? 'active' : ''}" onclick="setType(${qIdx}, 'mcq')">MCQ</button>
                <button type="button" class="type-btn ${q.type === 'tf' ? 'active' : ''}" onclick="setType(${qIdx}, 'tf')">True/False</button>
                <button type="button" class="type-btn ${q.type === 'sa' ? 'active' : ''}" onclick="setType(${qIdx}, 'sa')">Short Answer</button>
            </div>
        `;

        let specificInputs = "";
        if (q.type === 'mcq') {
            specificInputs = `
                <div class="options-grid">
                    ${[0, 1, 2, 3].map(oIdx => `
                        <div class="option-input-wrapper">
                            <span class="option-prefix">${String.fromCharCode(65 + oIdx)}</span>
                            <input type="text" class="q-opt" placeholder="Option ${String.fromCharCode(65 + oIdx)}" value="${q.options[oIdx]}" oninput="updateOption(${qIdx}, ${oIdx}, this.value)" required>
                        </div>
                    `).join('')}
                </div>
                <div class="input-group">
                    <label>Which is the correct answer?</label>
                    <div class="correct-option-selector">
                        ${['A', 'B', 'C', 'D'].map((label, oIdx) => `
                            <button type="button" class="correct-option-btn ${q.correct === oIdx ? 'selected' : ''}" 
                            onclick="setCorrect(${qIdx}, ${oIdx})">${label}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (q.type === 'tf') {
            specificInputs = `
                <div class="input-group">
                    <label>Which is correct?</label>
                    <div class="correct-option-selector">
                        <button type="button" class="correct-option-btn ${q.correct === 0 ? 'selected' : ''}" onclick="setCorrect(${qIdx}, 0)">True</button>
                        <button type="button" class="correct-option-btn ${q.correct === 1 ? 'selected' : ''}" onclick="setCorrect(${qIdx}, 1)">False</button>
                    </div>
                </div>
            `;
        } else if (q.type === 'sa') {
            specificInputs = `
                <div class="input-group" style="margin-bottom: 1rem;">
                    <label>Scoring Method</label>
                    <div class="correct-option-selector">
                        <button type="button" class="correct-option-btn ${q.scoring === 'exact' ? 'selected' : ''}" 
                            onclick="setScoring(${qIdx}, 'exact')" style="font-size: 0.8rem;">Exact Match</button>
                        <button type="button" class="correct-option-btn ${q.scoring === 'manual' ? 'selected' : ''}" 
                            onclick="setScoring(${qIdx}, 'manual')" style="font-size: 0.8rem;">Manual Review</button>
                    </div>
                </div>
                ${q.scoring === 'exact' ? `
                    <div class="input-group">
                        <label>Correct Answer Text (Case-insensitive)</label>
                        <input type="text" class="q-correct-text" placeholder="e.g. Photosynthesis" value="${q.correctText || ''}" oninput="updateCorrectText(${qIdx}, this.value)" required>
                    </div>
                ` : `
                    <p style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.8;">Admin will manually score this question on the results page.</p>
                `}
            `;
        }

        qDiv.innerHTML = `
            <button type="button" class="remove-q-btn" onclick="removeQuestion(${qIdx})">Remove</button>
            ${typeControls}
            <div class="input-group">
                <label>Question ${qIdx + 1}</label>
                <input type="text" class="q-text" placeholder="Question text" value="${q.text}" oninput="updateQuestionText(${qIdx}, this.value)" required>
            </div>
            ${specificInputs}
        `;
        container.appendChild(qDiv);
    });
}

document.getElementById('quizForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = document.getElementById('quizTitle').value;
    const desc = document.getElementById('quizDesc').value;
    const instructions = document.getElementById('quizInstructions').value;
    const duration = parseInt(document.getElementById('quizDuration').value);
    const id = document.getElementById('quizId').value;

    if (questions.length === 0) {
        Swal.fire('Error', 'Please add at least one question!', 'error');
        return;
    }

    const newQuiz = {
        id: id,
        title: title,
        description: desc,
        instructions: instructions,
        duration: duration,
        questions: questions
    };

    let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');

    if (editingQuizId && editingQuizId !== id) {
        // ID changed while editing, delete old one
        customQuizzes = customQuizzes.filter(q => q.id !== editingQuizId);
    }

    const existingIdx = customQuizzes.findIndex(q => q.id === id);
    if (existingIdx > -1 && !editingQuizId) {
        const result = await Swal.fire({
            title: 'Overwrite Quiz?',
            text: 'A quiz with this ID already exists. Overwrite it?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, overwrite'
        });
        if (!result.isConfirmed) return;
        customQuizzes[existingIdx] = newQuiz;
    } else if (existingIdx > -1) {
        customQuizzes[existingIdx] = newQuiz;
    } else {
        customQuizzes.push(newQuiz);
    }

    localStorage.setItem('cbt_custom_quizzes', JSON.stringify(customQuizzes));
    Swal.fire('Success', 'Quiz saved successfully!', 'success');

    resetForm();
    loadCustomQuizzes();
});

function resetForm() {
    document.getElementById('quizForm').reset();
    document.getElementById('quizInstructions').value = "";
    questions = [];
    editingQuizId = null;
    document.getElementById('quizId').disabled = false;
    addQuestion();
    renderQuestions();
}

function loadCustomQuizzes() {
    const list = document.getElementById('customQuizList');
    const customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');

    if (customQuizzes.length === 0) {
        list.innerHTML = "<p style='color: var(--text-muted); padding: 1rem;'>No custom quizzes yet.</p>";
        return;
    }

    list.innerHTML = customQuizzes.map(q => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
            <div>
                <strong style="display: block; color: var(--text-color);">${q.title}</strong>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${q.questions.length} Qs | ${q.duration} mins | ID: ${q.id}</span>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button onclick="editQuiz('${q.id}')" style="color: var(--primary-color); background: none; border: none; cursor: pointer; font-weight: 600;">Edit</button>
                <button onclick="deleteQuiz('${q.id}')" style="color: var(--error-color); background: none; border: none; cursor: pointer; font-weight: 600;">Delete</button>
            </div>
        </div>
    `).join('');
}

function editQuiz(id) {
    const customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');
    const quiz = customQuizzes.find(q => q.id === id);
    if (!quiz) return;

    editingQuizId = id;
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizDesc').value = quiz.description;
    document.getElementById('quizInstructions').value = quiz.instructions || "";
    document.getElementById('quizDuration').value = quiz.duration;
    document.getElementById('quizId').value = quiz.id;
    // document.getElementById('quizId').disabled = true; // Let them change ID but we handle it

    questions = JSON.parse(JSON.stringify(quiz.questions));
    renderQuestions();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteQuiz(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary-color)',
        cancelButtonColor: 'var(--error-color)',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');
        customQuizzes = customQuizzes.filter(q => q.id !== id);
        localStorage.setItem('cbt_custom_quizzes', JSON.stringify(customQuizzes));
        Swal.fire('Deleted!', 'The quiz has been deleted.', 'success');
        loadCustomQuizzes();
        if (editingQuizId === id) resetForm();
    }
}

let currentReviewTab = 'pending';

function switchReviewTab(tab) {
    currentReviewTab = tab;
    ['tabPending', 'tabGraded', 'tabAll'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    loadSubmissions();
}

function loadSubmissions() {
    const list = document.getElementById('submissionsReviewList');
    if (!list) return;

    let submissions = JSON.parse(localStorage.getItem('cbt_all_submissions') || '[]');
    const search = document.getElementById('submissionSearch').value.toLowerCase();

    // Filter by tab
    let filtered = submissions;
    if (currentReviewTab === 'pending') {
        filtered = submissions.filter(s => s.pending > 0);
    } else if (currentReviewTab === 'graded') {
        filtered = submissions.filter(s => s.pending === 0);
    }

    // Filter by search
    if (search) {
        filtered = filtered.filter(s =>
            (s.userName || '').toLowerCase().includes(search) ||
            (s.quizTitle || '').toLowerCase().includes(search)
        );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filtered.length === 0) {
        list.innerHTML = `<p style='color: var(--text-muted); padding: 1rem;'>No ${currentReviewTab === 'all' ? '' : currentReviewTab} submissions found.</p>`;
        return;
    }

    list.innerHTML = filtered.map((s, sIdx) => {
        const isFullyGraded = s.pending === 0;
        const isCondensed = currentReviewTab !== 'pending';

        if (isCondensed) {
            return `
                <div class="card" style="margin-bottom: 0.75rem; padding: 1rem 1.5rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; color: var(--text-color);">${s.userName || 'Anonymous'}</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${s.quizTitle} | ${new Date(s.timestamp).toLocaleDateString()} ${new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style="text-align: right; display: flex; align-items: center; gap: 1.5rem;">
                        <div style="color: var(--text-muted); font-size: 0.85rem;">
                            ⏱️ ${s.timeTaken || 'N/A'}
                        </div>
                        <div style="font-weight: 700; color: var(--primary-color);">
                            ${s.score} / ${s.total} (${s.percentage}%)
                        </div>
                        <span class="status-badge ${isFullyGraded ? 'status-correct' : 'status-pending'}">
                            ${isFullyGraded ? 'Graded' : 'Pending'}
                        </span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card" style="margin-bottom: 1.5rem; border: 1px solid var(--warning-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${s.userName || 'Anonymous'}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${s.quizTitle} - ${new Date(s.timestamp).toLocaleString()} | ⏱️ ${s.timeTaken || 'N/A'}</p>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-badge status-pending">
                            ${s.pending} Pending
                        </span>
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color); margin-top: 0.4rem;">
                            Score: ${s.score} / ${s.total} (${s.percentage}%)
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; gap: 0.75rem;">
                    ${s.details.filter(d => d.status === 'pending').map(d => `
                        <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--warning-color)">
                            <div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">Q: ${d.text}</div>
                            <div style="font-size: 0.9rem; margin-bottom: 1rem;">
                                <span style="color: var(--text-muted);">User Answer:</span> 
                                <span style="font-weight: 500; color: var(--text-color);">${d.selectedOption || '<i>Skipped</i>'}</span>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="gradeSubmission('${s.timestamp}', '${d.questionId}', true)" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--success-color);">Correct</button>
                                <button onclick="gradeSubmission('${s.timestamp}', '${d.questionId}', false)" class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--error-color); color: white;">Incorrect</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function gradeSubmission(timestamp, qId, isCorrect) {
    let submissions = JSON.parse(localStorage.getItem('cbt_all_submissions') || '[]');
    let subIdx = submissions.findIndex(s => s.timestamp === timestamp);
    if (subIdx === -1) return;

    let sub = submissions[subIdx];
    let detailIdx = sub.details.findIndex(d => d.questionId == qId);
    if (detailIdx === -1) return;

    let detail = sub.details[detailIdx];

    detail.status = isCorrect ? 'correct' : 'wrong';
    detail.isCorrect = isCorrect;
    sub.pending--;
    if (isCorrect) {
        sub.score++;
    }
    sub.percentage = Math.round((sub.score / sub.total) * 100);

    // Update global submissions
    localStorage.setItem('cbt_all_submissions', JSON.stringify(submissions));

    // Also update history for the specific user
    let history = JSON.parse(localStorage.getItem('cbt_score_history') || '[]');
    let historyIdx = history.findLastIndex(h => h.timestamp === timestamp);
    if (historyIdx !== -1) {
        history[historyIdx].score = sub.score;
        history[historyIdx].pending = sub.pending;
        history[historyIdx].percentage = sub.percentage;
        localStorage.setItem('cbt_score_history', JSON.stringify(history));
    }

    // Sync with cbt_last_result if it's the one being viewed
    let lastResStr = localStorage.getItem('cbt_last_result');
    if (lastResStr) {
        let lastRes = JSON.parse(lastResStr);
        if (lastRes.timestamp === timestamp) {
            localStorage.setItem('cbt_last_result', JSON.stringify(sub));
        }
    }

    loadSubmissions();
    Swal.fire({
        title: 'Graded!',
        text: isCorrect ? 'Marked as correct' : 'Marked as incorrect',
        icon: 'success',
        timer: 800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

// Initial state
addQuestion();
loadCustomQuizzes();
loadSubmissions();
