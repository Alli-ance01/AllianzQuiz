let myQuizData = null;
let currentQIdx = 0;
let myAnswers = {};
let myFlags = {};
let timerInt = null;
let timeLft = 0;
let startTime = 0;

function quizInit() {
    checkAuth();

    let params = new URLSearchParams(window.location.search);
    let quizId = params.get('id');

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

    let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');
    let allQuizzes = [...myData, ...customQuizzes];

    for (let i = 0; i < allQuizzes.length; i++) {
        if (allQuizzes[i].id === quizId) {
            myQuizData = JSON.parse(JSON.stringify(allQuizzes[i]));
            break;
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

    for (let i = myQuizData.questions.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = myQuizData.questions[i];
        myQuizData.questions[i] = myQuizData.questions[j];
        myQuizData.questions[j] = temp;
    }

    document.getElementById('quizTitle').textContent = myQuizData.title;
    document.getElementById('totalQNum').textContent = myQuizData.questions.length;
    timeLft = myQuizData.duration * 60;

    renderPal();
    showStartModal();
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
    let display = document.getElementById('timerDisplay');
    document.getElementById('quizMainContent').style.display = 'grid';

    timerInt = setInterval(function () {
        if (timeLft <= 0) {
            submitQ(true);
            return;
        }

        timeLft--;

        let mins = Math.floor(timeLft / 60);
        let secs = timeLft % 60;
        display.textContent = `${mins}:${secs < 10 ? '0' + secs : secs}`;

        if (timeLft < 60) {
            display.classList.add('timer-danger');
        } else {
            display.classList.remove('timer-danger');
        }
    }, 1000);
}

function loadQ(index) {
    if (index < 0 || index >= myQuizData.questions.length) return;

    currentQIdx = index;
    document.getElementById('currentQNum').textContent = index + 1;

    let question = myQuizData.questions[index];
    document.getElementById('questionText').textContent = question.text;

    let bar = document.getElementById('progressBar');
    let percent = ((index + 1) / myQuizData.questions.length) * 100;
    bar.style.width = percent + "%";

    let flagBtn = document.getElementById('flagBtn');

    flagBtn.textContent = myFlags[question.id] ? 'Unflag' : 'Flag';

    let container = document.getElementById('optionsContainer');
    let html = "";

    if (question.type === 'sa') {
        let currentAns = myAnswers[question.id] || '';
        html = `
            <div class="input-group">
                <label>Type your answer below:</label>
                <textarea class="q-textarea" oninput="handleTextAns(${question.id}, this.value)" placeholder="Enter your response...">${currentAns}</textarea>
            </div>
        `;
    } else {
        // Randomize options if not already done for this question session
        if (!question._shuffledOptions) {
            let optsWithIdx = question.options.map((text, idx) => ({ text, idx }));
            question._shuffledOptions = shuffle(optsWithIdx);
        }

        question._shuffledOptions.forEach(opt => {
            let isSelected = myAnswers[question.id] === opt.idx;
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

    let nextBtn = document.getElementById('nextBtn');
    if (index === myQuizData.questions.length - 1) {
        nextBtn.textContent = 'Finish';
        nextBtn.onclick = function () { submitQ(); };
    } else {
        nextBtn.textContent = 'Next Question';
        nextBtn.onclick = function () { nextQ(); };
    }

    renderPal();
}

function toggleFlag() {
    let question = myQuizData.questions[currentQIdx];
    myFlags[question.id] = !myFlags[question.id];
    loadQ(currentQIdx);
}

// Ensure this is global
window.handleTextAns = function (qId, val) {
    if (val.trim() === "") {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = val;
    }
    renderPal();
};

function selAns(qId, optionIndex) {
    if (myAnswers[qId] === optionIndex) {
        delete myAnswers[qId];
    } else {
        myAnswers[qId] = optionIndex;
    }
    loadQ(currentQIdx);
}

function nextQ() {
    if (currentQIdx < myQuizData.questions.length - 1) {
        loadQ(currentQIdx + 1);
    }
}

function prevQ() {
    if (currentQIdx > 0) {
        loadQ(currentQIdx - 1);
    }
}

function jumpTo(index) {
    loadQ(index);
}

function renderPal() {
    let grid = document.getElementById('paletteGrid');
    let html = "";
    for (let i = 0; i < myQuizData.questions.length; i++) {
        let q = myQuizData.questions[i];
        let isAnswered = myAnswers[q.id] !== undefined;
        let isCurrent = i === currentQIdx;
        let isFlagged = myFlags[q.id];

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

function submitQ(auto) {
    if (auto) {
        executeSubmit();
    } else {
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to submit your answers and finish the quiz?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary-color)',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, finish it!'
        }).then((result) => {
            if (result.isConfirmed) {
                executeSubmit();
            }
        });
    }
}

function executeSubmit() {
    clearInterval(timerInt);

    let counts = 0;
    let pending = 0;
    let report = [];

    for (let i = 0; i < myQuizData.questions.length; i++) {
        let q = myQuizData.questions[i];
        let selected = myAnswers[q.id];
        let isCorrect = false;
        let status = 'wrong'; // correct, wrong, pending

        if (q.type === 'sa') {
            if (q.scoring === 'manual') {
                status = 'pending';
                pending++;
            } else {
                // Exact match (case insensitive)
                isCorrect = (selected || "").toString().toLowerCase().trim() === (q.correctText || "").toLowerCase().trim();
                if (isCorrect) {
                    counts++;
                    status = 'correct';
                }
            }
        } else {
            // MCQ or TF
            isCorrect = (selected === q.correct);
            if (isCorrect) {
                counts++;
                status = 'correct';
            }
        }

        let item = {
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

    let now = new Date().toISOString();
    let timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
    let timeTakenFormatted = "";
    if (timeSpentSeconds < 60) {
        timeTakenFormatted = timeSpentSeconds + "s";
    } else {
        timeTakenFormatted = Math.floor(timeSpentSeconds / 60) + "m " + (timeSpentSeconds % 60) + "s";
    }

    let res = {
        quizId: myQuizData.id,
        quizTitle: myQuizData.title,
        timestamp: now,
        timeTaken: timeTakenFormatted,
        score: counts,
        pending: pending,
        total: myQuizData.questions.length,
        percentage: Math.round((counts / myQuizData.questions.length) * 100),
        details: report
    };

    localStorage.setItem('cbt_last_result', JSON.stringify(res));

    let history = JSON.parse(localStorage.getItem('cbt_score_history') || '[]');
    history.push({
        quizId: myQuizData.id,
        quizTitle: myQuizData.title,
        score: counts,
        pending: pending,
        total: myQuizData.questions.length,
        percentage: Math.round((counts / myQuizData.questions.length) * 100),
        timestamp: now,
        timeTaken: timeTakenFormatted
    });
    localStorage.setItem('cbt_score_history', JSON.stringify(history));

    // Store for admin review
    let allSubmissions = JSON.parse(localStorage.getItem('cbt_all_submissions') || '[]');
    let user = getUser();
    res.userName = user ? user.name : 'Anonymous';
    res.userEmail = user ? user.email : '';
    allSubmissions.push(res);
    localStorage.setItem('cbt_all_submissions', JSON.stringify(allSubmissions));

    window.location.href = 'result.html';
}

document.addEventListener('DOMContentLoaded', quizInit);
