import { onAuthChange, getCurrentUser, getUserProfile } from './firebase-auth.js';
import { getQuizById, saveSubmission } from './firebase-db.js';
import { showError, showSuccess, showLoadingToast, confirmAction } from './ui-helpers.js';
import { setupStatusMonitoring } from './logic.js';

let myQuizData = null;
let currentQIdx = 0;
let myAnswers = {};
let myFlags = {};
let timerInt = null;
let timeLft = 0;
let startTime = 0;
let currentUserId = null;
let currentUserProfile = null;

onAuthChange(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUserId = user.uid;

    // Start monitoring status in real-time
    setupStatusMonitoring(user);

    currentUserProfile = await getUserProfile(user.uid);

    if (currentUserProfile && currentUserProfile.disabled) {
        const { signOutUser } = await import('./firebase-auth.js');
        await signOutUser();
        window.location.href = 'index.html';
        return;
    }

    await quizInit();
    applyProtection();
});

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
        if (source === 'firestore') {
            myQuizData = await getQuizById(quizId);
        }

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

        const savedState = loadQuizState(quizId);
        if (savedState) {
            const result = await Swal.fire({
                title: 'Resume Quiz?',
                text: "We found a saved session for this quiz. Would you like to continue where you left off?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Resume',
                cancelButtonText: 'No, Start Over',
                allowOutsideClick: false
            });

            if (result.isConfirmed) {
                myQuizData.questions = savedState.questions;
                myAnswers = savedState.answers || {};
                myFlags = savedState.flags || {};
                timeLft = savedState.timeLft || (myQuizData.duration * 60);
                currentQIdx = savedState.currentQIdx || 0;
                startTime = savedState.startTime || Date.now();

                document.getElementById('quizTitle').textContent = myQuizData.title;
                document.getElementById('totalQNum').textContent = myQuizData.questions.length;

                startT();
                loadQ(currentQIdx);
                return;
            } else {
                clearQuizState(quizId);
            }
        }

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

        // Save progress every 10 seconds to avoid too many writes but keep time semi-accurate
        if (timeLft % 10 === 0) saveQuizState();

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
    saveQuizState();
    document.getElementById('currentQNum').textContent = index + 1;

    const question = myQuizData.questions[index];
    
    // Support Rich Text (Markdown) for Question
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        document.getElementById('questionText').innerHTML = DOMPurify.sanitize(marked.parse(question.text));
    } else {
        document.getElementById('questionText').textContent = question.text;
    }

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
            
            // Render option text (supporting inline markdown)
            const optionContent = (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') 
                ? DOMPurify.sanitize(marked.parseInline(opt.text)) 
                : opt.text;
                
            html += `
                <div class="option-card ${isSelected ? 'selected' : ''}" onclick="selAns(${question.id}, ${opt.idx})">
                    <div class="option-circle"></div>
                    <div>${optionContent}</div>
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
    saveQuizState();
    loadQ(currentQIdx);
};

window.handleTextAns = function (qId, val) {
    if (val.trim() === "") {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = val;
    }
    saveQuizState();
    renderPal();
};

window.selAns = function (qId, optionIndex) {
    if (myAnswers[qId] === optionIndex) {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = optionIndex;
    }
    saveQuizState();
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
            type: q.type || 'mcq',
            scoring: q.scoring || 'exact',
            selectedOption: selected !== undefined ? (q.type === 'sa' ? selected : q.options[selected]) : null,
            correctKey: q.type === 'sa' ? (q.scoring === 'manual' ? 'Pending Review' : (q.correctText || null)) : (q.options[q.correct] || null),
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
        quizCreatorId: myQuizData.createdBy || 'system',
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

        // Clear persistence state
        clearQuizState(myQuizData.id);

        // Also save to localStorage for immediate result display
        localStorage.setItem('cbt_last_result', JSON.stringify({
            ...submissionData,
            id: savedSubmission.id
        }));

        window.location.href = 'result.html';

    } catch (error) {
        console.error('Submission technical error:', error);

        // Clear persistence state even if save failed to prevent resume loop
        clearQuizState(myQuizData.id);

        // Fallback: still show result even if save failed
        localStorage.setItem('cbt_last_result', JSON.stringify(submissionData));

        showError(error, 'Submission Issue');

        // Give the user a moment to see the error, then redirect anyway so they don't lose their session
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 3000);
    }
}

// ==================== STATE PERSISTENCE ====================

function saveQuizState() {
    if (!myQuizData || !currentUserId) return;

    const state = {
        quizId: myQuizData.id,
        currentQIdx: currentQIdx,
        answers: myAnswers,
        flags: myFlags,
        timeLft: timeLft,
        startTime: startTime,
        questions: myQuizData.questions, // Save shuffled order
        timestamp: Date.now()
    };

    localStorage.setItem(`cbt_state_${currentUserId}_${myQuizData.id}`, JSON.stringify(state));
}

function loadQuizState(quizId) {
    if (!currentUserId) return null;
    const key = `cbt_state_${currentUserId}_${quizId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const state = JSON.parse(saved);

    // Optional: Expire state after 24 hours
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > oneDay) {
        localStorage.removeItem(key);
        return null;
    }

    return state;
}

function clearQuizState(quizId) {
    if (!currentUserId) return;
    localStorage.removeItem(`cbt_state_${currentUserId}_${quizId}`);
}

// ==================== PROTECTION ====================

function applyProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Disable text selection via JS as a backup
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    });

    // Disable copy, cut, paste
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        return false;
    });
    document.addEventListener('cut', (e) => {
        e.preventDefault();
        return false;
    });
    document.addEventListener('paste', (e) => {
        e.preventDefault();
        return false;
    });

    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+A
        const forbiddenKeys = ['c', 'v', 'x', 'u', 's', 'p', 'a'];
        if (e.ctrlKey && forbiddenKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Disable F12 and Ctrl+Shift+I (DevTools)
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // Disable dragging elements
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });
}
