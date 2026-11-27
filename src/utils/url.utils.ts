import type { Provider } from '../validators/common.validators';
import { AppError } from './error.utils';

/**
 * Regex matching insecure HTTP protocols or protocol-relative prefixes.
 */
const INSECURE_URL_REGEX = /^(?:http:)?\/\//i;

/**
 * Upgrades an HTTP or protocol-relative URL to secure HTTPS.
 *
 * @param url - The input URL string to upgrade.
 * @returns The upgraded HTTPS URL, or the original string if empty or not an HTTP link.
 *
 * @example
 * ```ts
 * upgradeToHttps('http://c.saavncdn.com/song.mp3'); // 'https://c.saavncdn.com/song.mp3'
 * upgradeToHttps('//c.saavncdn.com/song.mp3');       // 'https://c.saavncdn.com/song.mp3'
 * ```
 */
export const upgradeToHttps = (url: string): string => {
    if (!url) {
        return url;
    }
    return url.replace(INSECURE_URL_REGEX, 'https://');
};

/**
 * Checks whether a given string is a valid HTTP or HTTPS URL.
 *
 * @param value - The string to validate as a URL.
 * @returns `true` if the string can be parsed as a valid HTTP or HTTPS URL with a hostname; otherwise `false`.
 *
 * @example
 * ```ts
 * isLink('https://www.jiosaavn.com/song/abc/123'); // true
 * isLink('not-a-link');                             // false
 * ```
 */
export const isLink = (value: string): boolean => {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
    } catch {
        return false;
    }
};

/**
 * Supported entity categories for URL ID extraction.
 */
export type MusicEntity = 'song' | 'album' | 'artist' | 'playlist' | 'label';

/**
 * Map of music entity types to regular expressions matching their URL structure.
 * A `null` value indicates the provider does not support URL extraction for that entity.
 */
export type MusicPatterns = Record<MusicEntity, RegExp | null>;

/**
 * Configuration schema for supported streaming music providers.
 */
export type ProviderConfig = {
    /** List of valid hostnames (case-insensitive) for this provider */
    hosts: readonly string[];
    /** Primary path patterns for extracting entity IDs */
    patterns: MusicPatterns;
    /** Optional secondary path patterns used if the primary pattern fails (e.g. web player URLs) */
    fallback?: MusicPatterns;
};

/* -------------------------------- Patterns -------------------------------- */

