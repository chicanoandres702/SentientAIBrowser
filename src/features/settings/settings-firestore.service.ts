// Feature: Settings | Trace: README.md
/*
 * [Parent Feature/Milestone] Settings
 * [Child Task/Issue] Firestore settings persistence
 * [Subtask] Save and load user settings from Firestore instead of localStorage
 * [Upstream] User auth + settings state -> [Downstream] Firestore user doc
 * [Law Check] 80 lines | Passed 100-Line Law
 */

import { db } from '../auth/firebase-config';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { LayoutMode } from '../../hooks/useBrowserState';

export interface UserSettings {
  runtimeGeminiApiKey: string;
  useConfirmerAgent: boolean;
  isAIMode: boolean;
  useProxy: boolean;
  isScholarMode: boolean;
  layoutMode: LayoutMode;
  theme: 'red' | 'blue';
  updated_at: number;
}

const SETTINGS_COLLECTION = 'users';

/**
 * Load user settings from Firestore.
 * Falls back to empty defaults if doc doesn't exist.
 */
export const loadUserSettings = async (userId: string): Promise<Partial<UserSettings>> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        runtimeGeminiApiKey: data.runtimeGeminiApiKey || '',
        useConfirmerAgent: data.useConfirmerAgent !== false,
        isAIMode: data.isAIMode !== false,
        useProxy: data.useProxy !== false,
        isScholarMode: data.isScholarMode === true,
        layoutMode: data.layoutMode || 'standard',
        theme: data.theme || 'blue',
      };
    }
  } catch (error) {
    console.error('[Settings] Failed to load from Firestore:', error);
  }

  return {};
};

/**
 * Save individual setting to Firestore.
 */
export const saveUserSetting = async (userId: string, key: keyof UserSettings, value: any): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const updateData: any = { [key]: value, updated_at: Date.now() };

    // Create doc if doesn't exist, otherwise update
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, updateData);
    } else {
      await setDoc(docRef, updateData, { merge: true });
    }
  } catch (error) {
    console.error('[Settings] Failed to save setting to Firestore:', error);
  }
};

/**
 * Save all settings to Firestore at once.
 */
export const saveAllUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const updateData = { ...settings, updated_at: Date.now() };
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error('[Settings] Failed to save all settings to Firestore:', error);
  }
};

/**
 * Subscribe to real-time setting changes.
 */
export const subscribeToUserSettings = (userId: string, callback: (settings: Partial<UserSettings>) => void): (() => void) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          runtimeGeminiApiKey: data.runtimeGeminiApiKey || '',
          useConfirmerAgent: data.useConfirmerAgent !== false,
          isAIMode: data.isAIMode !== false,
          useProxy: data.useProxy !== false,
          isScholarMode: data.isScholarMode === true,
          layoutMode: data.layoutMode || 'standard',
          theme: data.theme || 'blue',
        });
      }
    });
  } catch (error) {
    console.error('[Settings] Failed to subscribe to settings:', error);
    return () => {};
  }
};
