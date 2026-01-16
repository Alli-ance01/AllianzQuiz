// Firebase Firestore Database Helper Functions

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
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==================== QUIZ FUNCTIONS ====================

// Generate a unique 6-character access code for private quizzes
function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper to sort by createdAt descending
function sortByCreatedAtDesc(docs) {
    return docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });
}

// Helper to sort by timestamp descending
function sortByTimestampDesc(docs) {
    return docs.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
    });
}

// Create a new quiz
export async function createQuiz(quizData) {
    const quizToSave = {
        ...quizData,
        createdAt: new Date()
    };

    // Generate access code for private quizzes
    if (quizData.visibility === 'private') {
        quizToSave.accessCode = generateAccessCode();
    }

    const docRef = await addDoc(collection(db, 'quizzes'), quizToSave);
    return { id: docRef.id, ...quizToSave };
}

// Get all quizzes created by a specific admin
export async function getQuizzesByCreator(userId) {
    const q = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByCreatedAtDesc(docs);
}

// Get all public quizzes (for student dashboard)
export async function getPublicQuizzes() {
    const q = query(
        collection(db, 'quizzes'),
        where('visibility', '==', 'public')
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByCreatedAtDesc(docs);
}

// Get a quiz by its access code (for private quiz access)
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

// Get a single quiz by ID
export async function getQuizById(quizId) {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

// Update a quiz
export async function updateQuiz(quizId, data) {
    const docRef = doc(db, 'quizzes', quizId);
    await updateDoc(docRef, data);
}

// Delete a quiz
export async function deleteQuizById(quizId) {
    const docRef = doc(db, 'quizzes', quizId);
    await deleteDoc(docRef);
}

// ==================== SUBMISSION FUNCTIONS ====================
// NOTE: Using 'attempts' collection to match Firestore security rules

// Save a quiz submission
export async function saveSubmission(submissionData) {
    const docRef = await addDoc(collection(db, 'attempts'), {
        ...submissionData,
        timestamp: new Date()
    });
    return { id: docRef.id, ...submissionData };
}

// Get all submissions for a specific quiz (for admin grading)
export async function getSubmissionsByQuiz(quizId) {
    const q = query(
        collection(db, 'attempts'),
        where('quizId', '==', quizId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByTimestampDesc(docs);
}

// Get all submissions for quizzes created by a specific admin
export async function getSubmissionsByQuizCreator(creatorId) {
    const q = query(
        collection(db, 'attempts'),
        where('quizCreatorId', '==', creatorId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByTimestampDesc(docs);
}

// Get all submissions by a specific user (for student history)
export async function getSubmissionsByUser(userId) {
    const q = query(
        collection(db, 'attempts'),
        where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sortByTimestampDesc(docs);
}

// Get a single submission by ID
export async function getSubmissionById(submissionId) {
    const docRef = doc(db, 'attempts', submissionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

// Update a submission (for grading)
export async function updateSubmission(submissionId, data) {
    const docRef = doc(db, 'attempts', submissionId);
    await updateDoc(docRef, data);
}

// Grade a specific question in a submission
export async function gradeQuestion(submissionId, questionId, isCorrect) {
    const submission = await getSubmissionById(submissionId);
    if (!submission) return null;

    // Find and update the question in details
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

    // Recalculate score and pending count
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
