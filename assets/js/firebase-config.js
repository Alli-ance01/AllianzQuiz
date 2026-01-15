import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJDdpwJHjt_4ZtkbYwNvYQbPCl3DcHdI4",
    authDomain: "cbtproject-bca07.firebaseapp.com",
    projectId: "cbtproject-bca07",
    storageBucket: "cbtproject-bca07.firebasestorage.app",
    messagingSenderId: "337704025096",
    appId: "1:337704025096:web:3738bf67ad71254a97a5bd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
