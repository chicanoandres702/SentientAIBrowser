// Feature: Surveys | Trace: src/features/surveys/trace.md
// Fetches high-yield survey answers from Firestore for persona memory hydration.
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export interface SurveyAnswer {
    id: string;
    question_context: string;
    answer_given: string;
    success_weight: number;
    created_at: { seconds: number };
}

export async function getHighlyRatedAnswers(maxCount: number): Promise<SurveyAnswer[]> {
    try {
        const db = getFirestore();
        const q = query(
            collection(db, 'survey_answers'),
            orderBy('success_weight', 'desc'),
            limit(maxCount)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SurveyAnswer));
    } catch {
        return [];
    }
}
