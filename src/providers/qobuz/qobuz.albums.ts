import type { QobuzAlbum, QobuzPaginatedList } from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

export async function getById(album_id: string) {
    const res = await qobuzClient.get<QobuzAlbum>(QOBUZ_ROUTES.ALBUM.GET, {
        params: { album_id },
    });

    return assertData(res.data, '[Qobuz] Album not found');
}

export async function getByLink(link: string) {
    const album_id = extractId(link, 'qobuz', 'album');

    return getById(album_id);
}

export async function getTracks({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    // Qobuz returns tracks in the album response
    const res = await qobuzClient.get<QobuzAlbum>(QOBUZ_ROUTES.ALBUM.GET, {
        params: {
            album_id: id,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const album = assertData(res.data, '[Qobuz] Album tracks not found', () => res.data?.tracks?.items?.length > 0);

    // Apply pagination to tracks
    return createPaginatedResponse({
        items: album.tracks.items,
        total: album.tracks.total,
        offset: safeOffset,
        limit: safeLimit,
    });
}

export async function getSuggestedAlbums({ id, limit, offset }: { id: string; limit: number; offset: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);
    const res = await qobuzClient.get<{ albums: QobuzPaginatedList<QobuzAlbum> }>(QOBUZ_ROUTES.ALBUM.SUGGEST, {
        params: {
            album_id: id,
            limit: safeLimit,
            offset: safeOffset,
        },
    });
    const data = assertData(res.data, 'Suggested Albums not found', () => res.data?.albums?.items?.length > 0);
    return createPaginatedResponse({
        items: data.albums.items,
        total: data.albums.total,
        offset: safeOffset,
        limit: safeLimit,
    });
}

export const getSongs = getTracks;
