import type { TidalPaginatedResponse, TidalPlaylist, TidalPlaylistItem, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string) {
    const res = await tidalClient.get<TidalPlaylist>(`${TIDAL_ROUTES.PLAYLIST.DETAILS}/${id}`);

    const playlist = assertData(res.data, '[Tidal] Playlist not found');

    try {
        const tracksRes = await getTracks({ id, limit: 100, offset: 0 });
        return {
            ...playlist,
            tracks: tracksRes.items,
        };
    } catch {
        return playlist;
    }
}

export async function getByLink(link: string) {
    const id = extractId(link, 'tidal', 'playlist');

    return getById(id);
}

export async function getTracks({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit ?? 10, offset ?? 0);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
        TIDAL_ROUTES.PLAYLIST.TRACKS.replace('{uuid}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Playlist tracks not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export async function getItems({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit ?? 10, offset ?? 0);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalPlaylistItem>>(
        TIDAL_ROUTES.PLAYLIST.ITEMS.replace('{uuid}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Playlist items not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}
