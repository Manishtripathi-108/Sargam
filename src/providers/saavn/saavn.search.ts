import type {
    GlobalSearchResult,
    SearchAlbum,
    SearchArtist,
    SearchPlaylist,
    SearchSong,
    SearchParams,
} from '../../types/core/search.model';
import type {
    SaavnSearchAlbumResponse,
    SaavnSearchArtistResponse,
    SaavnSearchPlaylistResponse,
    SaavnSearchResponse,
    SaavnSearchSongResponse,
} from '../../types/saavn';
import { assertData } from '../../utils/error.utils';
import { normalizePagination } from '../../utils/pagination.utils';
import { saavnClient } from './saavn.client';
import { mapGlobalSearch, mapSearchAlbum, mapSearchArtist, mapSearchPlaylist, mapSearchSong } from './saavn.mapper';
import SAAVN_ROUTES from './saavn.routes';

export async function all(p: SearchParams): Promise<GlobalSearchResult> {
    const res = await saavnClient.get<SaavnSearchResponse>('/', {
        params: { query: p.query, __call: SAAVN_ROUTES.SEARCH.ALL },
    });

    return mapGlobalSearch(assertData(res.data, '[Saavn] No results found'));
}

export async function songs(p: SearchParams): Promise<SearchSong> {
    const { page } = normalizePagination(p.limit, p.offset);

    const res = await saavnClient.get<SaavnSearchSongResponse>('/', {
        params: {
            q: p.query,
            p: page,
            n: p.limit,
            __call: SAAVN_ROUTES.SEARCH.SONGS,
        },
    });

    return mapSearchSong(
        assertData(res.data, '[Saavn] No songs found', () => !res.data.results || res.data.results.length === 0)
    );
}

export async function albums(p: SearchParams): Promise<SearchAlbum> {
    const { page } = normalizePagination(p.limit, p.offset);

    const res = await saavnClient.get<SaavnSearchAlbumResponse>('/', {
        params: {
            q: p.query,
            p: page,
            n: p.limit,
            __call: SAAVN_ROUTES.SEARCH.ALBUMS,
        },
    });

    return mapSearchAlbum(
        assertData(res.data, '[Saavn] No albums found', () => !res.data.results || res.data.results.length === 0),
        p.limit
    );
}

export async function artists(p: SearchParams): Promise<SearchArtist> {
    const { page } = normalizePagination(p.limit, p.offset);

    const res = await saavnClient.get<SaavnSearchArtistResponse>('/', {
        params: {
            q: p.query,
            p: page,
            n: p.limit,
            __call: SAAVN_ROUTES.SEARCH.ARTISTS,
        },
    });

    return mapSearchArtist(
        assertData(res.data, '[Saavn] No artists found', () => !res.data.results || res.data.results.length === 0),
        p.limit
    );
}

export async function playlists(p: SearchParams): Promise<SearchPlaylist> {
    const { page } = normalizePagination(p.limit, p.offset);

    const res = await saavnClient.get<SaavnSearchPlaylistResponse>('/', {
        params: {
            q: p.query,
            p: page,
            n: p.limit,
            __call: SAAVN_ROUTES.SEARCH.PLAYLISTS,
        },
    });

    return mapSearchPlaylist(
        assertData(res.data, '[Saavn] No playlists found', () => !res.data.results || res.data.results.length === 0),
        p.limit
    );
}