const SAAVN_PATTERNS: MusicPatterns = {
    song: /^\/(?:[a-z]{2}\/)?(?:s\/)?song\/[^/]+\/([^/?#]+)/i,
    album: /^\/(?:[a-z]{2}\/)?(?:s\/)?album\/[^/]+\/([^/?#]+)/i,
    artist: /^\/(?:[a-z]{2}\/)?(?:s\/)?artist\/[^/]+\/([^/?#]+)/i,
    playlist: /^\/(?:[a-z]{2}\/)?(?:s\/)?(?:featured|playlist)\/(?:[^/]+\/)?([^/?#]+)/i,
    label: null,
};

const GAANA_PATTERNS: MusicPatterns = {
    song: /^\/song\/([^/?#]+)/i,
    album: /^\/album\/([^/?#]+)/i,
    artist: /^\/artist\/([^/?#]+)/i,
    playlist: /^\/playlist\/([^/?#]+)/i,
    label: null,
};

const QOBUZ_PATTERNS: MusicPatterns = {
    song: /^\/(?:[a-z]{2}-[a-z]{2}\/)?track\/(\d+)/i,
    album: /^\/(?:[a-z]{2}-[a-z]{2}\/)?album\/[^/]+\/([a-z0-9]+)/i,
    artist: /^\/(?:[a-z]{2}-[a-z]{2}\/)?interpreter\/[^/]+\/(\d+)/i,
    playlist: /^\/(?:[a-z]{2}-[a-z]{2}\/)?playlist\/(\d+)/i,
    label: /^\/(?:[a-z]{2}-[a-z]{2}\/)?label\/[^/]+\/(\d+)/i,
};

const QOBUZ_PLAY_PATTERNS: MusicPatterns = {
    song: /^\/track\/(\d+)/i,
    album: /^\/album\/([a-z0-9]+)/i,
    artist: /^\/artist\/(\d+)/i,
    playlist: /^\/playlist\/(\d+)/i,
    label: /^\/label\/(\d+)/i,
};

const TIDAL_PATTERNS: MusicPatterns = {
    song: /^\/(?:[a-z]{2}\/)?(?:browse\/)?track\/(\d+)/i,
    album: /^\/(?:[a-z]{2}\/)?(?:browse\/)?album\/(\d+)/i,
    artist: /^\/(?:[a-z]{2}\/)?(?:browse\/)?artist\/(\d+)/i,
    playlist:
        /^\/(?:[a-z]{2}\/)?(?:browse\/)?playlist\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    label: null,
};

/**
 * Provider-specific configurations containing supported hostnames and URL path patterns.
 */
const PROVIDER_CONFIG: Record<Provider, ProviderConfig> = {
    saavn: {
        hosts: ['jiosaavn.com', 'www.jiosaavn.com', 'saavn.com', 'www.saavn.com', 'm.jiosaavn.com'],
        patterns: SAAVN_PATTERNS,
    },
    gaana: {
        hosts: ['gaana.com', 'www.gaana.com', 'm.gaana.com'],
        patterns: GAANA_PATTERNS,
    },
    qobuz: {
        hosts: ['qobuz.com', 'www.qobuz.com', 'play.qobuz.com', 'open.qobuz.com'],
        patterns: QOBUZ_PATTERNS,
        fallback: QOBUZ_PLAY_PATTERNS,
    },
    tidal: {
        hosts: ['tidal.com', 'www.tidal.com', 'listen.tidal.com'],
        patterns: TIDAL_PATTERNS,
    },
};

/**
 * Extracts the canonical entity identifier (ID, token, or SEO slug) from a provider web URL.
 *
 * @param link - The full web URL copied from the streaming service.
 * @param provider - The target music provider ('saavn' | 'gaana' | 'qobuz' | 'tidal').
 * @param entity - The music entity type ('song' | 'album' | 'artist' | 'playlist' | 'label').
 * @returns The extracted canonical entity ID or token string.
 *
 * @throws {AppError} 400 - If the link is missing or cannot be parsed as a URL.
 * @throws {AppError} 400 - If the link protocol is not HTTP or HTTPS.
 * @throws {AppError} 400 - If the provider is unsupported or host does not match the provider.
 * @throws {AppError} 400 - If the provider does not support the given entity type.
 * @throws {AppError} 400 - If the link does not match the provider's entity URL format.
 *
 * @example
 * ```ts
 * const trackId = extractId('https://tidal.com/browse/track/12345678', 'tidal', 'song');
 * // returns '12345678'
 *
 * const token = extractId('https://www.jiosaavn.com/song/kesariya/XyZaBc', 'saavn', 'song');
 * // returns 'XyZaBc'
 * ```
 */
export const extractId = (link: string, provider: Provider, entity: MusicEntity): string => {
    if (!link || typeof link !== 'string') {
        throw new AppError('Link is required', 400);
    }

    let url: URL;
    try {
        url = new URL(link.trim());
    } catch {
        throw new AppError('Invalid URL', 400);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new AppError('Only HTTP and HTTPS URLs are supported', 400);
    }

    const config = PROVIDER_CONFIG[provider];
    if (!config) {
        throw new AppError(`Unsupported provider: ${provider}`, 400);
    }

    const hostname = url.hostname.toLowerCase();
    if (!config.hosts.includes(hostname)) {
        throw new AppError(`Invalid ${provider} hostname`, 400);
    }

    const pattern = config.patterns[entity];
    if (!pattern) {
        throw new AppError(`${provider} does not support ${entity} URLs`, 400);
    }

    let id = url.pathname.match(pattern)?.[1];

    // Attempt fallback pattern if primary match fails and a fallback pattern exists for this entity
    if (!id && config.fallback) {
        const fallbackPattern = config.fallback[entity];
        if (fallbackPattern) {
            id = url.pathname.match(fallbackPattern)?.[1];
        }
    }

    if (!id) {
        throw new AppError(`Link does not match ${provider} ${entity} format`, 400);
    }

    // Safely decode URI components (e.g. encoded tokens or slugs)
    try {
        return decodeURIComponent(id);
    } catch {
        return id;
    }
};
