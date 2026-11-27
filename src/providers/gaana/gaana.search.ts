import type { GaanaSearchResponse, GlobalSearchResponse } from '../../types/gaana';
import { assertData } from '../../utils/error.utils';
import { normalizePagination } from '../../utils/pagination.utils';
import { gaanaClient } from './gaana.client';
import GAANA_ROUTES from './gaana.routes';

type SearchParams = {
    query: string;
    limit: number;
    offset: number;
};

export async function all(p: SearchParams) {
    const { page, limit } = normalizePagination(p.limit, p.offset);

    const res = await gaanaClient.post<GlobalSearchResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.SEARCH.ALL,
            keyword: p.query,
            page: page - 1,
        },
    });

    const data = assertData(res.data, '[Gaana] No results found', (): boolean => {
        const groups = res.data?.gr;
        return !Array.isArray(groups) || !groups[0]?.gd;
    });

    return data.gr[0].gd.slice(0, limit);
}

export async function songs(p: SearchParams) {
    const { page, limit } = normalizePagination(p.limit, p.offset);

    const res = await gaanaClient.post<GaanaSearchResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.SEARCH.SONGS,
            secType: 'track',
            keyword: p.query,
            page: page - 1,
        },
    });

    const data = assertData(res.data, '[Gaana] No songs found', (): boolean => {
        const groups = res.data?.gr;
        return !Array.isArray(groups) || !groups[0]?.gd;
    });

    return data.gr[0].gd.slice(0, limit);
}

export async function albums(p: SearchParams) {
    const { page, limit } = normalizePagination(p.limit, p.offset);

    const res = await gaanaClient.post<GaanaSearchResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.SEARCH.ALBUMS,
            secType: 'album',
            keyword: p.query,
            page: page - 1,
        },
    });

    const data = assertData(res.data, '[Gaana] No albums found', (): boolean => {
        const groups = res.data?.gr;
        return !Array.isArray(groups) || !groups[0]?.gd;
    });

    return data.gr[0].gd.slice(0, limit);
}

export async function artists(p: SearchParams) {
    const { page, limit } = normalizePagination(p.limit, p.offset);

    const res = await gaanaClient.post<GaanaSearchResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.SEARCH.ARTISTS,
            secType: 'artist',
            keyword: p.query,
            page: page - 1,
        },
    });

    const data = assertData(res.data, '[Gaana] No artists found', (): boolean => {
        const groups = res.data?.gr;
        return !Array.isArray(groups) || !groups[0]?.gd;
    });

    return data.gr[0].gd.slice(0, limit);
}

export async function playlists(p: SearchParams) {
    const { page, limit } = normalizePagination(p.limit, p.offset);

    const res = await gaanaClient.post<GaanaSearchResponse>('/', null, {
        params: {
            type: GAANA_ROUTES.SEARCH.PLAYLISTS,
            secType: 'playlist',
            keyword: p.query,
            page: page - 1,
        },
    });

    const data = assertData(res.data, '[Gaana] No playlists found', (): boolean => {
        const groups = res.data?.gr;
        return !Array.isArray(groups) || !groups[0]?.gd;
    });

    return data.gr[0].gd.slice(0, limit);
}
