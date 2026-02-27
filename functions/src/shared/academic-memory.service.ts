// Feature: Academic | Trace: README.md
import { db } from './firebase.utils';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    doc,
    setDoc
} from 'firebase/firestore';
import { sanitizeForCloud } from '../../../shared/safe-cloud.utils';

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
    courseId?: string
) => {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeForCloud({
        domain,
        context_type: contextType,
        content,
        course_id: courseId,
        created_at: serverTimestamp(),
        user_id: user?.uid || 'anonymous'
    }));
    return docRef.id;
};

export const getAcademicContext = async (domain: string, courseId?: string) => {
    const user = auth.currentUser;
    if (!user) return [];

    let q = query(
        collection(db, COLLECTION_NAME),
        where('user_id', '==', user.uid),
        where('domain', '==', domain),
        orderBy('created_at', 'desc'),
        limit(20)
    );

    // If courseId is provided, secondary filtering or a different query might be needed
    // For now we fetch all domain relevant and filter locally to keep it simple
    const querySnapshot = await getDocs(q);
    const results: AcademicMemory[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!courseId || data.course_id === courseId) {
            results.push({ id: doc.id, ...data } as AcademicMemory);
        }
    });

    return results;
};

export const recordDeadline = async (assignment: string, dueDate: string, domain: string) => {
    const user = auth.currentUser;
    await addDoc(collection(db, 'academic_deadlines'), sanitizeForCloud({
        assignment,
        due_date: dueDate,
        domain,
        user_id: user?.uid || 'anonymous',
        timestamp: serverTimestamp()
    }));
};
