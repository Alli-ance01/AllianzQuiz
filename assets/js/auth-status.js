import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    const isAuthPage = window.location.pathname.includes('auth.html') || window.location.pathname.includes('index.html');

    if (user) {
        // User is signed in, sync to localStorage
        let userData = {
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL
        };

        // Try to get role/extra data from Firestore if not in localStorage cache
        const cachedUser = localStorage.getItem('cbt_user');
        if (!cachedUser || JSON.parse(cachedUser).uid !== user.uid) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const firestoreData = userDoc.data();
                userData.role = firestoreData.role || 'user';
                userData.name = firestoreData.name || userData.name;
            }
        } else {
            userData = JSON.parse(cachedUser);
        }

        localStorage.setItem('cbt_user', JSON.stringify(userData));

        // If user is on an auth page, redirect to dashboard
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        localStorage.removeItem('cbt_user');

        // If user is NOT on an auth page, redirect to auth.html
        if (!isAuthPage) {
            window.location.href = 'auth.html';
        }
    }
});
