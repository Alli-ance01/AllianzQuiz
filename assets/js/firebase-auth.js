// Firebase Authentication Helper Functions

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sign up a new user with email, password, and role
export async function signUp(email, password, displayName, role = 'student') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date()
    });

    // Send email verification
    await sendEmailVerification(user);

    return user;
}

// Send password reset email
export async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
}

// Sign in existing user
export async function signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

// Sign out current user
export async function signOutUser() {
    await signOut(auth);
}

// Get current authenticated user
export function getCurrentUser() {
    return auth.currentUser;
}

// Get user profile from Firestore (includes role)
export async function getUserProfile(userId) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

// Listen for auth state changes
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// Check if current user is admin/teacher
export async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && (profile.role === 'admin' || profile.role === 'teacher');
}

// Check if current user is student
export async function isStudent() {
    const user = getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && profile.role === 'student';
}
