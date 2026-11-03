import type { TidalArtist, TidalPaginatedResponse, TidalSearchAlbum, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string) {
    const res = await tidalClient.get<TidalArtist>(`${TIDAL_ROUTES.ARTIST.DETAILS}/${id}`);

    return assertData(res.data, '[Tidal] Artist not found');
}

export async function getByIds(ids: string[]) {
    const artists = await Promise.all(ids.map((id) => getById(id).catch(() => null)));

    return artists.filter((artist): artist is TidalArtist => artist !== null);
}

export async function getByLink(link: string) {
    const id = extractId(link, 'tidal', 'artist');

    return getById(id);
}

export async function getTopTracks({ id, limit, offset }: { id: string; limit: number; offset: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
        TIDAL_ROUTES.ARTIST.TOP_TRACKS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Top tracks not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export const getSongs = getTopTracks;

export async function getAlbums({ id, limit, offset }: { id: string; limit: number; offset: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalSearchAlbum>>(
        TIDAL_ROUTES.ARTIST.ALBUMS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Albums not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export async function getSimilarArtists({ id, limit, offset }: { id: string; limit: number; offset: number }) {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalArtist>>(
        TIDAL_ROUTES.ARTIST.SIMILAR.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Similar artists not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}
