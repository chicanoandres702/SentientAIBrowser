// Feature: Core | Trace: README.md
import { useState } from 'react';
import { GitHubService } from '../features/github/github.service';
import { Alert } from 'react-native';

export const useGitHubActions = (githubToken: string, repoOwner: string, repoName: string) => {
    const handleCreateIssue = async (title: string, body: string) => {
        if (!githubToken || !repoOwner || !repoName) {
            console.warn('[GitHub] Credentials missing');
            return;
        }

        const service = new GitHubService(githubToken, repoOwner, repoName);
        try {
            const result = await service.createIssue(title, body);
            Alert.alert("GitHub Issue Created", `Issue #${result.number} has been logged.`);
        } catch (e) {
            console.error("Failed to log GitHub issue:", e);
        }
    };

    const handleRecordKnowledge = async (path: string, knowledge: string) => {
        if (!githubToken || !repoOwner || !repoName) return;
        const service = new GitHubService(githubToken, repoOwner, repoName);
        try {
            await service.recordKnowledge(path, knowledge);
            console.log(`[GitHub] Knowledge recorded to ${path}`);
        } catch (e) {
            console.error("Failed to record knowledge:", e);
        }
    };

    const handleLookupDocumentation = async (query: string) => {
        if (!githubToken || !repoOwner || !repoName) return [];
        const service = new GitHubService(githubToken, repoOwner, repoName);
        try {
            return await service.lookupDocumentation(query);
        } catch (e) {
            console.error("Failed to lookup documentation:", e);
            return [];
        }
    };

    const handleSyncTasks = async (tasks: any[]) => {
        if (!githubToken || !repoOwner || !repoName) return;
        const service = new GitHubService(githubToken, repoOwner, repoName);
        try {
            await service.syncTasksToIssues(tasks);
            console.log(`[GitHub] Tasks synced to issues`);
        } catch (e) {
            console.error("Failed to sync tasks to GitHub:", e);
        }
    };

    return { handleCreateIssue, handleRecordKnowledge, handleLookupDocumentation, handleSyncTasks };
};
