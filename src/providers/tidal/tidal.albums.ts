import type { TidalAlbum, TidalPaginatedResponse, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string) {
    const res = await tidalClient.get<TidalAlbum>(`${TIDAL_ROUTES.ALBUM.DETAILS}/${id}`);

    const album = assertData(res.data, '[Tidal] Album not found');

    try {
        const tracksRes = await getTracks({ id, limit: 100, offset: 0 });
        return {
            ...album,
            tracks: tracksRes.items,
        };
    } catch {
        return album;
    }
}

export async function getByIds(ids: string | string[]) {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const albums = await Promise.all(idList.map((id) => getById(id).catch(() => null)));

    return albums.filter((album): album is TidalAlbum => album !== null);
}

export async function getByLink(link: string) {
    const id = extractId(link, 'tidal', 'album');

    return getById(id);
}

export async function getTracks({ id, limit, offset }: { id: string; limit?: number; offset?: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
        TIDAL_ROUTES.ALBUM.TRACKS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Album tracks not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export async function getByUpc(upc: string) {
    const res = await tidalClient.get<TidalPaginatedResponse<TidalAlbum>>(TIDAL_ROUTES.SEARCH.ALBUMS, {
        params: {
            query: upc,
            limit: 10,
            offset: 0,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');

    const exactMatch = data.items.find((album) => album.upc === upc);

    if (exactMatch) {
        return exactMatch;
    }

    if (data.items.length > 0) {
        return data.items[0];
    }

    return null;
}

export function getAlbumArtUrl(coverUuid: string, size: keyof typeof TIDAL_ROUTES.IMAGES.SIZES = 'XL'): string {
    const formattedUuid = coverUuid.replace(/-/g, '/');
    return `${TIDAL_ROUTES.IMAGES.BASE}/${formattedUuid}/${TIDAL_ROUTES.IMAGES.SIZES[size]}.jpg`;
}
