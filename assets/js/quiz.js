let myQuizData = null;
let currentQIdx = 0;
let myAnswers = {};
let myFlags = {};
let timerInt = null;
let timeLft = 0;

function quizInit() {
    checkAuth();

    let params = new URLSearchParams(window.location.search);
    let quizId = params.get('id');

    if (!quizId) {
        alert("No quiz specified!");
        window.location.href = 'dashboard.html';
        return;
    }

    for (let i = 0; i < myData.length; i++) {
        if (myData[i].id === quizId) {
            myQuizData = myData[i];
            break;
        }
    }

    if (!myQuizData) {
        alert("Quiz not found!");
        window.location.href = 'dashboard.html';
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
    loadQ(0);
    startT();
}

function startT() {
    let display = document.getElementById('timerDisplay');

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
            display.style.backgroundColor = 'red';
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
    for (let i = 0; i < question.options.length; i++) {
        let isSelected = myAnswers[question.id] === i;
        html += `
            <div class="option-card ${isSelected ? 'selected' : ''}" onclick="selAns(${question.id}, ${i})">
                <div class="option-circle"></div>
                <div>${question.options[i]}</div>
            </div>
        `;
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

function selAns(qId, optionIndex) {
    myAnswers[qId] = optionIndex;
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
    if (!auto && !confirm("Are you sure?")) return;

    clearInterval(timerInt);

    let counts = 0;
    let report = [];

    for (let i = 0; i < myQuizData.questions.length; i++) {
        let q = myQuizData.questions[i];
        let selected = myAnswers[q.id];
        let isCorrect = (selected === q.correct);

        if (isCorrect) {
            counts++;
        }

        let item = {
            questionId: q.id,
            text: q.text,
            selectedOption: selected !== undefined ? q.options[selected] : null,
            correctKey: q.options[q.correct],
            isCorrect: isCorrect
        };
        report.push(item);
    }

    let res = {
        quizId: myQuizData.id,
        quizTitle: myQuizData.title,
        timestamp: new Date().toISOString(),
        score: counts,
        total: myQuizData.questions.length,
        percentage: Math.round((counts / myQuizData.questions.length) * 100),
        details: report
    };

    localStorage.setItem('cbt_last_result', JSON.stringify(res));

    // Save to history
    let history = JSON.parse(localStorage.getItem('cbt_score_history') || '[]');
    history.push({
        quizId: myQuizData.id,
        quizTitle: myQuizData.title,
        score: counts,
        total: myQuizData.questions.length,
        percentage: Math.round((counts / myQuizData.questions.length) * 100),
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('cbt_score_history', JSON.stringify(history));
    window.location.href = 'result.html';
}

document.addEventListener('DOMContentLoaded', quizInit);
