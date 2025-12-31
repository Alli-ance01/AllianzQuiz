function login(name, email) {
    let user = {
        name: name,
        email: email,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('cbt_user', JSON.stringify(user));
    return user;
}

function getUser() {
    let userStr = localStorage.getItem('cbt_user');
    if (userStr) {
        return JSON.parse(userStr);
    } else {
        return null;
    }
}

function logout() {
    localStorage.removeItem('cbt_user');
    window.location.href = 'index.html';
}

function checkAuth() {
    if (!getUser() && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

function init() {
    let loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let name = document.getElementById('username').value;
            let email = document.getElementById('email').value;

            if (name && email) {
                login(name, email);
                window.location.href = 'dashboard.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
