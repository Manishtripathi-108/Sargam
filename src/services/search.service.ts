import { resolveProvider, type ServiceOptions } from '../providers';
import type { SearchParams } from '../types/core/search.model';
import { AppError, wrapError } from '../utils/error.utils';
import type { SearchType } from '../validators/common.validators';

type SearchParamsWithOpts = SearchParams & {
    opts: ServiceOptions;
};

export async function globalSearch(p: {
    query: string;
    type: SearchType;
    limit: number;
    offset: number;
    opts: ServiceOptions;
}) {
    if (!p.query) {
        throw new AppError('Query is required', 400);
    }

    const search = resolveProvider(p.opts).search;

    try {
        if (p.type === 'song') return search.songs(p);
        if (p.type === 'album') return search.albums(p);
        if (p.type === 'artist') return search.artists(p);
        if (p.type === 'playlist') return search.playlists(p);
        return search.all(p);
    } catch (err) {
        return wrapError(err, 'Search failed', 500);
    }
}

export const searchSongs = (p: SearchParamsWithOpts) =>
    resolveProvider(p.opts)
        .search.songs(p)
        .catch((e: unknown) => wrapError(e, 'Song search failed', 500));

export const searchAlbums = (p: SearchParamsWithOpts) =>
    resolveProvider(p.opts)
        .search.albums(p)
        .catch((e: unknown) => wrapError(e, 'Album search failed', 500));

export const searchArtists = (p: SearchParamsWithOpts) =>
    resolveProvider(p.opts)
        .search.artists(p)
        .catch((e: unknown) => wrapError(e, 'Artist search failed', 500));

export const searchPlaylists = (p: SearchParamsWithOpts) =>
    resolveProvider(p.opts)
        .search.playlists(p)
        .catch((e: unknown) => wrapError(e, 'Playlist search failed', 500));
