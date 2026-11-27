import type { GaanaAlbumResponse } from '../../types/gaana';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { gaanaClient } from './gaana.client';
import GAANA_ROUTES from './gaana.routes';

export async function getById(id: string) {
    const res = await gaanaClient.post<GaanaAlbumResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.ALBUM.DETAILS,
            seokey: id,
        },
    });

    return assertData(res.data, '[Gaana] Album not found');
}

export async function getByLink(link: string) {
    const seokey = extractId(link, 'gaana', 'album');

    const res = await gaanaClient.post<GaanaAlbumResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.ALBUM.DETAILS,
            seokey,
        },
    });

    return assertData(res.data, '[Gaana] Album not found');
}

export async function getSongs({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const album = await getById(id);
    const tracks = album.tracks ?? [];

    if (limit === undefined) {
        return createPaginatedResponse({
            items: tracks,
            total: tracks.length,
            offset: 0,
            limit: tracks.length,
            hasNext: false,
        });
    }

    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);
    const paginated = tracks.slice(safeOffset, safeOffset + safeLimit);

    return createPaginatedResponse({
        items: paginated,
        total: tracks.length,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + paginated.length < tracks.length,
    });
}
