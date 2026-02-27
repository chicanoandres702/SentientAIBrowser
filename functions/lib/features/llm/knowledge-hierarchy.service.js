"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelevantContext = exports.saveContextualKnowledge = void 0;
// Feature: AI Memory | Trace: implementation_plan.md
const firebase_config_1 = require("../../auth/firebase-config");
/**
 * Why: Manages private, hierarchical knowledge to help the AI know where it left off
 * in complex project or multi-context environments.
 */
const saveContextualKnowledge = async (userId, context, type, content) => {
    await firebase_config_1.db.collection('user_knowledge').add(Object.assign(Object.assign({ userId }, context), { type,
        content, updated_at: new Date().toISOString() }));
};
exports.saveContextualKnowledge = saveContextualKnowledge;
const getRelevantContext = async (userId, context) => {
    // Fetch rules and latest breadcrumb for this specific context
    const snapshot = await firebase_config_1.db.collection('user_knowledge')
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
exports.getRelevantContext = getRelevantContext;
//# sourceMappingURL=knowledge-hierarchy.service.js.map