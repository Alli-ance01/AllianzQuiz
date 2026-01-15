import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Signup Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const submitBtn = document.getElementById('signupSubmit');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile name
            await updateProfile(user, { displayName: name });

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'user', // Default role
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            Swal.fire({
                title: 'Welcome!',
                text: 'Your account has been created successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'dashboard.html';
            });

        } catch (error) {
            console.error("Signup error:", error);
            let message = "An error occurred during signup.";
            if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
            if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";

            Swal.fire('Signup Failed', message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}

// Login Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmit');

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Update last login in Firestore
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });

            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error("Login error:", error);
            let message = "Invalid email or password.";
            if (error.code === 'auth/user-not-found') message = "No account found with this email.";
            if (error.code === 'auth/wrong-password') message = "Incorrect password.";

            Swal.fire('Login Failed', message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
}
