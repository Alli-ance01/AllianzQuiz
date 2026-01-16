// Quiz.js - Quiz taking functionality

import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import { getQuizById, saveSubmission } from './firebase-db.js';
import { showError, showSuccess, showLoadingToast, confirmAction } from './ui-helpers.js';

// ==================== GLOBAL STATE ====================

let myQuizData = null;
let currentQIdx = 0;
let myAnswers = {};
let myFlags = {};
let timerInt = null;
let timeLft = 0;
let startTime = 0;
let currentUserId = null;
let currentUserProfile = null;

// ==================== THEME ====================

function applyTheme() {
    let saved = localStorage.getItem('cbt_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    let btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = saved === 'light' ? '🌙' : '☀️';
}
applyTheme();

document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    let current = localStorage.getItem('cbt_theme') || 'light';
    let next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('cbt_theme', next);
    applyTheme();
});

// ==================== AUTH CHECK ====================

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.uid;
    currentUserProfile = await getUserProfile(user.uid);

    // Initialize quiz
    await quizInit();
});

// ==================== QUIZ INITIALIZATION ====================

async function quizInit() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    const source = params.get('source');

    if (!quizId) {
        Swal.fire({
            title: 'Error!',
            text: 'No quiz specified!',
            icon: 'error',
            confirmButtonText: 'Back to Dashboard'
        }).then(() => {
            window.location.href = 'dashboard.html';
        });
        return;
    }

    try {
        // Try to get from Firestore first if source is firestore
        if (source === 'firestore') {
            myQuizData = await getQuizById(quizId);
        }

        // Fallback to local data.js
        if (!myQuizData && typeof myData !== 'undefined') {
            for (let i = 0; i < myData.length; i++) {
                if (myData[i].id === quizId) {
                    myQuizData = JSON.parse(JSON.stringify(myData[i]));
                    break;
                }
            }
        }

        if (!myQuizData) {
            Swal.fire({
                title: 'Quiz Not Found',
                text: 'The requested quiz does not exist.',
                icon: 'warning',
                confirmButtonText: 'Back to Dashboard'
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
            return;
        }

        // Shuffle questions
        for (let i = myQuizData.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = myQuizData.questions[i];
            myQuizData.questions[i] = myQuizData.questions[j];
            myQuizData.questions[j] = temp;
        }

        document.getElementById('quizTitle').textContent = myQuizData.title;
        document.getElementById('totalQNum').textContent = myQuizData.questions.length;
        timeLft = myQuizData.duration * 60;

        renderPal();
        showStartModal();

    } catch (error) {
        console.error('Error loading quiz:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to load quiz. Please try again.',
            icon: 'error',
            confirmButtonText: 'Back'
        }).then(() => {
            window.location.href = 'dashboard.html';
        });
    }
}

