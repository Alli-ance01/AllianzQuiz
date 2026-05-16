import { db } from './firebase-config.js';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CACHE = {
    publicQuizzes: null,
    adminQuizzes: {},
    userSubmissions: {},
    quizSubmissions: {},
    cacheTime: {}
};

const CACHE_DURATION = 2 * 60 * 1000;

function isCacheValid(key) {
    if (!CACHE.cacheTime[key]) return false;
    return (Date.now() - CACHE.cacheTime[key]) < CACHE_DURATION;
}

function setCache(key, data) {
    CACHE.cacheTime[key] = Date.now();
    if (key === 'publicQuizzes') CACHE.publicQuizzes = data;
    else if (key.startsWith('adminQuizzes_')) CACHE.adminQuizzes[key.split('_')[1]] = data;
    else if (key.startsWith('userSubmissions_')) CACHE.userSubmissions[key.split('_')[1]] = data;
    else if (key.startsWith('quizSubmissions_')) CACHE.quizSubmissions[key.split('_')[1]] = data;
}

export function clearCache() {
    CACHE.publicQuizzes = null;
    CACHE.adminQuizzes = {};
    CACHE.userSubmissions = {};
    CACHE.quizSubmissions = {};
    CACHE.cacheTime = {};
}

function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function sortByCreatedAtDesc(docs) {
    return docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });
}

function sortByTimestampDesc(docs) {
    return docs.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
    });
}

export async function createQuiz(quizData) {
    const quizToSave = {
        ...quizData,
        createdAt: serverTimestamp()
    };

    if (quizData.visibility === 'private') {
        quizToSave.accessCode = generateAccessCode();
    }

    const docRef = await addDoc(collection(db, 'quizzes'), quizToSave);
    return { id: docRef.id, ...quizToSave };
}

export async function getQuizzesByCreator(userId) {
    const cacheKey = `adminQuizzes_${userId}`;
    if (isCacheValid(cacheKey)) return CACHE.adminQuizzes[userId];

    const q = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = sortByCreatedAtDesc(docs);
    setCache(cacheKey, sorted);
    return sorted;
}

export async function getPublicQuizzes() {
    if (isCacheValid('publicQuizzes')) return CACHE.publicQuizzes;

    const q = query(
        collection(db, 'quizzes'),
        where('visibility', '==', 'public')
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = sortByCreatedAtDesc(docs);
    setCache('publicQuizzes', sorted);
    return sorted;
}

export async function getQuizByAccessCode(code) {
    const q = query(
        collection(db, 'quizzes'),
        where('accessCode', '==', code.toUpperCase())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
}

export async function getQuizById(quizId) {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

export async function updateQuiz(quizId, data) {
    const docRef = doc(db, 'quizzes', quizId);
    await updateDoc(docRef, data);
}

export async function deleteQuizById(quizId) {
    const docRef = doc(db, 'quizzes', quizId);
    await deleteDoc(docRef);
}

export async function saveSubmission(submissionData) {
    const docRef = await addDoc(collection(db, 'attempts'), {
        ...submissionData,
        timestamp: serverTimestamp()
    });
    return { id: docRef.id, ...submissionData };
}

export async function getSubmissionsByQuiz(quizId) {
    const cacheKey = `quizSubmissions_${quizId}`;
    if (isCacheValid(cacheKey)) return CACHE.quizSubmissions[quizId];

    const q = query(
        collection(db, 'attempts'),
        where('quizId', '==', quizId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = sortByTimestampDesc(docs);
    setCache(cacheKey, sorted);
    return sorted;
}

export async function getSubmissionsByQuizCreator(creatorId) {
    const q = query(
        collection(db, 'attempts'),
        where('quizCreatorId', '==', creatorId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByTimestampDesc(docs);
}

export async function getSubmissionsByUser(userId) {
    const cacheKey = `userSubmissions_${userId}`;
    if (isCacheValid(cacheKey)) return CACHE.userSubmissions[userId];

    const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = sortByTimestampDesc(docs);
    setCache(cacheKey, sorted);
    return sorted;
}

export async function getSubmissionById(submissionId) {
    const docRef = doc(db, 'attempts', submissionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

export async function updateSubmission(submissionId, data) {
    const docRef = doc(db, 'attempts', submissionId);
    await updateDoc(docRef, data);
}

export async function gradeQuestion(submissionId, questionId, isCorrect) {
    const submission = await getSubmissionById(submissionId);
    if (!submission) return null;

    const updatedDetails = submission.details.map(d => {
        if (d.questionId == questionId) {
            return {
                ...d,
                status: isCorrect ? 'correct' : 'wrong',
                isCorrect: isCorrect
            };
        }
        return d;
    });

    let score = 0;
    let pending = 0;
    updatedDetails.forEach(d => {
        if (d.status === 'correct') score++;
        if (d.status === 'pending') pending++;
    });

    const percentage = Math.round((score / submission.total) * 100);

    await updateSubmission(submissionId, {
        details: updatedDetails,
        score: score,
        pending: pending,
        percentage: percentage
    });

    return { score, pending, percentage };
}

export async function getTopSubmissionsByQuiz(quizId, limitCount = 20) {
    const q = query(
        collection(db, 'attempts'),
        where('quizId', '==', quizId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by score descending, then time taken ascending
    docs.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // Parse timeTaken string to seconds for tie-breaking
        const getSeconds = (timeStr) => {
            if (!timeStr || timeStr === 'N/A') return Infinity;
            if (timeStr.includes('s') && !timeStr.includes('m')) return parseInt(timeStr);
            let m = 0, s = 0;
            const mMatch = timeStr.match(/(\d+)m/);
            const sMatch = timeStr.match(/(\d+)s/);
            if (mMatch) m = parseInt(mMatch[1]);
            if (sMatch) s = parseInt(sMatch[1]);
            return m * 60 + s;
        };
        return getSeconds(a.timeTaken) - getSeconds(b.timeTaken);
    });
    
    // Return unique users only (keep highest score per user)
    const uniqueUsers = [];
    const seenUserIds = new Set();
    
    for (const doc of docs) {
        if (doc.userId && !seenUserIds.has(doc.userId)) {
            seenUserIds.add(doc.userId);
            uniqueUsers.push(doc);
        } else if (!doc.userId) {
            // Anonymous submissions
            uniqueUsers.push(doc);
        }
        if (uniqueUsers.length >= limitCount) break;
    }
    
    return uniqueUsers;
}
