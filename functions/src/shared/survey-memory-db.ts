// Feature: Survey Memory | Trace: README.md
import { db, FieldValue } from './firebase.utils';

export interface SurveyAnswer {
    id?: string;
    question_context: string;
    answer_given: string;
    success_weight: number;
    created_at?: any;
    user_id?: string;
}

const COLLECTION_NAME = 'survey_memory';

export const recordAnswer = async (question: string, answer: string, userId: string = 'anonymous') => {
    const docRef = await db.collection(COLLECTION_NAME).add({
        question_context: question,
        answer_given: answer,
        success_weight: 0,
        created_at: new Date().toISOString(),
        user_id: userId
    });
    return docRef.id;
};

export const getHighlyRatedAnswers = async (limitCount: number = 10) => {
    const querySnapshot = await db.collection(COLLECTION_NAME)
        .orderBy('success_weight', 'desc')
        .limit(limitCount)
        .get();
    const answers: SurveyAnswer[] = [];
    querySnapshot.forEach((doc) => {
        answers.push({ id: doc.id, ...doc.data() } as SurveyAnswer);
    });
    return answers;
};

export const recordSuccessWeight = async (ids: string[]) => {
    for (const id of ids) {
        await db.collection(COLLECTION_NAME).doc(id).update({
            success_weight: FieldValue.increment(1)
        });
    }
};

export const recordDisqualificationPenalty = async (disputedAnswerId: string) => {
    await db.collection(COLLECTION_NAME).doc(disputedAnswerId).update({
        success_weight: FieldValue.increment(-10)
    });
};

// Legacy compatibility
export const initSurveyDB = async () => {
    console.log("Firestore SurveyMemory Initialized");
    return true;
};
