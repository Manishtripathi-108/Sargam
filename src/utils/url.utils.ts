import type { Provider } from '../validators/common.validators';
import { AppError } from './error.utils';

const HTTP_PROTOCOL_REGEX = /^http:\/\//;

/**
 * Replaces the HTTP protocol in a given URL with HTTPS.
 * @param url - The URL to upgrade to HTTPS.
 * @returns The URL with HTTPS protocol.
 * @example
 * upgradeToHttps("http://example.com") => "https://example.com"
 * upgradeToHttps("https://example.com") => "https://example.com"
 */
export const upgradeToHttps = (url: string): string => url.replace(HTTP_PROTOCOL_REGEX, 'https://');

/**
 * Checks if a given string is a link (starts with http:// or https://).
 * @param value - The string to check.
 * @returns True if the string is a link, false otherwise.
 * @example
 * isLink("http://example.com") => true
 * isLink("https://example.com") => true
 * isLink("example.com") => false
 */
export const isLink = (value: string): boolean => /^https?:\/\//i.test(value);

export type MusicEntity = 'song' | 'album' | 'artist' | 'playlist' | 'label';
export type MusicPatterns = Record<MusicEntity, RegExp | null>;

/* ------------------------------ URL PATTERNS ------------------------------ */
const SAAVN_PATTERNS: MusicPatterns = {
    song: /jiosaavn\.com\/song\/[^/]+\/([^/?#]+)/i,
    album: /jiosaavn\.com\/album\/[^/]+\/([^/?#]+)/i,
    artist: /jiosaavn\.com\/artist\/[^/]+\/([^/?#]+)/i,
    playlist: /jiosaavn\.com\/playlist\/([^/?#]+)/i,
    label: null,
};

const GAANA_PATTERNS: MusicPatterns = {
    song: /gaana\.com\/song\/([a-zA-Z0-9-]+)/i,
    album: /gaana\.com\/album\/([a-zA-Z0-9-]+)/i,
    artist: /gaana\.com\/artist\/([a-zA-Z0-9-]+)/i,
    playlist: /gaana\.com\/playlist\/([a-zA-Z0-9-]+)/i,
    label: null,
};

// www.qobuz.com patterns (with optional locale like /us-en/)
const QOBUZ_PATTERNS: Record<MusicEntity, RegExp> = {
    song: /qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?track\/(\d+)/i,
    album: /qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?album\/[^/]+\/([a-z0-9]+)/i,
    artist: /qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?interpreter\/[^/]+\/(\d+)/i,
    playlist: /qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?playlist\/(\d+)/i,
    label: /qobuz\.com\/(?:[a-z]{2}-[a-z]{2}\/)?label\/[^/]+\/(\d+)/i,
};

// play.qobuz.com patterns (fallback)
const QOBUZ_PLAY_PATTERNS: Record<MusicEntity, RegExp> = {
    song: /play\.qobuz\.com\/track\/(\d+)/i,
    album: /play\.qobuz\.com\/album\/([a-z0-9]+)/i,
    artist: /play\.qobuz\.com\/artist\/(\d+)/i,
    playlist: /play\.qobuz\.com\/playlist\/(\d+)/i,
    label: /play\.qobuz\.com\/label\/(\d+)/i,
};

const TIDAL_URL_PATTERNS: Record<MusicEntity, RegExp | null> = {
    song: /tidal\.com\/(?:browse\/)?track\/(\d+)/i,
    album: /tidal\.com\/(?:browse\/)?album\/(\d+)/i,
    artist: /tidal\.com\/(?:browse\/)?artist\/(\d+)/i,
    // Playlist UUIDs: 8-4-4-4-12 format
    playlist: /tidal\.com\/(?:browse\/)?playlist\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    label: null,
};

const URL_PATTERNS: Record<Provider, Record<MusicEntity, RegExp | null>> = {
    saavn: SAAVN_PATTERNS,
    gaana: GAANA_PATTERNS,
    qobuz: QOBUZ_PATTERNS,
    tidal: TIDAL_URL_PATTERNS,
};

/**
 * Extracts a music entity ID (e.g. track ID, album ID, etc.) from a URL.
 * Supports Saavn, Gaana, and Qobuz providers.
 * If the provider is Qobuz and the link does not match the main Qobuz pattern,
 * it will try the play.qobuz.com pattern as a fallback.
 *
 * @param {string} link - The URL to extract the ID from.
 * @param {Provider} provider - The provider of the URL (Saavn, Gaana, or Qobuz).
 * @param {MusicEntity} entity - The type of music entity to extract the ID for (track, album, artist, playlist, label).
 *
 * @returns {string} The extracted ID.
 *
 * @throws {AppError} If the link is empty or does not match the expected format.
 */
export const extractId = (link: string, provider: Provider, entity: MusicEntity): string => {
    if (!link) throw new AppError('Link is required', 400);

    const pattern = URL_PATTERNS[provider][entity];
    if (!pattern) throw new AppError(`${provider} does not support ${entity} URLs`, 400);

    let id = link.match(pattern)?.[1];

    // Qobuz fallback: try play.qobuz.com pattern
    if (!id && provider === 'qobuz') {
        id = link.match(QOBUZ_PLAY_PATTERNS[entity])?.[1];
    }

    if (!id) throw new AppError(`Link does not match ${provider} ${entity} format`, 400);

    return id;
};
