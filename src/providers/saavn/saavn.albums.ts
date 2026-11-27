import type { Album } from '../../types/core/album.model';
import type { Paginated } from '../../types/core/pagination.model';
import type { SongBase } from '../../types/core/song.model';
import type { SaavnAlbumResponse } from '../../types/saavn';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { saavnClient } from './saavn.client';
import { mapAlbum } from './saavn.mapper';
import SAAVN_ROUTES from './saavn.routes';

export async function getById(id: string): Promise<Album> {
    const res = await saavnClient.get<SaavnAlbumResponse>('/', {
        params: {
            albumid: id,
            __call: SAAVN_ROUTES.ALBUM.DETAILS,
        },
    });

    return mapAlbum(assertData(res.data, '[Saavn] Album not found'));
}

export async function getByLink(link: string): Promise<Album> {
    const token = extractId(link, 'saavn', 'album');

    const res = await saavnClient.get<SaavnAlbumResponse>('/', {
        params: {
            token,
            type: 'album',
            __call: SAAVN_ROUTES.ALBUM.LINK,
        },
    });

    return mapAlbum(assertData(res.data, '[Saavn] Album not found'));
}

export async function getSongs({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<SongBase>> {
    const album = await getById(id);
    const songs = album.songs ?? [];

    if (limit === undefined) {
        return createPaginatedResponse({
            items: songs,
            total: songs.length,
            offset: 0,
            limit: songs.length,
            hasNext: false,
        });
    }

    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);
    const paginatedItems = songs.slice(safeOffset, safeOffset + safeLimit);

    return createPaginatedResponse({
        items: paginatedItems,
        total: songs.length,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + paginatedItems.length < songs.length,
    });
}
