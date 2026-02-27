"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDeadline = exports.getAcademicContext = exports.recordAcademicKnowledge = void 0;
// Feature: Academic | Trace: README.md
const firebase_utils_1 = require("./firebase.utils");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const COLLECTION_NAME = 'academic_memory';
const recordAcademicKnowledge = async (domain, contextType, content, courseId, userId = 'anonymous') => {
    const docRef = await firebase_utils_1.db.collection(COLLECTION_NAME).add((0, safe_cloud_utils_1.sanitizeForCloud)({
        domain,
        context_type: contextType,
        content,
        course_id: courseId,
        created_at: new Date().toISOString(),
        user_id: userId,
    }));
    return docRef.id;
};
exports.recordAcademicKnowledge = recordAcademicKnowledge;
const getAcademicContext = async (domain, courseId, userId = 'default') => {
    if (!userId)
        return [];
    const querySnapshot = await firebase_utils_1.db.collection(COLLECTION_NAME)
        .where('user_id', '==', userId)
        .where('domain', '==', domain)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();
    const results = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!courseId || data.course_id === courseId) {
            results.push(Object.assign({ id: doc.id }, data));
        }
    });
    return results;
};
exports.getAcademicContext = getAcademicContext;
const recordDeadline = async (assignment, dueDate, domain, userId = 'anonymous') => {
    await firebase_utils_1.db.collection('academic_deadlines').add((0, safe_cloud_utils_1.sanitizeForCloud)({
        assignment,
        due_date: dueDate,
        domain,
        user_id: userId,
        timestamp: new Date().toISOString()
    }));
};
exports.recordDeadline = recordDeadline;
//# sourceMappingURL=academic-memory.service.js.map