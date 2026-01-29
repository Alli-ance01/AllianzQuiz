
import { logout } from './logic.js';
import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import {
    createQuiz,
    getQuizzesByCreator,
    getQuizById,
    updateQuiz,
    deleteQuizById,
    getSubmissionsByQuiz,
    gradeQuestion,
    getSubmissionsByQuizCreator,
    clearCache
} from './firebase-db.js';
import { showSuccess, showError, showToast, confirmAction, showLoadingToast } from './ui-helpers.js';

let questions = [];
let editingQuizId = null;
let selectedVisibility = 'public';
let currentAdminId = null;
let myQuizzes = [];
let currentSubmissions = [];
let currentReviewTab = 'pending';
let searchTimeout = null;


const initialQuizSkeleton = `
    <div class="card skeleton-card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; margin-bottom: 0.5rem;">
        <div style="flex-grow: 1;">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text" style="width: 30%;"></div>
        </div>
        <div class="skeleton" style="width: 80px; height: 30px; border-radius: 20px;"></div>
    </div>
`.repeat(3);

const initialReviewSkeleton = `
    <div class="card skeleton-card" style="margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between;">
            <div class="skeleton skeleton-title" style="width: 40%;"></div>
            <div class="skeleton" style="width: 60px; height: 20px;"></div>
        </div>
        <div class="skeleton skeleton-text"></div>
    </div>
`.repeat(4);


onAuthChange(async (user) => {
    if (!user) return; // logic.js handles redirection

    const profile = await getUserProfile(user.uid);
    if (!profile) return; // logic.js handles redirection for disabled profiles

    currentAdminId = user.uid;

    // Load admin info
    document.getElementById('adminEmail').textContent = user.email;
    document.getElementById('welcomeMsg').textContent = "Admin Dashboard";

    // Load data
    await loadMyQuizzes();
    await loadQuizSelector();
    await loadAllSubmissionsCount();
});


window.selectVisibility = function (visibility) {
    selectedVisibility = visibility;
    document.querySelectorAll('.role-btn[data-visibility]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.visibility === visibility) {
            btn.classList.add('selected');
        }
    });

    const codeInfo = document.getElementById('accessCodeInfo');
    if (visibility === 'private') {
        codeInfo.style.display = 'block';
    } else {
        codeInfo.style.display = 'none';
    }
};


window.addQuestion = function (data = null) {
    const q = data || {
        id: Date.now() + Math.random(),
        type: 'mcq',
        scoring: 'exact',
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        correctText: ''
    };
    questions.push(q);
    renderQuestions();
};

window.removeQuestion = function (index) {
    questions.splice(index, 1);
    renderQuestions();
};

window.updateQuestionText = function (index, text) {
    questions[index].text = text;
};

window.updateOption = function (qIndex, oIndex, text) {
    questions[qIndex].options[oIndex] = text;
};

window.setCorrect = function (qIndex, oIndex) {
    questions[qIndex].correct = oIndex;
    renderQuestions();
};

window.updateCorrectText = function (index, text) {
    questions[index].correctText = text;
};

window.setType = function (index, type) {
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
};

window.setScoring = function (index, mode) {
    questions[index].scoring = mode;
    renderQuestions();
};

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
                            <input type="text" class="q-opt" placeholder="Option ${String.fromCharCode(65 + oIdx)}" value="${q.options[oIdx] || ''}" oninput="updateOption(${qIdx}, ${oIdx}, this.value)" required>
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

    if (questions.length === 0) {
        Swal.fire('Error', 'Please add at least one question!', 'error');
        return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
            Swal.fire('Error', `Question ${i + 1} is empty!`, 'error');
            return;
        }
        if (q.type === 'mcq') {
            const filledOptions = q.options.filter(o => o.trim()).length;
            if (filledOptions < 2) {
                Swal.fire('Error', `Question ${i + 1} needs at least 2 options!`, 'error');
                return;
            }
        }
        if (q.type === 'sa' && q.scoring === 'exact' && !q.correctText.trim()) {
            Swal.fire('Error', `Question ${i + 1} needs a correct answer!`, 'error');
            return;
        }
    }

    const quizData = {
        title: title,
        description: desc,
        instructions: instructions,
        duration: duration,
        visibility: selectedVisibility,
        createdBy: currentAdminId,
        questions: questions
    };

    try {
        if (editingQuizId) {
            await updateQuiz(editingQuizId, quizData);
            Swal.fire('Success!', 'Quiz updated successfully!', 'success');
        } else {
            const savedQuiz = await createQuiz(quizData);

            let message = 'Quiz saved successfully!';
            if (savedQuiz.visibility === 'private' && savedQuiz.accessCode) {
                message = `Quiz saved! Access Code: <strong style="font-size: 1.5rem; letter-spacing: 2px;">${savedQuiz.accessCode}</strong><br><br>Share this code with your students.`;
            }

            await Swal.fire({
                title: 'Success!',
                html: message,
                icon: 'success'
            });
        }

        resetForm();
        await loadMyQuizzes();
        await updateAnalytics(); // Refresh analytics after quiz creation/update

    } catch (error) {
        console.error('Error saving quiz:', error);
        Swal.fire('Error', 'Failed to save quiz. Please try again.', 'error');
    }
});

