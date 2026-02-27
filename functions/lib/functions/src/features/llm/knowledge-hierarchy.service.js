"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelevantContext = exports.saveContextualKnowledge = void 0;
// Feature: AI Memory | Trace: implementation_plan.md
const firestore_1 = require("firebase/firestore");
const firebase_config_1 = require("../../auth/firebase-config");
/**
 * Why: Manages private, hierarchical knowledge to help the AI know where it left off
 * in complex project or multi-context environments.
 */
const saveContextualKnowledge = async (userId, context, type, content) => {
    const knowledgeRef = (0, firestore_1.collection)(firebase_config_1.db, 'user_knowledge');
    await (0, firestore_1.addDoc)(knowledgeRef, Object.assign(Object.assign({ userId }, context), { type,
        content, updated_at: (0, firestore_1.serverTimestamp)() }));
};
exports.saveContextualKnowledge = saveContextualKnowledge;
const getRelevantContext = async (userId, context) => {
    const knowledgeRef = (0, firestore_1.collection)(firebase_config_1.db, 'user_knowledge');
    // Fetch rules and latest breadcrumb for this specific context
    const q = (0, firestore_1.query)(knowledgeRef, (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.where)('contextId', '==', context.contextId), (0, firestore_1.orderBy)('updated_at', 'desc'), (0, firestore_1.limit)(10));
    const snapshot = await (0, firestore_1.getDocs)(q);
    const knowledge = snapshot.docs.map(doc => {
        const d = doc.data();
        return `[${d.type.toUpperCase()}] ${d.content}`;
    });
    return knowledge.length > 0
        ? `Relevant Context for ${context.contextId}:\n${knowledge.join('\n')}`
        : '';
};
exports.getRelevantContext = getRelevantContext;
//# sourceMappingURL=knowledge-hierarchy.service.js.map