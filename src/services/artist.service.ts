import { resolveProvider, type ServiceOptions } from '../providers';
import { AppError, wrapError } from '../utils/error.utils';
import type { SortBy, SortOrder } from '../validators/common.validators';

export async function getArtistById(id: string, opts: ServiceOptions) {
    if (!id) {
        throw new AppError('Artist id is required', 400);
    }

    try {
        return await resolveProvider(opts).artists.getById(id);
    } catch (err) {
        return wrapError(err, 'Failed to fetch artist', 500);
    }
}

export async function getArtistByLink(link: string, opts: ServiceOptions) {
    if (!link) {
        throw new AppError('Artist link is required', 400);
    }

    try {
        return await resolveProvider(opts).artists.getByLink(link);
    } catch (err) {
        return wrapError(err, 'Failed to fetch artist', 500);
    }
}

export async function getArtistSongs(params: {
    id: string;
    offset: number;
    limit: number;
    sortBy: SortBy;
    sortOrder: SortOrder;
    opts: ServiceOptions;
}) {
    if (!params.id) {
        throw new AppError('Artist id is required', 400);
    }

    try {
        return await resolveProvider(params.opts).artists.getSongs(params);
    } catch (err) {
        return wrapError(err, 'Failed to fetch artist songs', 500);
    }
}

export async function getArtistAlbums(params: {
    id: string;
    offset: number;
    limit: number;
    sortBy: SortBy;
    sortOrder: SortOrder;
    opts: ServiceOptions;
}) {
    if (!params.id) {
        throw new AppError('Artist id is required', 400);
    }

    try {
        return await resolveProvider(params.opts).artists.getAlbums(params);
    } catch (err) {
        return wrapError(err, 'Failed to fetch artist albums', 500);
    }
}
