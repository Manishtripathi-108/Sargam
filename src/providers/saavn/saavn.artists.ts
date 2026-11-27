import type { Album } from '../../types/core/album.model';
import type { Artist } from '../../types/core/artist.model';
import type { Paginated } from '../../types/core/pagination.model';
import type { Song } from '../../types/core/song.model';
import type { SaavnArtistAlbumsResponse, SaavnArtistResponse, SaavnArtistSongsResponse } from '../../types/saavn';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { saavnClient } from './saavn.client';
import { mapAlbumBase, mapArtist, mapSong } from './saavn.mapper';
import SAAVN_ROUTES from './saavn.routes';

export async function getById(id: string): Promise<Artist> {
    const res = await saavnClient.get<SaavnArtistResponse>('/', {
        params: {
            artistId: id,
            __call: SAAVN_ROUTES.ARTIST.DETAILS,
        },
    });

    return mapArtist(assertData(res.data, '[Saavn] Artist not found'));
}

export async function getByLink(link: string): Promise<Artist> {
    const token = extractId(link, 'saavn', 'artist');

    const res = await saavnClient.get<SaavnArtistResponse>('/', {
        params: {
            token,
            type: 'artist',
            __call: SAAVN_ROUTES.ARTIST.LINK,
        },
    });

    return mapArtist(assertData(res.data, '[Saavn] Artist not found'));
}

export async function getSongs({
    id,
    limit,
    offset = 0,
    sortBy = 'popularity',
    sortOrder = 'desc',
}: {
    id: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
}): Promise<Paginated<Song>> {
    const fetchLimit = limit ?? 100;
    const { page, limit: safeLimit, offset: safeOffset } = normalizePagination(fetchLimit, offset);

    const res = await saavnClient.get<SaavnArtistSongsResponse>('/', {
        params: {
            artistId: id,
            page: page - 1,
            category: sortBy,
            sort_order: sortOrder,
            __call: SAAVN_ROUTES.ARTIST.SONGS,
        },
    });

    const data = assertData(res.data, '[Saavn] Artist not found');

    return createPaginatedResponse({
        items: data.topSongs?.songs?.map(mapSong) ?? [],
        offset: safeOffset,
        limit: limit === undefined ? data.topSongs?.songs?.length ?? safeLimit : safeLimit,
        total: data.topSongs?.total ?? 0,
        hasNext: !data.topSongs?.last_page,
    });
}

export async function getAlbums({
    id,
    limit,
    offset = 0,
    sortBy = 'popularity',
    sortOrder = 'desc',
}: {
    id: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
}): Promise<Paginated<Omit<Album, 'songs'>>> {
    const fetchLimit = limit ?? 50;
    const { page, limit: safeLimit, offset: safeOffset } = normalizePagination(fetchLimit, offset);

    const res = await saavnClient.get<SaavnArtistAlbumsResponse>('/', {
        params: {
            artistId: id,
            page: page - 1,
            category: sortBy,
            sort_order: sortOrder,
            __call: SAAVN_ROUTES.ARTIST.ALBUMS,
        },
    });

    const data = assertData(res.data, '[Saavn] Artist not found');

    return createPaginatedResponse({
        items: data.topAlbums?.albums?.map(mapAlbumBase) ?? [],
        offset: safeOffset,
        limit: limit === undefined ? data.topAlbums?.albums?.length ?? safeLimit : safeLimit,
        total: data.topAlbums?.total ?? 0,
        hasNext: !data.topAlbums?.last_page,
    });
}
