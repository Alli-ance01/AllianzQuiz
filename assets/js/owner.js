
import { db, auth } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const OWNER_EMAIL = 'owner@allianzquiz.com';  // Your Firebase Auth email
const OWNER_PASSWORD = 'AllianzOwner2026!';   // Your Firebase Auth password


function isAuthenticated() {
    return auth.currentUser !== null;
}

window.ownerLogout = async function () {
    await signOut(auth);
    location.reload();
};


function applyTheme() {
    let saved = localStorage.getItem('cbt_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

function toggleTheme() {
    let current = localStorage.getItem('cbt_theme') || 'dark';
    let next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('cbt_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    updateThemeIcon();
}

function updateThemeIcon() {
    let btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    let current = localStorage.getItem('cbt_theme') || 'dark';
    btn.innerHTML = current === 'light' ? '🌙' : '☀️';
}


let allUsers = [];
let allQuizzes = [];
let allSubmissions = [];


async function fetchAllUsers() {
    try {
        console.log('Fetching users...');
        const snapshot = await getDocs(collection(db, 'users'));
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Users fetched:', allUsers.length);
        return allUsers;
    } catch (error) {
        console.error('Error fetching users:', error);
        allUsers = [];
        return [];
    }
}

async function fetchAllQuizzes() {
    try {
        console.log('Fetching quizzes...');
        const snapshot = await getDocs(collection(db, 'quizzes'));
        allQuizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Quizzes fetched:', allQuizzes.length);
        return allQuizzes;
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        allQuizzes = [];
        return [];
    }
}

async function fetchAllSubmissions() {
    try {
        console.log('Fetching submissions...');
        const snapshot = await getDocs(collection(db, 'attempts'));
        allSubmissions = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                return dateB - dateA;
            });
        console.log('Submissions fetched:', allSubmissions.length);
        return allSubmissions;
    } catch (error) {
        console.error('Error fetching submissions:', error);
        allSubmissions = [];
        return [];
    }
}


function renderStats() {
    document.getElementById('statUsers').textContent = allUsers.length;
    document.getElementById('statQuizzes').textContent = allQuizzes.length;
    document.getElementById('statAttempts').textContent = allSubmissions.length;

    const avgScore = allSubmissions.length > 0
        ? Math.round(allSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / allSubmissions.length)
        : 0;
    document.getElementById('statAvgScore').textContent = avgScore + '%';
}

function renderUsers(users = allUsers) {
    const tbody = document.getElementById('usersBody');
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.displayName || 'N/A'}</strong></td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-warning' : 'badge-success'}">${user.role || 'student'}</span></td>
            <td><span class="badge ${user.disabled ? 'badge-error' : 'badge-success'}">${user.disabled ? 'Disabled' : 'Active'}</span></td>
            <td>
                ${user.disabled
            ? `<button class="action-btn action-btn-success" onclick="enableUser('${user.id}')">Enable</button>`
            : `<button class="action-btn action-btn-warning" onclick="disableUser('${user.id}')">Disable</button>`
        }
            </td>
        </tr>
    `).join('');
}

function renderQuizzes(quizzes = allQuizzes) {
    const tbody = document.getElementById('quizzesBody');
    if (quizzes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No quizzes found</td></tr>';
        return;
    }

    tbody.innerHTML = quizzes.map(quiz => {
        // Find creator name from user list
        const creator = allUsers.find(u => u.id === quiz.createdBy);
        const creatorName = creator ? creator.displayName : (quiz.creatorName || 'Unknown');

        return `
            <tr>
                <td><strong>${quiz.title || 'Untitled'}</strong></td>
                <td>${creatorName}</td>
                <td><span class="badge ${quiz.visibility === 'private' ? 'badge-warning' : 'badge-success'}">${quiz.visibility || 'public'}</span></td>
                <td>${quiz.questions?.length || 0}</td>
                <td>
                    <button class="action-btn action-btn-danger" onclick="deleteQuiz('${quiz.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSubmissions(submissions = allSubmissions) {
    const tbody = document.getElementById('submissionsBody');
    if (submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No submissions found</td></tr>';
        return;
    }

    tbody.innerHTML = submissions.map(sub => {
        const date = sub.timestamp?.toDate ? sub.timestamp.toDate() : new Date(sub.timestamp);
        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        return `
            <tr>
                <td>${sub.userName || 'Unknown'}</td>
                <td>${sub.quizTitle || 'Unknown'}</td>
                <td><span class="badge ${sub.percentage >= 50 ? 'badge-success' : 'badge-error'}">${sub.percentage || 0}%</span></td>
                <td>${dateStr}</td>
                <td>
                    <button class="action-btn action-btn-danger" onclick="deleteSubmission('${sub.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}


window.fixMyPermissions = async function () {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire('Error', 'You must be logged in to fix permissions.', 'error');
        return;
    }

    try {
        Swal.fire({
            title: 'Fixing Permissions...',
            text: 'Setting your role to owner in Firestore.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            role: 'owner',
            displayName: user.displayName || 'Site Owner',
            email: user.email
        }).catch(async (err) => {
            // If document doesn't exist, set it
            if (err.code === 'not-found' || err.message.includes('No document to update')) {
                const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
                await setDoc(userRef, {
                    role: 'owner',
                    displayName: user.displayName || 'Site Owner',
                    email: user.email,
                    createdAt: new Date()
                });
            } else {
                throw err;
            }
        });

        await refreshData();
        Swal.fire('Success!', 'Your role has been set to owner. Permissions updated.', 'success');
    } catch (error) {
        console.error('Error fixing permissions:', error);
        Swal.fire('Failed', 'Could not update permissions: ' + error.message, 'error');
    }
};


window.disableUser = async function (userId) {
    const confirmed = await Swal.fire({
        title: 'Disable User?',
        text: 'This user will not be able to log in.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disable'
    });

    if (confirmed.isConfirmed) {
        try {
            await updateDoc(doc(db, 'users', userId), { disabled: true });
            await refreshData();
            Swal.fire('Disabled!', 'User has been disabled.', 'success');
        } catch (error) {
            console.error('Error disabling user:', error);
            Swal.fire('Failed', 'Could not disable user: ' + error.message, 'error');
        }
    }
}

window.enableUser = async function (userId) {
    try {
        await updateDoc(doc(db, 'users', userId), { disabled: false });
        await refreshData();
        Swal.fire('Enabled!', 'User has been enabled.', 'success');
    } catch (error) {
        console.error('Error enabling user:', error);
        Swal.fire('Failed', 'Could not enable user: ' + error.message, 'error');
    }
};

window.deleteQuiz = async function (quizId) {
    const confirmed = await Swal.fire({
        title: 'Delete Quiz?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        confirmButtonColor: '#EF4444'
    });

    if (confirmed.isConfirmed) {
        await deleteDoc(doc(db, 'quizzes', quizId));
        await refreshData();
        Swal.fire('Deleted!', 'Quiz has been deleted.', 'success');
    }
};

window.deleteSubmission = async function (submissionId) {
    const confirmed = await Swal.fire({
        title: 'Delete Submission?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        confirmButtonColor: '#EF4444'
    });

    if (confirmed.isConfirmed) {
        await deleteDoc(doc(db, 'attempts', submissionId));
        await refreshData();
        Swal.fire('Deleted!', 'Submission has been deleted.', 'success');
    }
};


window.filterUsers = function () {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const filtered = allUsers.filter(u =>
        (u.displayName || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search)
    );
    renderUsers(filtered);
};

window.filterQuizzes = function () {
    const search = document.getElementById('quizSearch').value.toLowerCase();
    const filtered = allQuizzes.filter(q =>
        (q.title || '').toLowerCase().includes(search) ||
        (q.creatorName || '').toLowerCase().includes(search)
    );
    renderQuizzes(filtered);
};

window.filterSubmissions = function () {
    const search = document.getElementById('submissionSearch').value.toLowerCase();
    const filtered = allSubmissions.filter(s =>
        (s.userName || '').toLowerCase().includes(search) ||
        (s.quizTitle || '').toLowerCase().includes(search)
    );
    renderSubmissions(filtered);
};


window.switchTab = function (tabName) {
    document.querySelectorAll('.owner-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.owner-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.owner-tab:nth-child(${tabName === 'users' ? 1 : tabName === 'quizzes' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
};


async function refreshData() {
    // Show loading state in tables
    document.getElementById('usersBody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Refreshing...</td></tr>';
    document.getElementById('quizzesBody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Refreshing...</td></tr>';
    document.getElementById('submissionsBody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Refreshing...</td></tr>';

    await Promise.all([fetchAllUsers(), fetchAllQuizzes(), fetchAllSubmissions()]);

    renderStats();
    renderUsers();
    renderQuizzes();
    renderSubmissions();
}


function init() {
    applyTheme();

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';

    document.getElementById('ownerLoginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const key = document.getElementById('accessKey').value;

        try {
            await signInWithEmailAndPassword(auth, OWNER_EMAIL, key);
            // Auth state change will trigger showDashboard
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire('Access Denied', 'Invalid access key.', 'error');
        }
    });
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';

    await refreshData();
}

init();
