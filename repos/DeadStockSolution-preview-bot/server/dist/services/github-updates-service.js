"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitHubUpdates = getGitHubUpdates;
exports.resetGitHubUpdatesCacheForTests = resetGitHubUpdatesCacheForTests;
const number_utils_1 = require("../utils/number-utils");
const logger_1 = require("./logger");
const http_utils_1 = require("../utils/http-utils");
const DEFAULT_REPOSITORY = 'yusuketakuma/DeadStockSolution';
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const MIN_CACHE_TTL_SECONDS = 30;
const MAX_CACHE_TTL_SECONDS = 3600;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 20_000;
const MIN_RETRIES = 0;
const MAX_RETRIES = 3;
const MAX_BODY_LENGTH = 2400;
const MAX_ERROR_BODY_LENGTH = 320;
let updatesCache = null;
function normalizeRepository(raw) {
    const candidate = raw?.trim();
    if (!candidate) {
        return DEFAULT_REPOSITORY;
    }
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(candidate)) {
        return candidate;
    }
    logger_1.logger.warn('Invalid GitHub repository config for updates. Falling back to default repository.', {
        configuredRepository: candidate,
        fallbackRepository: DEFAULT_REPOSITORY,
    });
    return DEFAULT_REPOSITORY;
}
function resolveRepository() {
    return normalizeRepository(process.env.GITHUB_UPDATES_REPOSITORY
        ?? process.env.GITHUB_REPOSITORY
        ?? undefined);
}
function resolveLimit() {
    return (0, number_utils_1.parseBoundedInt)(process.env.GITHUB_UPDATES_LIMIT, 100, MIN_LIMIT, MAX_LIMIT);
}
function resolveCacheTtlMs() {
    const ttlSeconds = (0, number_utils_1.parseBoundedInt)(process.env.GITHUB_UPDATES_CACHE_TTL_SECONDS, 300, MIN_CACHE_TTL_SECONDS, MAX_CACHE_TTL_SECONDS);
    return ttlSeconds * 1000;
}
function resolveTimeoutMs() {
    return (0, number_utils_1.parseBoundedInt)(process.env.GITHUB_UPDATES_TIMEOUT_MS, 5000, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS);
}
function includePrerelease() {
    return (0, number_utils_1.parseBooleanFlag)(process.env.GITHUB_UPDATES_INCLUDE_PRERELEASE, false);
}
function resolveRetries() {
    return (0, number_utils_1.parseBoundedInt)(process.env.GITHUB_UPDATES_RETRIES, 1, MIN_RETRIES, MAX_RETRIES);
}
function normalizeBody(value) {
    if (typeof value !== 'string')
        return '';
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    return trimmed.length > MAX_BODY_LENGTH ? `${trimmed.slice(0, MAX_BODY_LENGTH)}...` : trimmed;
}
function normalizeTitle(name, tag) {
    if (typeof name === 'string' && name.trim()) {
        return name.trim();
    }
    return tag;
}
function parseRelease(item) {
    if (!item || typeof item !== 'object')
        return null;
    const release = item;
    if (typeof release.id !== 'number'
        || typeof release.tag_name !== 'string'
        || typeof release.html_url !== 'string') {
        return null;
    }
    return {
        id: String(release.id),
        tag: release.tag_name,
        title: normalizeTitle(release.name, release.tag_name),
        body: normalizeBody(release.body),
        url: release.html_url,
        publishedAt: typeof release.published_at === 'string' ? release.published_at : null,
        prerelease: Boolean(release.prerelease),
    };
}
async function fetchGitHubReleaseUpdates(repository) {
    const perPage = resolveLimit();
    const timeoutMs = resolveTimeoutMs();
    const retries = resolveRetries();
    const includePrereleaseReleases = includePrerelease();
    const token = process.env.GITHUB_UPDATES_TOKEN?.trim();
    const url = `https://api.github.com/repos/${repository}/releases?per_page=${perPage}`;
    try {
        const response = await (0, http_utils_1.fetchWithTimeout)(url, {
            timeoutMs,
            retry: { retries },
            redirect: 'manual',
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'DeadStockSolution/updates-widget',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (response.status >= 300 && response.status < 400) {
            throw new Error(`GitHub API redirect response is not allowed: ${response.status}`);
        }
        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            const compactError = errorBody.trim().slice(0, MAX_ERROR_BODY_LENGTH);
            throw new Error(`GitHub API ${response.status}${compactError ? `: ${compactError}` : ''}`);
        }
        const raw = await response.json();
        if (!Array.isArray(raw)) {
            throw new Error('GitHub API returned a non-array releases response');
        }
        const releases = raw
            .filter((item) => Boolean(item) && typeof item === 'object')
            .filter((item) => !item.draft)
            .filter((item) => includePrereleaseReleases || !item.prerelease)
            .map((item) => parseRelease(item))
            .filter((item) => item !== null)
            .slice(0, perPage);
        return {
            repository,
            source: 'github_releases',
            stale: false,
            fetchedAt: new Date().toISOString(),
            items: releases,
        };
    }
    catch (err) {
        if (err instanceof http_utils_1.FetchTimeoutError || (err instanceof DOMException && err.name === 'AbortError')) {
            throw new Error(`GitHub updates request timed out after ${timeoutMs}ms`);
        }
        throw err;
    }
}
async function getGitHubUpdates() {
    const repository = resolveRepository();
    const now = Date.now();
    if (updatesCache
        && updatesCache.repository === repository
        && updatesCache.expiresAtMs > now) {
        return updatesCache.payload;
    }
    try {
        const payload = await fetchGitHubReleaseUpdates(repository);
        updatesCache = {
            repository,
            expiresAtMs: now + resolveCacheTtlMs(),
            payload,
        };
        return payload;
    }
    catch (err) {
        if (updatesCache && updatesCache.repository === repository) {
            logger_1.logger.warn('GitHub updates fetch failed. Serving stale updates cache.', {
                repository,
                error: err instanceof Error ? err.message : String(err),
            });
            return {
                ...updatesCache.payload,
                stale: true,
            };
        }
        throw err;
    }
}
function resetGitHubUpdatesCacheForTests() {
    updatesCache = null;
}
//# sourceMappingURL=github-updates-service.js.map