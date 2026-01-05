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
