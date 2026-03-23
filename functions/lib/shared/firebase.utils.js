"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldValue = exports.db = exports.auth = void 0;
/**
 * Sentient File Header
 * Why: Firebase utility exports for Sentient AI Browser
 * Filepath: functions/src/shared/firebase.utils.ts
 * Description: Exports Firebase db, auth, and FieldValue for use in backend features
 * Trace: Used by backend, mission, and workflow modules
 * Wiring: Exported constants, consumed by backend and mission features
 */
// Feature: Firebase Utilities | Trace: README.md
const firebase_config_1 = require("../auth/firebase-config");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return firebase_config_1.db; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return firebase_config_1.auth; } });
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firebase_config_1.FieldValue; } });
//# sourceMappingURL=firebase.utils.js.map