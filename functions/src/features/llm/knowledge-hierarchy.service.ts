// Feature: AI Memory | Trace: implementation_plan.md
import { db } from '../../auth/firebase-config';

export interface KnowledgeContext {
    groupId?: string;      // e.g., "Work", "School", "Finance"
    contextId?: string;    // e.g., "PSY101", "ProjectSentinel", "Taxes2024"
    unitId?: string;       // e.g., "Unit1", "API_Docs", "ReceiptBatch"
}

/**
 * Why: Manages private, hierarchical knowledge to help the AI know where it left off
 * in complex project or multi-context environments.
 */
export const saveContextualKnowledge = async (
    userId: string,
    context: KnowledgeContext,
    type: 'rule' | 'book_info' | 'breadcrumb',
    content: string
) => {
    await db.collection('user_knowledge').add({
        userId,
        ...context,
        type,
        content,
        updated_at: new Date().toISOString()
    });
};

export const getRelevantContext = async (
    userId: string,
    context: KnowledgeContext
): Promise<string> => {
    // Fetch rules and latest breadcrumb for this specific context
    const snapshot = await db.collection('user_knowledge')
        .where('userId', '==', userId)
        .where('contextId', '==', context.contextId)
        .orderBy('updated_at', 'desc')
        .limit(10)
        .get();

    const knowledge = snapshot.docs.map(doc => {
        const d = doc.data();
        return `[${d.type.toUpperCase()}] ${d.content}`;
    });

    return knowledge.length > 0 
        ? `Relevant Context for ${context.contextId}:\n${knowledge.join('\n')}`
        : '';
};
