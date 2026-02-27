// Feature: Academic | Trace: README.md
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface AcademicMemory {
    id?: string;
    domain: string;
    course_id?: string;
    context_type: 'instruction' | 'reading_list' | 'etiquette' | 'deadline';
    content: string;
    created_at?: any;
    user_id?: string;
}

const COLLECTION_NAME = 'academic_memory';

export const recordAcademicKnowledge = async (
    domain: string, 
    contextType: AcademicMemory['context_type'], 
    content: string,
    courseId?: string,
    userId: string = 'anonymous'
) => {
    const docRef = await db.collection(COLLECTION_NAME).add(sanitizeForCloud({
        domain,
        context_type: contextType,
        content,
        course_id: courseId,
        created_at: new Date().toISOString(),
        user_id: userId,
    }));
    return docRef.id;
};

export const getAcademicContext = async (domain: string, courseId?: string, userId: string = 'default') => {
    if (!userId) return [];

    const querySnapshot = await db.collection(COLLECTION_NAME)
        .where('user_id', '==', userId)
        .where('domain', '==', domain)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();

    const results: AcademicMemory[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!courseId || data.course_id === courseId) {
            results.push({ id: doc.id, ...data } as AcademicMemory);
        }
    });

    return results;
};

export const recordDeadline = async (assignment: string, dueDate: string, domain: string, userId: string = 'anonymous') => {
    await db.collection('academic_deadlines').add(sanitizeForCloud({
        assignment,
        due_date: dueDate,
        domain,
        user_id: userId,
        timestamp: new Date().toISOString()
    }));
};
