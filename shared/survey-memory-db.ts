// Feature: Surveys | Trace: src/features/surveys/trace.md
import { db, auth } from './firebase.utils';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    increment,
    serverTimestamp
} from 'firebase/firestore';

export interface SurveyAnswer {
    id?: string;
    question_context: string;
    answer_given: string;
    success_weight: number;
    created_at?: any;
    user_id?: string;
}

const COLLECTION_NAME = 'survey_memory';

export const recordAnswer = async (question: string, answer: string) => {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        question_context: question,
        answer_given: answer,
        success_weight: 0,
        created_at: serverTimestamp(),
        user_id: user?.uid || 'anonymous'
    });
    return docRef.id;
};

export const getHighlyRatedAnswers = async (limitCount: number = 10) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('success_weight', 'desc'),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const answers: SurveyAnswer[] = [];
    querySnapshot.forEach((doc) => {
        answers.push({ id: doc.id, ...doc.data() } as SurveyAnswer);
    });
    return answers;
};

export const recordSuccessWeight = async (ids: string[]) => {
    for (const id of ids) {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            success_weight: increment(1)
        });
    }
};

export const recordDisqualificationPenalty = async (disputedAnswerId: string) => {
    const docRef = doc(db, COLLECTION_NAME, disputedAnswerId);
    await updateDoc(docRef, {
        success_weight: increment(-10)
    });
};

// Legacy compatibility
export const initSurveyDB = async () => {
    console.log("Firestore SurveyMemory Initialized");
    return true;
};
