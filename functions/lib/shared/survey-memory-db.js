"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSurveyDB = exports.recordDisqualificationPenalty = exports.recordSuccessWeight = exports.getHighlyRatedAnswers = exports.recordAnswer = void 0;
// Feature: Survey Memory | Trace: README.md
const firebase_utils_1 = require("./firebase.utils");
const COLLECTION_NAME = 'survey_memory';
const recordAnswer = async (question, answer, userId = 'anonymous') => {
    const docRef = await firebase_utils_1.db.collection(COLLECTION_NAME).add({
        question_context: question,
        answer_given: answer,
        success_weight: 0,
        created_at: new Date().toISOString(),
        user_id: userId
    });
    return docRef.id;
};
exports.recordAnswer = recordAnswer;
const getHighlyRatedAnswers = async (limitCount = 10) => {
    const querySnapshot = await firebase_utils_1.db.collection(COLLECTION_NAME)
        .orderBy('success_weight', 'desc')
        .limit(limitCount)
        .get();
    const answers = [];
    querySnapshot.forEach((doc) => {
        answers.push(Object.assign({ id: doc.id }, doc.data()));
    });
    return answers;
};
exports.getHighlyRatedAnswers = getHighlyRatedAnswers;
const recordSuccessWeight = async (ids) => {
    for (const id of ids) {
        await firebase_utils_1.db.collection(COLLECTION_NAME).doc(id).update({
            success_weight: firebase_utils_1.FieldValue.increment(1)
        });
    }
};
exports.recordSuccessWeight = recordSuccessWeight;
const recordDisqualificationPenalty = async (disputedAnswerId) => {
    await firebase_utils_1.db.collection(COLLECTION_NAME).doc(disputedAnswerId).update({
        success_weight: firebase_utils_1.FieldValue.increment(-10)
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