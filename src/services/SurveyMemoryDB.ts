import * as SQLite from 'expo-sqlite';

export interface SurveyAnswer {
    id?: number;
    question_context: string;
    answer_given: string;
    success_weight: number;
    created_at?: string;
}

const dbName = 'survey_memory.db';

export const initSurveyDB = async () => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_context TEXT NOT NULL,
      answer_given TEXT NOT NULL,
      success_weight INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log("SurveyMemory DB Initialized");
    return db;
};

export const recordAnswer = async (question: string, answer: string) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    const result = await db.runAsync(
        'INSERT INTO answers (question_context, answer_given) VALUES (?, ?)',
        question,
        answer
    );
    return result.lastInsertRowId;
};

export const getHighlyRatedAnswers = async (limit: number = 10) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    const rows = await db.getAllAsync<SurveyAnswer>(
        'SELECT * FROM answers ORDER BY success_weight DESC LIMIT ?',
        [limit]
    );
    return rows;
};

// If survey succeeds and rewards SB
export const recordSuccessWeight = async (ids: number[]) => {
    if (!ids.length) return;
    const db = await SQLite.openDatabaseAsync(dbName);
    // Using a loop for parameter binding on array of IDs
    for (const id of ids) {
        await db.runAsync('UPDATE answers SET success_weight = success_weight + 1 WHERE id = ?', id);
    }
};

// If a survey kicks out and disqualifies the user
// Penalize the immediate last question heavily so the bot avoids that specific answer forever
export const recordDisqualificationPenalty = async (disputedAnswerId: number) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.runAsync('UPDATE answers SET success_weight = success_weight - 10 WHERE id = ?', disputedAnswerId);
};
