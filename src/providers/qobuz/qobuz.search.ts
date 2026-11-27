import type {
    QobuzAlbumSearchResponse,
    QobuzArtistSearchResponse,
    QobuzCatalogSearchResponse,
    QobuzPlaylistSearchResponse,
    QobuzTrackSearchResponse,
} from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

type SearchParams = {
    query: string;
    limit: number;
    offset: number;
};

export async function all(p: SearchParams) {
    const { limit, offset } = normalizePagination(p.limit, p.offset);

    const res = await qobuzClient.get<QobuzCatalogSearchResponse>(QOBUZ_ROUTES.SEARCH.CATALOG, {
        params: {
            query: p.query,
            limit,
            offset,
        },
    });

    return assertData(res.data, '[Qobuz] Search failed');
}

export async function songs(p: SearchParams) {
    const { limit, offset } = normalizePagination(p.limit, p.offset);

    const res = await qobuzClient.get<QobuzTrackSearchResponse>(QOBUZ_ROUTES.TRACK.SEARCH, {
        params: {
            query: p.query,
            limit,
            offset,
        },
    });

    const data = assertData(res.data, '[Qobuz] Song search failed');

    return createPaginatedResponse({
        items: data.tracks.items,
        total: data.tracks.total,
        offset,
        limit,
    });
}

export async function albums(p: SearchParams) {
    const { limit, offset } = normalizePagination(p.limit, p.offset);

    const res = await qobuzClient.get<QobuzAlbumSearchResponse>(QOBUZ_ROUTES.ALBUM.SEARCH, {
        params: {
            query: p.query,
            limit,
            offset,
        },
    });

    const data = assertData(res.data, '[Qobuz] Album search failed');

    return createPaginatedResponse({
        items: data.albums.items,
        total: data.albums.total,
        offset,
        limit,
    });
}

export async function artists(p: SearchParams) {
    const { limit, offset } = normalizePagination(p.limit, p.offset);

    const res = await qobuzClient.get<QobuzArtistSearchResponse>(QOBUZ_ROUTES.ARTIST.SEARCH, {
        params: {
            query: p.query,
            limit,
            offset,
        },
    });

    const data = assertData(res.data, '[Qobuz] Artist search failed');

    return createPaginatedResponse({
        items: data.artists.items,
        total: data.artists.total,
        offset,
        limit,
    });
}

export async function playlists(p: SearchParams) {
    const { limit, offset } = normalizePagination(p.limit, p.offset);

    const res = await qobuzClient.get<QobuzPlaylistSearchResponse>(QOBUZ_ROUTES.PLAYLIST.SEARCH, {
        params: {
            query: p.query,
            limit,
            offset,
        },
    });

    const data = assertData(res.data, '[Qobuz] Playlist search failed');

    return createPaginatedResponse({
        items: data.playlists.items,
        total: data.playlists.total,
        offset,
        limit,
    });
}
