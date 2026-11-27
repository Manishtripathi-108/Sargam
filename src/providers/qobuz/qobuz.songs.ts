import type { QobuzFileUrlResponse, QobuzQuality, QobuzStreamResponse, QobuzTrack } from '../../types/qobuz';
import { AppError, assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { generateRequestSignature, getAuthHeaders } from './qobuz.auth';
import { qobuzClient } from './qobuz.client';
import { getAppCredentials } from './qobuz.extractor';
import QOBUZ_ROUTES from './qobuz.routes';
import axios from 'axios';
import crypto from 'crypto';

export async function getById(track_id: string) {
    const res = await qobuzClient.get<QobuzTrack>(QOBUZ_ROUTES.TRACK.GET, {
        params: { track_id },
    });

    return assertData(res.data, '[Qobuz] Track not found');
}

export async function getByLink(link: string) {
    const id = extractId(link, 'qobuz', 'song');

    return getById(id);
}

export async function getByIds(ids: string | string[]) {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const tracks = await Promise.all(idList.map((id) => getById(id).catch(() => null)));
    return tracks.filter((track): track is QobuzTrack => track !== null);
}

export async function getSuggestions(_trackId: string, _limit = 10): Promise<QobuzTrack[]> {
    return [];
}

/**
 * Get stream URL directly from Qobuz API (requires app secret - extracted if not in env)
 */
export async function getFileUrl(trackId: string, quality: QobuzQuality = '6'): Promise<QobuzFileUrlResponse> {
    const credentials = await getAppCredentials();
    if (!credentials?.appSecret) {
        throw new AppError('[Qobuz] Could not obtain app secret for native stream URLs', 503);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const requestSig = await generateRequestSignature(trackId, quality, timestamp, credentials.appSecret);

    // Include user auth token if authenticated for full stream access (not preview)
    const authHeaders = getAuthHeaders();

    const res = await qobuzClient.get<QobuzFileUrlResponse>(QOBUZ_ROUTES.TRACK.FILE_URL, {
        params: {
            track_id: trackId,
            format_id: quality,
            intent: 'stream',
            request_ts: timestamp,
            request_sig: requestSig,
        },
        headers: authHeaders,
    });

    return assertData(res.data, '[Qobuz] Failed to get file URL');
}

/** Get preview URL (30 seconds, no auth required) */
export async function getPreviewUrl(
    trackId: string,
    quality: QobuzQuality = '6'
): Promise<{
    url: string;
    duration: number;
    mimeType: string;
    samplingRate: number;
    bitDepth: number;
    isPreview: boolean;
}> {
    // For preview, use dummy secret - API returns preview regardless
    const timestamp = Math.floor(Date.now() / 1000);
    const dummySecret = 'preview';
    const rawSignature = `trackgetFileUrlformat_id${quality}intentstreamtrack_id${trackId}${timestamp}${dummySecret}`;
    const requestSig = crypto.createHash('md5').update(rawSignature).digest('hex');

    const res = await qobuzClient.get<QobuzFileUrlResponse>(QOBUZ_ROUTES.TRACK.FILE_URL, {
        params: {
            track_id: trackId,
            format_id: quality,
            intent: 'stream',
            request_ts: timestamp,
            request_sig: requestSig,
        },
    });

    const data = assertData(res.data, '[Qobuz] Failed to get preview URL');

    return {
        url: data.url,
        duration: data.duration,
        mimeType: data.mime_type,
        samplingRate: data.sampling_rate,
        bitDepth: data.bits_depth,
        isPreview: data.file_type === 'preview' || data.duration <= 30,
    };
}

/** Get stream URL - tries native Qobuz API first, then external fallbacks */
export async function getStreamUrl(
    trackId: string,
    quality: QobuzQuality = '6'
): Promise<{ url: string; source: string; isPreview?: boolean }> {
    const errors: string[] = [];

    // Try native Qobuz API first
    const credentials = await getAppCredentials();
    if (credentials?.appSecret) {
        try {
            const fileUrl = await getFileUrl(trackId, quality);
            const isPreview = fileUrl.file_type === 'preview' || fileUrl.duration <= 30;

            // Check for restrictions that indicate we can't get full stream
            if (fileUrl.restrictions?.length && isPreview) {
                const restrictionCodes = fileUrl.restrictions.map((r) => r.code).join(', ');
                errors.push(`qobuz_native: Preview only (${restrictionCodes})`);
            } else {
                return { url: fileUrl.url, source: 'qobuz_native', isPreview };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`qobuz_native: ${message}`);
        }
    }

    // Fallback to external APIs
    const apis = [
        { url: QOBUZ_ROUTES.STREAM.PRIMARY, name: 'primary', paramKey: 'trackId' },
        { url: QOBUZ_ROUTES.STREAM.FALLBACK_1, name: 'fallback_1', paramKey: 'trackId' },
        { url: QOBUZ_ROUTES.STREAM.FALLBACK_2, name: 'fallback_2', paramKey: 'track_id' },
    ];

    for (const api of apis) {
        try {
            const params = api.paramKey === 'track_id' ? { track_id: trackId, quality } : { trackId, quality };

            const res = await axios.get<QobuzStreamResponse>(api.url, {
                params,
                timeout: 30000,
            });

            if (res.data?.url) {
                return { url: res.data.url, source: api.name };
            }

            errors.push(`${api.name}: Empty URL in response`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${api.name}: ${message}`);
        }
    }

    throw new AppError(`[Qobuz] Failed to get stream URL from all sources. Errors: ${errors.join('; ')}`, 502);
}
