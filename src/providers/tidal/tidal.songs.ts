import type { TidalPaginatedResponse, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string) {
    const res = await tidalClient.get<TidalTrack>(`${TIDAL_ROUTES.TRACK.DETAILS}/${id}`);

    return assertData(res.data, '[Tidal] Track not found');
}

export async function getByIds(ids: string | string[]) {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const tracks = await Promise.all(idList.map((id) => getById(id).catch(() => null)));

    return tracks.filter((track): track is TidalTrack => track !== null);
}

export async function getByLink(link: string) {
    const id = extractId(link, 'tidal', 'song');

    return getById(id);
}

export async function getSuggestions(id: string, limit = 10): Promise<TidalTrack[]> {
    try {
        const track = await getById(id);
        const mixId = (track as unknown as { mixes?: { TRACK_MIX?: string } })?.mixes?.TRACK_MIX;

        if (mixId) {
            const res = await tidalClient.get<{ items: Array<{ item: TidalTrack }> }>(`/mixes/${mixId}/items`, {
                params: { limit },
            });
            if (res.data?.items?.length) {
                return res.data.items
                    .map((i) => i.item)
                    .filter((t): t is TidalTrack => Boolean(t && t.id && t.id !== Number(id)))
                    .slice(0, limit);
            }
        }

        // Fallback: artist top tracks if track mix is not available
        if (track.artist?.id) {
            const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
                TIDAL_ROUTES.ARTIST.TOP_TRACKS.replace('{id}', String(track.artist.id)),
                { params: { limit } }
            );
            return (res.data?.items || []).filter((t) => t.id !== Number(id)).slice(0, limit);
        }
    } catch {
        // Fallback gracefully to empty array
    }

    return [];
}

export async function getByIsrc(isrc: string) {
    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(TIDAL_ROUTES.SEARCH.TRACKS, {
        params: {
            query: isrc,
            limit: 10,
            offset: 0,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');

    const exactMatch = data.items.find((track) => track.isrc === isrc);

    if (exactMatch) {
        return exactMatch;
    }

    if (data.items.length > 0) {
        return data.items[0];
    }

    return null;
}

export async function getIsrc(id: string): Promise<string> {
    const track = await getById(id);
    return track.isrc;
}
