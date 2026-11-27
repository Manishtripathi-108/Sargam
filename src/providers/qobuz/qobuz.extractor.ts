import type { QobuzAppCredentials } from '../../types/qobuz';
import axios from 'axios';
import crypto from 'crypto';

// Cached credentials
let cachedCredentials: QobuzAppCredentials | null = null;

// Regex patterns for extracting credentials from Qobuz bundle
const BUNDLE_URL_REGEX = /<script src="(\/resources\/\d+\.\d+\.\d+-[a-z]\d{3}\/bundle\.js)"><\/script>/;
const APP_ID_REGEX = /production:\{api:\{appId:"(?<appId>\d{9})",appSecret:"(\w{32})/;
const SEED_TIMEZONE_REGEX = /[a-z]\.initialSeed\("(?<seed>[\w=]+)",window\.utimezone\.(?<timezone>[a-z]+)\)/g;

/**
 * Extract app credentials (appId and appSecret) from Qobuz's bundle.js.
 * This is used when credentials are not provided via environment variables.
 */
async function extractAppCredentials(): Promise<QobuzAppCredentials | null> {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    try {
        // Fetch login page to get bundle URL
        const loginRes = await axios.get<string>('https://play.qobuz.com/login', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });

        const bundleMatch = BUNDLE_URL_REGEX.exec(loginRes.data);
        if (!bundleMatch) {
            console.error('Could not find bundle URL in login page');
            return null;
        }

        // Fetch bundle.js
        const bundleRes = await axios.get<string>(`https://play.qobuz.com${bundleMatch[1]}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        const bundle = bundleRes.data;

        // Extract app ID
        const appIdMatch = APP_ID_REGEX.exec(bundle);
        if (!appIdMatch?.groups?.appId) {
            console.error('Could not find app ID in bundle');
            return null;
        }
        const appId = appIdMatch.groups.appId;

        // Extract and decode secrets
        const appSecret = await extractAndValidateSecret(bundle, appId);
        if (!appSecret) {
            console.error('Could not extract valid app secret');
            return null;
        }

        cachedCredentials = { appId, appSecret };
        return cachedCredentials;
    } catch (error) {
        console.error('Failed to extract Qobuz credentials:', error);
        return null;
    }
}

/**
 * Extract secrets from bundle, decode them, and validate against the API.
 */
async function extractAndValidateSecret(bundle: string, appId: string): Promise<string | null> {
    // Collect seed/timezone pairs
    const secrets: Record<string, string[]> = {};

    let seedMatch;
    while ((seedMatch = SEED_TIMEZONE_REGEX.exec(bundle)) !== null) {
        const { seed, timezone } = seedMatch.groups!;
        secrets[timezone] = [seed];
    }

    if (Object.keys(secrets).length === 0) {
        return null;
    }

    // Build regex for info/extras based on found timezones
    const timezones = Object.keys(secrets)
        .map((tz) => tz.charAt(0).toUpperCase() + tz.slice(1))
        .join('|');
    const infoExtrasRegex = new RegExp(
        `name:"\\w+/(?<timezone>${timezones})",info:"(?<info>[\\w=]+)",extras:"(?<extras>[\\w=]+)"`,
        'g'
    );

    // Extract info and extras for each timezone
    let infoMatch;
    while ((infoMatch = infoExtrasRegex.exec(bundle)) !== null) {
        const timezone = infoMatch.groups!.timezone.toLowerCase();
        const { info, extras } = infoMatch.groups!;
        if (secrets[timezone]) {
            secrets[timezone].push(info, extras);
        }
    }

    // Decode and validate each potential secret
    const decodedSecrets: string[] = [];

    for (const secretParts of Object.values(secrets)) {
        const combined = secretParts.join('').slice(0, -44);
        try {
            const decoded = Buffer.from(combined, 'base64').toString('utf-8');
            if (decoded && decoded.length > 0) {
                decodedSecrets.push(decoded);
            }
        } catch {
            continue;
        }
    }

    // Validate each secret against the API
    for (const secret of decodedSecrets) {
        const isValid = await validateSecret(appId, secret);
        if (isValid) {
            return secret;
        }
    }

    return decodedSecrets[0] || null;
}

/**
 * Validate a secret by making a test request to the API.
 */
async function validateSecret(appId: string, secret: string): Promise<boolean> {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const trackId = '1';
        const formatId = '27';

        const rawSig = `trackgetFileUrlformat_id${formatId}intentstreamtrack_id${trackId}${timestamp}${secret}`;
        const signature = crypto.createHash('md5').update(rawSig).digest('hex');

        const res = await axios.get('https://www.qobuz.com/api.json/0.2/track/getFileUrl', {
            params: {
                format_id: formatId,
                intent: 'stream',
                track_id: trackId,
                request_ts: timestamp,
                request_sig: signature,
            },
            headers: {
                'X-App-Id': appId,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            validateStatus: () => true,
        });

        // Status 400 means invalid secret, anything else means the secret worked
        return res.status !== 400;
    } catch {
        return false;
    }
}

/**
 * Get cached credentials or extract new ones
 */
export async function getAppCredentials(): Promise<QobuzAppCredentials | null> {
    const envAppId = process.env.QOBUZ_APP_ID ?? '798273057';
    const envAppSecret = process.env.QOBUZ_APP_SECRET;

    // If both are provided via env, use them
    if (envAppId && envAppSecret) {
        return { appId: envAppId, appSecret: envAppSecret };
    }

    // Otherwise extract from Qobuz
    return extractAppCredentials();
}

/**
 * Clear cached credentials (useful for testing or forced refresh)
 */
export function clearCredentialsCache(): void {
    cachedCredentials = null;
}
