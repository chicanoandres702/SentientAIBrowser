"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSurveyDB = exports.recordDisqualificationPenalty = exports.recordSuccessWeight = exports.getHighlyRatedAnswers = exports.recordAnswer = void 0;
// Feature: Surveys | Trace: src/features/surveys/trace.md
const firebase_utils_1 = require("./firebase.utils");
const firestore_1 = require("firebase/firestore");
const COLLECTION_NAME = 'survey_memory';
const recordAnswer = async (question, answer) => {
    const user = firebase_utils_1.auth.currentUser;
    const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_utils_1.db, COLLECTION_NAME), {
        question_context: question,
        answer_given: answer,
        success_weight: 0,
        created_at: (0, firestore_1.serverTimestamp)(),
        user_id: (user === null || user === void 0 ? void 0 : user.uid) || 'anonymous'
    });
    return docRef.id;
};
exports.recordAnswer = recordAnswer;
const getHighlyRatedAnswers = async (limitCount = 10) => {
    const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_utils_1.db, COLLECTION_NAME), (0, firestore_1.orderBy)('success_weight', 'desc'), (0, firestore_1.limit)(limitCount));
    const querySnapshot = await (0, firestore_1.getDocs)(q);
    const answers = [];
    querySnapshot.forEach((doc) => {
        answers.push(Object.assign({ id: doc.id }, doc.data()));
    });
    return answers;
};
exports.getHighlyRatedAnswers = getHighlyRatedAnswers;
const recordSuccessWeight = async (ids) => {
    for (const id of ids) {
        const docRef = (0, firestore_1.doc)(firebase_utils_1.db, COLLECTION_NAME, id);
        await (0, firestore_1.updateDoc)(docRef, {
            success_weight: (0, firestore_1.increment)(1)
        });
    }
};
exports.recordSuccessWeight = recordSuccessWeight;
const recordDisqualificationPenalty = async (disputedAnswerId) => {
    const docRef = (0, firestore_1.doc)(firebase_utils_1.db, COLLECTION_NAME, disputedAnswerId);
    await (0, firestore_1.updateDoc)(docRef, {
        success_weight: (0, firestore_1.increment)(-10)
    });
};
exports.recordDisqualificationPenalty = recordDisqualificationPenalty;
// Legacy compatibility
const initSurveyDB = async () => {
    console.log("Firestore SurveyMemory Initialized");
    return true;
};
exports.initSurveyDB = initSurveyDB;
//# sourceMappingURL=survey-memory-db.js.map