function showStartModal() {
    Swal.fire({
        title: myQuizData.title,
        html: `
            <div style="text-align: left; margin-top: 1rem;">
                <p style="margin-bottom: 1rem; color: var(--text-muted); opacity: 0.8;">${myQuizData.description}</p>
                <h4 style="margin-bottom: 0.8rem; font-weight: 600;">Quick Rules:</h4>
                <ul style="padding-left: 1.5rem; line-height: 1.6;">
                    <li>You have <strong>${myQuizData.duration} minutes</strong> to complete the quiz.</li>
                    <li>There are <strong>${myQuizData.questions.length} questions</strong> in total.</li>
                </ul>
            <div class="quiz-instructions">
                <strong>Instructions:</strong><br>
                ${(myQuizData.instructions || "No specific instructions provided. Good luck!").replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 1rem;">Duration: ${myQuizData.duration} minutes</p>
        `,
        icon: 'info',
        background: 'var(--card-bg)',
        color: 'var(--text-color)',
        confirmButtonText: 'Start Now',
        confirmButtonColor: 'var(--primary-color)',
        showCancelButton: true,
        cancelButtonText: 'Start Later',
        cancelButtonColor: 'var(--secondary-bg)',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            startTime = Date.now();
            loadQ(0);
            startT();
        } else {
            window.location.href = 'dashboard.html';
        }
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startT() {
    const display = document.getElementById('timerDisplay');
    document.getElementById('quizMainContent').style.display = 'grid';

    timerInt = setInterval(function () {
        if (timeLft <= 0) {
            submitQ(true);
            return;
        }

        timeLft--;

        const mins = Math.floor(timeLft / 60);
        const secs = timeLft % 60;
        display.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;

        if (timeLft < 60) {
            display.classList.add('timer-danger');
        } else {
            display.classList.remove('timer-danger');
        }
    }, 1000);
}

// ==================== QUESTION NAVIGATION ====================

function loadQ(index) {
    if (index < 0 || index >= myQuizData.questions.length) return;

    currentQIdx = index;
    document.getElementById('currentQNum').textContent = index + 1;

    const question = myQuizData.questions[index];
    document.getElementById('questionText').textContent = question.text;

    const bar = document.getElementById('progressBar');
    const percent = ((index + 1) / myQuizData.questions.length) * 100;
    bar.style.width = percent + "%";

    const flagBtn = document.getElementById('flagBtn');
    flagBtn.textContent = myFlags[question.id] ? 'Unflag' : 'Flag';

    const container = document.getElementById('optionsContainer');
    let html = "";

    if (question.type === 'sa') {
        const currentAns = myAnswers[question.id] || '';
        html = `
            <div class="input-group">
                <label>Type your answer below:</label>
                <textarea class="q-textarea" oninput="handleTextAns(${question.id}, this.value)" placeholder="Enter your response...">${currentAns}</textarea>
            </div>
        `;
    } else {
        // Randomize options if not already done
        if (!question._shuffledOptions) {
            const optsWithIdx = question.options.map((text, idx) => ({ text, idx }));
            question._shuffledOptions = shuffle(optsWithIdx);
        }

        question._shuffledOptions.forEach(opt => {
            const isSelected = myAnswers[question.id] === opt.idx;
            html += `
                <div class="option-card ${isSelected ? 'selected' : ''}" onclick="selAns(${question.id}, ${opt.idx})">
                    <div class="option-circle"></div>
                    <div>${opt.text}</div>
                </div>
            `;
        });
    }
    container.innerHTML = html;

    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('prevBtn').style.opacity = index === 0 ? '0.5' : '1';

    const nextBtn = document.getElementById('nextBtn');
    if (index === myQuizData.questions.length - 1) {
        nextBtn.textContent = 'Finish';
        nextBtn.onclick = function () { submitQ(); };
    } else {
        nextBtn.textContent = 'Next Question';
        nextBtn.onclick = function () { nextQ(); };
    }

    renderPal();
}

window.toggleFlag = function () {
    const question = myQuizData.questions[currentQIdx];
    myFlags[question.id] = !myFlags[question.id];
    loadQ(currentQIdx);
};

window.handleTextAns = function (qId, val) {
    if (val.trim() === "") {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = val;
    }
    renderPal();
};

window.selAns = function (qId, optionIndex) {
    if (myAnswers[qId] === optionIndex) {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = optionIndex;
    }
    loadQ(currentQIdx);
};

window.nextQ = function () {
    if (currentQIdx < myQuizData.questions.length - 1) {
        loadQ(currentQIdx + 1);
    }
};

window.prevQ = function () {
    if (currentQIdx > 0) {
        loadQ(currentQIdx - 1);
    }
};

window.jumpTo = function (index) {
    loadQ(index);
};

function renderPal() {
    const grid = document.getElementById('paletteGrid');
    let html = "";
    for (let i = 0; i < myQuizData.questions.length; i++) {
        const q = myQuizData.questions[i];
        const isAnswered = myAnswers[q.id] !== undefined;
        const isCurrent = i === currentQIdx;
        const isFlagged = myFlags[q.id];

        let cls = 'palette-btn';
        if (isCurrent) {
            cls += ' active';
        } else if (isFlagged) {
            cls += ' flagged';
        } else if (isAnswered) {
            cls += ' answered';
        }

        html += `<button class="${cls}" onclick="jumpTo(${i})">${i + 1}</button>`;
    }
    grid.innerHTML = html;
}

// ==================== SUBMISSION ====================

window.submitQ = async function (auto) {
    if (auto) {
        executeSubmit();
    } else {
        const confirmed = await confirmAction(
            'Finish Quiz?',
            'Do you want to submit your answers and finish the quiz?',
            'Yes, finish it'
        );
        if (confirmed) {
            executeSubmit();
        }
    }
};

async function executeSubmit() {
    clearInterval(timerInt);

    let counts = 0;
    let pending = 0;
    const report = [];

    for (let i = 0; i < myQuizData.questions.length; i++) {
        const q = myQuizData.questions[i];
        const selected = myAnswers[q.id];
        let isCorrect = false;
        let status = 'wrong';

        if (q.type === 'sa') {
            if (q.scoring === 'manual') {
                status = 'pending';
                pending++;
            } else {
                isCorrect = (selected || "").toString().toLowerCase().trim() === (q.correctText || "").toLowerCase().trim();
                if (isCorrect) {
                    counts++;
                    status = 'correct';
                }
            }
        } else {
            isCorrect = (selected === q.correct);
            if (isCorrect) {
                counts++;
                status = 'correct';
            }
        }

        const item = {
            questionId: q.id,
            text: q.text,
            type: q.type,
            scoring: q.scoring,
            selectedOption: selected !== undefined ? (q.type === 'sa' ? selected : q.options[selected]) : null,
            correctKey: q.type === 'sa' ? (q.scoring === 'manual' ? 'Pending Review' : q.correctText) : q.options[q.correct],
            isCorrect: isCorrect,
            status: status
        };
        report.push(item);
    }

    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    let timeTakenFormatted = "";
    if (timeSpentSeconds < 60) {
        timeTakenFormatted = timeSpentSeconds + "s";
    } else {
        timeTakenFormatted = Math.floor(timeSpentSeconds / 60) + "m " + (timeSpentSeconds % 60) + "s";
    }

    const submissionData = {
        quizId: myQuizData.id,
        quizTitle: myQuizData.title,
        quizCreatorId: myQuizData.createdBy || null,
        userId: currentUserId || null,
        userName: currentUserProfile?.displayName || 'Anonymous',
        userEmail: currentUserProfile?.email || '',
        timeTaken: timeTakenFormatted,
        score: counts,
        pending: pending,
        total: myQuizData.questions.length,
        percentage: Math.round((counts / myQuizData.questions.length) * 100),
        details: report.map(item => ({
            ...item,
            selectedOption: item.selectedOption === undefined ? null : item.selectedOption,
            correctKey: item.correctKey === undefined ? null : item.correctKey
        }))
    };

    try {
        showLoadingToast('Submitting your quiz...');

        // Save to Firestore
        const savedSubmission = await saveSubmission(submissionData);

        // Also save to localStorage for immediate result display
        localStorage.setItem('cbt_last_result', JSON.stringify({
            ...submissionData,
            id: savedSubmission.id
        }));

        window.location.href = 'result.html';

    } catch (error) {
        console.error('Submission technical error:', error);

        // Fallback: still show result even if save failed
        localStorage.setItem('cbt_last_result', JSON.stringify(submissionData));

        showError(error, 'Submission Issue');

        // Give the user a moment to see the error, then redirect anyway so they don't lose their session
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 3000);
    }
}
