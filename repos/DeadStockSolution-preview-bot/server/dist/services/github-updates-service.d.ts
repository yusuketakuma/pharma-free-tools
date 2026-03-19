export interface GitHubUpdateItem {
    id: string;
    tag: string;
    title: string;
    body: string;
    url: string;
    publishedAt: string | null;
    prerelease: boolean;
}
export interface GitHubUpdatesPayload {
    repository: string;
    source: 'github_releases';
    stale: boolean;
    fetchedAt: string;
    items: GitHubUpdateItem[];
}
export declare function getGitHubUpdates(): Promise<GitHubUpdatesPayload>;
export declare function resetGitHubUpdatesCacheForTests(): void;
//# sourceMappingURL=github-updates-service.d.ts.map