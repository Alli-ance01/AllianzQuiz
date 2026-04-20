// Firebase Authentication Helper Functions

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Monitor user status in real-time (e.g., to detect if account is disabled)
export function monitorUserStatus(userId, callback) {
    if (!userId) return null;
    const docRef = doc(db, 'users', userId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error monitoring user status:", error);
    });
}

// Sign up a new user with email, password, and role
export async function signUp(email, password, displayName, role = 'student') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(user, { displayName: displayName });

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date()
    });

    return user;
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

// Update user profile
export async function updateUserProfile(newName) {
    const user = getCurrentUser();
    if (!user) throw new Error("No user logged in");

    // Update Firebase Auth
    await updateProfile(user, { displayName: newName });

    // Update Firestore Profile
    await updateDoc(doc(db, 'users', user.uid), {
        displayName: newName
    });
    
    return true;
}

// Change user password (requires re-authentication for security)
export async function changeUserPassword(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) throw new Error("No user logged in");

    // Re-authenticate first (Firebase requires this for sensitive operations)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Now update the password
    await updatePassword(user, newPassword);
    return true;
}
