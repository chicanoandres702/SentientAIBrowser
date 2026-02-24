import axios from 'axios';

const GIT_COMMIT_URL = 'http://localhost:3000/git/commit';

export const useGitAutoCommit = () => {
    const handleAutoCommit = async (message?: string) => {
        try {
            console.log("[Git Engine] Triggering auto-commit...");
            const response = await axios.post(GIT_COMMIT_URL, { message });
            if (response.data.success) {
                console.log("[Git Engine] Auto-commit successful:", response.data.output);
            }
        } catch (e: unknown) {
            console.error("[Git Engine] Auto-commit failed:", e instanceof Error ? e.message : e);
        }
    };

    return { handleAutoCommit };
};