function resetForm() {
    document.getElementById('quizForm').reset();
    document.getElementById('quizInstructions').value = "";
    questions = [];
    editingQuizId = null;
    selectedVisibility = 'public';
    selectVisibility('public');
    addQuestion();
}


async function loadMyQuizzes() {
    const list = document.getElementById('customQuizList');
    const selector = document.getElementById('quizSelector');

    list.innerHTML = initialQuizSkeleton;

    try {
        myQuizzes = await getQuizzesByCreator(currentAdminId);

        // Update selector dropdown
        selector.innerHTML = '<option value="">-- Select a quiz to view submissions --</option>';
        myQuizzes.forEach(q => {
            selector.innerHTML += `<option value="${q.id}">${q.title}</option>`;
        });

        if (myQuizzes.length === 0) {
            list.innerHTML = "<p style='color: var(--text-muted); padding: 1rem;'>No quizzes created yet. Create your first quiz above!</p>";
            return;
        }

        list.innerHTML = myQuizzes.map(q => {
            const visibilityBadge = q.visibility === 'private'
                ? `<span style="background: var(--pending-bg); color: var(--pending-text); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">🔒 Private</span>`
                : `<span style="background: var(--success-bg); color: var(--success-text); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">🌐 Public</span>`;

            const codeDisplay = q.visibility === 'private' && q.accessCode
                ? `<br><span style="font-size: 0.8rem; color: var(--primary-color); font-weight: 600;">Code: ${q.accessCode} <button onclick="copyCode('${q.accessCode}')" style="background: none; border: none; cursor: pointer; padding: 0.1rem 0.3rem;">📋</button></span>`
                : '';

            return `
                <div class="card fade-in" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
                    <div>
                        <strong style="display: block; color: var(--text-color);">${q.title}</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${q.questions.length} Qs | ${q.duration} mins</span>
                        ${codeDisplay}
                    </div>
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        ${visibilityBadge}
                        <button onclick="editQuiz('${q.id}')" style="color: var(--primary-color); background: none; border: none; cursor: pointer; font-weight: 600;">Edit</button>
                        <button onclick="duplicateQuiz('${q.id}')" style="color: #6366f1; background: none; border: none; cursor: pointer; font-weight: 600;">Duplicate</button>
                        <button onclick="deleteQuiz('${q.id}')" style="color: var(--error-color); background: none; border: none; cursor: pointer; font-weight: 600;">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading quizzes:', error);
        list.innerHTML = "<p style='color: var(--text-muted);'>Error loading quizzes.</p>";
    }
}

window.deleteQuiz = async function (id) {
    const confirmed = await confirmAction('Are you sure?', 'This will delete the quiz and all its submissions!', 'Yes, delete it!');

    if (confirmed) {
        try {
            await deleteQuizById(id);
            showToast('Quiz deleted');
            clearCache();
            await loadMyQuizzes();
            await updateAnalytics();
        } catch (error) {
            console.error('Error deleting quiz:', error);
            showError(error, 'Delete Failed');
        }
    }
};

async function updateAnalytics() {
    try {
        const quizzes = myQuizzes;
        document.getElementById('statTotalQuizzes').textContent = quizzes.length;

        let totalAttempts = 0;
        let totalScorePercent = 0;

        const allSubs = await getSubmissionsByQuizCreator(currentAdminId);

        // Filter submissions to only include those belonging to currently existing quizzes
        const activeQuizIds = new Set(quizzes.map(q => q.id));
        const validSubs = allSubs.filter(s => activeQuizIds.has(s.quizId));

        totalAttempts = validSubs.length;
        validSubs.forEach(s => totalScorePercent += s.percentage);

        document.getElementById('statTotalAttempts').textContent = totalAttempts;
        const avg = totalAttempts > 0 ? Math.round(totalScorePercent / totalAttempts) : 0;
        document.getElementById('statAvgScore').textContent = avg + "%";

    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

window.editQuiz = async function (id) {
    const quiz = myQuizzes.find(q => q.id === id);
    if (!quiz) return;

    editingQuizId = id;
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizDesc').value = quiz.description;
    document.getElementById('quizInstructions').value = quiz.instructions || "";
    document.getElementById('quizDuration').value = quiz.duration;

    selectedVisibility = quiz.visibility || 'public';
    selectVisibility(selectedVisibility);

    questions = JSON.parse(JSON.stringify(quiz.questions));
    renderQuestions();

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.copyCode = function (code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('Access code copied to clipboard');
    });
};

window.duplicateQuiz = async function (id) {
    const quiz = myQuizzes.find(q => q.id === id);
    if (!quiz) return;

    try {
        const newQuizData = {
            ...quiz,
            title: quiz.title + ' (Copy)',
            createdAt: new Date(),
            // Remove ID and access code to let Firebase generate new ones
        };
        delete newQuizData.id;
        delete newQuizData.accessCode;

        await createQuiz(newQuizData);
        Swal.fire('Duplicated!', 'Quiz duplicated successfully.', 'success');
        await loadMyQuizzes();
    } catch (error) {
        console.error('Error duplicating quiz:', error);
        Swal.fire('Error', 'Failed to duplicate quiz.', 'error');
    }
};


window.loadSubmissionsForSelectedQuiz = async function () {
    const quizId = document.getElementById('quizSelector').value;
    const list = document.getElementById('submissionsReviewList');

    if (!quizId) {
        list.innerHTML = '<p style="color: var(--text-muted);">Select a quiz above to view submissions.</p>';
        currentSubmissions = [];
        return;
    }

    list.innerHTML = initialReviewSkeleton;

    try {
        currentSubmissions = await getSubmissionsByQuiz(quizId);
        renderSubmissions();
        await updateAnalytics(); // Update stats since we have new data
    } catch (error) {
        console.error('Error loading submissions:', error);
        list.innerHTML = '<p style="color: var(--text-muted);">Error loading submissions.</p>';
    }
};

window.exportSubmissionsCSV = function () {
    if (currentSubmissions.length === 0) {
        Swal.fire('No Data', 'No submissions found to export.', 'info');
        return;
    }

    const quizId = document.getElementById('quizSelector').value;
    const quiz = myQuizzes.find(q => q.id === quizId);
    const fileName = `Submissions_${quiz ? quiz.title : 'Quiz'}_${new Date().toISOString().split('T')[0]}.csv`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Date,Score,Total,Percentage,Time Taken\n";

    currentSubmissions.forEach(s => {
        const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        const row = [
            `"${s.userName || 'Anonymous'}"`,
            `"${s.userEmail || ''}"`,
            `"${date.toLocaleString()}"`,
            s.score,
            s.total,
            `"${s.percentage}%"`,
            `"${s.timeTaken || 'N/A'}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.switchReviewTab = function (tab) {
    currentReviewTab = tab;
    ['tabPending', 'tabGraded', 'tabAll'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    renderSubmissions();
};

window.filterSubmissions = function () {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        renderSubmissions();
    }, 300);
};

function renderSubmissions() {
    const list = document.getElementById('submissionsReviewList');
    const search = document.getElementById('submissionSearch').value.toLowerCase();

    let filtered = currentSubmissions;

    // Filter by tab
    if (currentReviewTab === 'pending') {
        filtered = filtered.filter(s => s.pending > 0);
    } else if (currentReviewTab === 'graded') {
        filtered = filtered.filter(s => s.pending === 0);
    }

    // Filter by search
    if (search) {
        filtered = filtered.filter(s =>
            (s.userName || '').toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = `<p style='color: var(--text-muted);'>No ${currentReviewTab === 'all' ? '' : currentReviewTab} submissions found.</p>`;
        return;
    }

    list.innerHTML = filtered.map((s) => {
        const isFullyGraded = s.pending === 0;
        const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        const dateStr = date.toLocaleString();

        if (currentReviewTab !== 'pending') {
            // Condensed view
            return `
                <div class="card fade-in" style="margin-bottom: 0.75rem; padding: 1rem 1.5rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; color: var(--text-color);">${s.userName || 'Anonymous'}</strong>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} | ⏱️ ${s.timeTaken || 'N/A'}</span>
                    </div>
                    <div style="text-align: right; display: flex; align-items: center; gap: 1.5rem;">
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

        // Detailed view for pending
        const pendingQuestions = s.details?.filter(d => d.status === 'pending') || [];

        return `
            <div class="card fade-in" style="margin-bottom: 1.5rem; border: 1px solid var(--warning-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${s.userName || 'Anonymous'}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">${dateStr} | ⏱️ ${s.timeTaken || 'N/A'}</p>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-badge status-pending">${s.pending} Pending</span>
                        <div style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color); margin-top: 0.4rem;">
                            Score: ${s.score} / ${s.total} (${s.percentage}%)
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; gap: 0.75rem;">
                    ${pendingQuestions.map(d => `
                        <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--warning-color)">
                            <div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">Q: ${d.text}</div>
                            <div style="font-size: 0.9rem; margin-bottom: 1rem;">
                                <span style="color: var(--text-muted);">Answer:</span> 
                                <span style="font-weight: 500; color: var(--text-color);">${d.selectedOption || '<i>Skipped</i>'}</span>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="gradeSubmission('${s.id}', '${d.questionId}', true)" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--success-color);">Correct</button>
                                <button onclick="gradeSubmission('${s.id}', '${d.questionId}', false)" class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: var(--error-color); color: white;">Incorrect</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

window.gradeSubmission = async function (submissionId, questionId, isCorrect) {
    try {
        await gradeQuestion(submissionId, questionId, isCorrect);

        Swal.fire({
            title: 'Graded!',
            text: isCorrect ? 'Marked as correct' : 'Marked as incorrect',
            icon: 'success',
            timer: 800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });

        // Reload submissions
        await loadSubmissionsForSelectedQuiz();

    } catch (error) {
        console.error('Error grading:', error);
        Swal.fire('Error', 'Failed to grade. Please try again.', 'error');
    }
};
