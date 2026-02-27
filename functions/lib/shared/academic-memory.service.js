"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDeadline = exports.getAcademicContext = exports.recordAcademicKnowledge = void 0;
// Feature: Academic | Trace: README.md
const firebase_utils_1 = require("./firebase.utils");
const firestore_1 = require("firebase/firestore");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const COLLECTION_NAME = 'academic_memory';
const recordAcademicKnowledge = async (domain, contextType, content, courseId) => {
    const user = firebase_utils_1.auth.currentUser;
    const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_utils_1.db, COLLECTION_NAME), (0, safe_cloud_utils_1.sanitizeForCloud)({
        domain,
        context_type: contextType,
        content,
        course_id: courseId,
        created_at: (0, firestore_1.serverTimestamp)(),
        user_id: (user === null || user === void 0 ? void 0 : user.uid) || 'anonymous'
    }));
    return docRef.id;
};
exports.recordAcademicKnowledge = recordAcademicKnowledge;
const getAcademicContext = async (domain, courseId) => {
    const user = firebase_utils_1.auth.currentUser;
    if (!user)
        return [];
    let q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_utils_1.db, COLLECTION_NAME), (0, firestore_1.where)('user_id', '==', user.uid), (0, firestore_1.where)('domain', '==', domain), (0, firestore_1.orderBy)('created_at', 'desc'), (0, firestore_1.limit)(20));
    // If courseId is provided, secondary filtering or a different query might be needed
    // For now we fetch all domain relevant and filter locally to keep it simple
    const querySnapshot = await (0, firestore_1.getDocs)(q);
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
const recordDeadline = async (assignment, dueDate, domain) => {
    const user = firebase_utils_1.auth.currentUser;
    await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_utils_1.db, 'academic_deadlines'), (0, safe_cloud_utils_1.sanitizeForCloud)({
        assignment,
        due_date: dueDate,
        domain,
        user_id: (user === null || user === void 0 ? void 0 : user.uid) || 'anonymous',
        timestamp: (0, firestore_1.serverTimestamp)()
    }));
};
exports.recordDeadline = recordDeadline;
//# sourceMappingURL=academic-memory.service.js.map