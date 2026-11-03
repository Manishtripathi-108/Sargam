import type { GaanaArtistResponse, GaanaArtistTrackResponse } from '../../types/gaana';
import { safeParseNumber } from '../../utils/common.utils';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { gaanaClient } from './gaana.client';
import GAANA_ROUTES from './gaana.routes';

export async function getById(id: string) {
    const res = await gaanaClient.post<GaanaArtistResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.ARTIST.DETAILS,
            seokey: id,
        },
    });

    return assertData(res.data, '[Gaana] Artist not found');
}

export async function getByLink(link: string) {
    const seokey = extractId(link, 'gaana', 'artist');

    const res = await gaanaClient.post<GaanaArtistResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.ARTIST.DETAILS,
            seokey,
        },
    });

    return assertData(res.data, '[Gaana] Artist not found');
}

export async function getSongs({
    id,
    limit,
    offset,
    sortBy,
    sortOrder,
}: {
    id: string;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
}) {
    const { page } = normalizePagination(limit, offset);

    const res = await gaanaClient.post<GaanaArtistTrackResponse>('/', null, {
        params: {
            id,
            page: page - 1,
            sortBy,
            order: sortOrder === 'asc' ? '0' : '1',
            type: GAANA_ROUTES.ARTIST.TRACKS,
        },
    });

    const data = assertData(res.data, '[Gaana] Artist tracks not found');

    return createPaginatedResponse({
        items: data.entities ?? [],
        offset: (page - 1) * 10,
        total: safeParseNumber(data.count),
        hasNext: !data.eof,
    });
}

export async function getAlbums({
    id,
    limit,
    offset,
    sortBy,
    sortOrder,
}: {
    id: string;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
}) {
    const { page } = normalizePagination(limit, offset);
    // Todo: GAANA has different sort by options for albums, need to map accordingly (release-date and popularity)

    const res = await gaanaClient.post<GaanaArtistTrackResponse>('/', null, {
        params: {
            id,
            page: page - 1,
            sortBy,
            order: sortOrder === 'asc' ? '0' : '1',
            type: GAANA_ROUTES.ARTIST.ALBUMS,
        },
    });

    const data = assertData(res.data, '[Gaana] Artist albums not found');

    return createPaginatedResponse({
        items: data.entities ?? [],
        offset: (page - 1) * 10,
        total: safeParseNumber(data.count),
        hasNext: !data.eof,
    });
}
