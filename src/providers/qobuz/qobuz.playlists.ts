import type { QobuzPlaylist } from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

export async function getById(id: string) {
    const res = await qobuzClient.get<QobuzPlaylist>(QOBUZ_ROUTES.PLAYLIST.GET, {
        params: { playlist_id: id },
    });

    return assertData(res.data, '[Qobuz] Playlist not found');
}

export async function getByLink(link: string) {
    const id = extractId(link, 'qobuz', 'playlist');

    return getById(id);
}

export async function getTracks({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    // Qobuz returns tracks in the playlist response
    const playlist = await getById(id);

    if (!playlist.tracks) {
        return createPaginatedResponse({
            items: [],
            total: 0,
            offset: safeOffset,
            limit: safeLimit,
            hasNext: false,
        });
    }

    // Apply pagination to tracks
    const paginatedTracks = playlist.tracks.items.slice(safeOffset, safeOffset + safeLimit);

    return createPaginatedResponse({
        items: paginatedTracks,
        total: playlist.tracks.total,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + paginatedTracks.length < playlist.tracks.total,
    });
}

export const getSongs = getTracks;
