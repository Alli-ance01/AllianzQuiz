let questionsCount = 0;

function addQuestion() {
    questionsCount++;
    const container = document.getElementById('questionsList');
    const qDiv = document.createElement('div');
    qDiv.className = 'question-form-card';
    qDiv.id = `qForm_${questionsCount}`;
    qDiv.innerHTML = `
        <button type="button" class="remove-q-btn" onclick="removeQuestion(${questionsCount})">Remove</button>
        <div class="input-group">
            <label>Question ${questionsCount}</label>
            <input type="text" class="q-text" placeholder="Question text" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
            <input type="text" class="q-opt" placeholder="Option A" required>
            <input type="text" class="q-opt" placeholder="Option B" required>
            <input type="text" class="q-opt" placeholder="Option C" required>
            <input type="text" class="q-opt" placeholder="Option D" required>
        </div>
        <div class="input-group">
            <label>Correct Option Index (0-3)</label>
            <input type="number" class="q-correct" min="0" max="3" value="0" required>
        </div>
    `;
    container.appendChild(qDiv);
}

function removeQuestion(id) {
    const qDiv = document.getElementById(`qForm_${id}`);
    if (qDiv) qDiv.remove();
}

document.getElementById('quizForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = document.getElementById('quizTitle').value;
    const desc = document.getElementById('quizDesc').value;
    const duration = parseInt(document.getElementById('quizDuration').value);
    const id = document.getElementById('quizId').value;

    const questions = [];
    const qCards = document.querySelectorAll('.question-form-card');

    qCards.forEach(card => {
        const text = card.querySelector('.q-text').value;
        const options = Array.from(card.querySelectorAll('.q-opt')).map(opt => opt.value);
        const correct = parseInt(card.querySelector('.q-correct').value);

        questions.push({
            id: Date.now() + Math.random(),
            text: text,
            options: options,
            correct: correct
        });
    });

    if (questions.length === 0) {
        Swal.fire('Error', 'Please add at least one question!', 'error');
        return;
    }

    const newQuiz = {
        id: id,
        title: title,
        description: desc,
        duration: duration,
        questions: questions
    };

    let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');

    const existingIdx = customQuizzes.findIndex(q => q.id === id);
    if (existingIdx > -1) {
        const result = await Swal.fire({
            title: 'Overwrite Quiz?',
            text: 'A quiz with this ID already exists. Overwrite it?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, overwrite'
        });
        if (!result.isConfirmed) return;
        customQuizzes[existingIdx] = newQuiz;
    } else {
        customQuizzes.push(newQuiz);
    }

    localStorage.setItem('cbt_custom_quizzes', JSON.stringify(customQuizzes));
    Swal.fire('Success', 'Quiz saved successfully!', 'success');
    this.reset();
    document.getElementById('questionsList').innerHTML = "";
    questionsCount = 0;
    addQuestion();
    loadCustomQuizzes();
});

function loadCustomQuizzes() {
    const list = document.getElementById('customQuizList');
    const customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');

    if (customQuizzes.length === 0) {
        list.innerHTML = "<p style='color: var(--text-muted);'>No custom quizzes yet.</p>";
        return;
    }

    list.innerHTML = customQuizzes.map(q => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
            <div>
                <strong style="display: block;">${q.title}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${q.questions.length} Questions | ${q.duration} mins</span>
            </div>
            <button onclick="deleteQuiz('${q.id}')" style="color: var(--error-color); background: none; border: none; cursor: pointer;">Delete</button>
        </div>
    `).join('');
}

async function deleteQuiz(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        let customQuizzes = JSON.parse(localStorage.getItem('cbt_custom_quizzes') || '[]');
        customQuizzes = customQuizzes.filter(q => q.id !== id);
        localStorage.setItem('cbt_custom_quizzes', JSON.stringify(customQuizzes));
        Swal.fire('Deleted!', 'The quiz has been deleted.', 'success');
        loadCustomQuizzes();
    }
}

addQuestion();
loadCustomQuizzes();
