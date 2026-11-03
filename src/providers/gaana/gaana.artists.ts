import type { Album } from '../../types/core/album.model';
import type { Artist } from '../../types/core/artist.model';
import type { Paginated } from '../../types/core/pagination.model';
import type { Song } from '../../types/core/song.model';
import type { GaanaArtistResponse, GaanaArtistTrackResponse } from '../../types/gaana';
import { assertData } from '../../utils/error.utils';
import { safeParseNumber } from '../../utils/number.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { gaanaClient } from './gaana.client';
import GAANA_ROUTES from './gaana.routes';

export async function getById(id: string): Promise<Artist> {
    const res = await gaanaClient.post<GaanaArtistResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.ARTIST.DETAILS,
            seokey: id,
        },
    });

    return assertData(res.data, '[Gaana] Artist not found');
}

export async function getByLink(link: string): Promise<Artist> {
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
}): Promise<Paginated<Song>> {
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
}): Promise<Paginated<Omit<Album, 'songs'>>> {
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
