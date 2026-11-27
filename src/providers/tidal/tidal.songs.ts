import type { Song } from '../../types/core/song.model';
import type { TidalPaginatedResponse, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import { mapSong } from './tidal.mapper';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string): Promise<Song> {
    const res = await tidalClient.get<TidalTrack>(`${TIDAL_ROUTES.TRACK.DETAILS}/${id}`);
    const track = assertData(res.data, '[Tidal] Track not found');
    return mapSong(track);
}

export async function getByIds(ids: string | string[]): Promise<Song[]> {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const tracks = await Promise.all(idList.map((id) => getById(id).catch(() => null)));

    return tracks.filter((track): track is Song => track !== null);
}

export async function getByLink(link: string): Promise<Song> {
    const id = extractId(link, 'tidal', 'song');
    return getById(id);
}

export async function getSuggestions(id: string, limit = 10): Promise<Song[]> {
    try {
        const res = await tidalClient.get<TidalTrack>(`${TIDAL_ROUTES.TRACK.DETAILS}/${id}`);
        const track = res.data;
        const mixId = track?.mixes?.TRACK_MIX;

        if (mixId) {
            const mixRes = await tidalClient.get<{ items: Array<{ item: TidalTrack }> }>(`/mixes/${mixId}/items`, {
                params: { limit },
            });
            if (mixRes.data?.items?.length) {
                return mixRes.data.items
                    .map((i) => i.item)
                    .filter((t): t is TidalTrack => Boolean(t && t.id && t.id !== Number(id)))
                    .slice(0, limit)
                    .map(mapSong);
            }
        }

        // Fallback: artist top tracks if track mix is not available
        if (track?.artist?.id) {
            const topRes = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
                TIDAL_ROUTES.ARTIST.TOP_TRACKS.replace('{id}', String(track.artist.id)),
                { params: { limit } }
            );
            return (topRes.data?.items || [])
                .filter((t) => t.id !== Number(id))
                .slice(0, limit)
                .map(mapSong);
        }
    } catch {
        // Fallback gracefully to empty array
    }

    return [];
}

export async function getByIsrc(isrc: string): Promise<Song | null> {
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
        return mapSong(exactMatch);
    }

    if (data.items.length > 0) {
        return mapSong(data.items[0]);
    }

    return null;
}

export async function getIsrc(id: string): Promise<string> {
    const res = await tidalClient.get<TidalTrack>(`${TIDAL_ROUTES.TRACK.DETAILS}/${id}`);
    const track = assertData(res.data, '[Tidal] Track not found');
    return track.isrc;
}
