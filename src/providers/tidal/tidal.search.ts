import type {
    GlobalSearchResult,
    SearchAlbum,
    SearchArtist,
    SearchPlaylist,
    SearchSong,
} from '../../types/core/search.model';
import type { SongBase } from '../../types/core/song.model';
import type {
    TidalArtist,
    TidalPaginatedResponse,
    TidalPlaylist,
    TidalSearchAlbum,
    TidalSearchAllResponse,
    TidalTrack,
} from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { normalizePagination } from '../../utils/pagination.utils';
import { tidalClient } from './tidal.client';
import {
    mapGlobalSearch,
    mapSearchAlbum,
    mapSearchArtist,
    mapSearchPlaylist,
    mapSearchSong,
} from './tidal.mapper';
import TIDAL_ROUTES from './tidal.routes';

type SearchParams = {
    query: string;
    limit: number;
    offset: number;
};

export async function all({ query, limit, offset }: SearchParams): Promise<GlobalSearchResult> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalSearchAllResponse>(TIDAL_ROUTES.SEARCH.BASE, {
        params: {
            query,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    return mapGlobalSearch(data);
}

export async function songs({ query, limit, offset }: SearchParams): Promise<SearchSong> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(TIDAL_ROUTES.SEARCH.TRACKS, {
        params: {
            query,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    return mapSearchSong(data, safeLimit);
}

export async function albums({ query, limit, offset }: SearchParams): Promise<SearchAlbum> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalSearchAlbum>>(TIDAL_ROUTES.SEARCH.ALBUMS, {
        params: {
            query,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    return mapSearchAlbum(data, safeLimit);
}

export async function artists({ query, limit, offset }: SearchParams): Promise<SearchArtist> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalArtist>>(TIDAL_ROUTES.SEARCH.ARTISTS, {
        params: {
            query,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    return mapSearchArtist(data, safeLimit);
}

export async function playlists({ query, limit, offset }: SearchParams): Promise<SearchPlaylist> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalPlaylist>>(TIDAL_ROUTES.SEARCH.PLAYLISTS, {
        params: {
            query,
            limit: safeLimit,
            offset: safeOffset,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    return mapSearchPlaylist(data, safeLimit);
}

export async function byIsrc({ isrc }: { isrc: string }): Promise<SongBase | null> {
    const result = await songs({ query: isrc, limit: 10, offset: 0 });
    const exactMatch = result.items.find((track) => track.isrc === isrc);

    if (exactMatch) {
        return exactMatch;
    }

    return result.items.length > 0 ? result.items[0] : null;
}
