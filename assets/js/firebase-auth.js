import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function signUp(email, password, displayName, role = 'student') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName,
        role: role,
        createdAt: new Date()
    });

    return user;
}

export async function signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signOutUser() {
    await signOut(auth);
}

export function getCurrentUser() {
    return auth.currentUser;
}

export async function getUserProfile(userId) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

export async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && (profile.role === 'admin' || profile.role === 'teacher');
}

export async function isStudent() {
    const user = getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.uid);
    return profile && profile.role === 'student';
}

export function monitorUserStatus(userId, callback) {
    const docRef = doc(db, 'users', userId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error monitoring user status:", error);
    });
}
