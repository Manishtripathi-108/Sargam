import { resolveProvider, type ServiceOptions } from '../providers';
import { AppError, wrapError } from '../utils/error.utils';

export async function getSongById(id: string, opts: ServiceOptions) {
    if (!id) {
        throw new AppError('Song id is required', 400);
    }

    try {
        return await resolveProvider(opts).songs.getById(id);
    } catch (err) {
        return wrapError(err, 'Failed to fetch song', 500);
    }
}

export async function getSongsByIds(ids: string, opts: ServiceOptions) {
    try {
        return await resolveProvider(opts).songs.getByIds(ids);
    } catch (err) {
        return wrapError(err, 'Failed to fetch song', 500);
    }
}

export async function getSongByLink(link: string, opts: ServiceOptions) {
    if (!link) {
        throw new AppError('Link is required', 400);
    }

    try {
        return await resolveProvider(opts).songs.getByLink(link);
    } catch (err) {
        return wrapError(err, 'Failed to fetch song', 500);
    }
}

export async function getSongSuggestions(id: string, limit = 10, opts: ServiceOptions) {
    try {
        return await resolveProvider(opts).songs.getSuggestions(id, limit);
    } catch (err) {
        return wrapError(err, 'Failed to fetch suggestions', 500);
    }
}
