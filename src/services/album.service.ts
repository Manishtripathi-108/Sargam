import { resolveProvider, type ServiceOptions } from '../providers';
import { AppError, wrapError } from '../utils/error.utils';

export async function getAlbumById(id: string, opts: ServiceOptions) {
    if (!id) {
        throw new AppError('Album id is required', 400);
    }

    try {
        return await resolveProvider(opts).albums.getById(id);
    } catch (err) {
        return wrapError(err, 'Failed to fetch album', 500);
    }
}

export async function getAlbumByLink(link: string, opts: ServiceOptions) {
    if (!link) {
        throw new AppError('Album link is required', 400);
    }

    try {
        return await resolveProvider(opts).albums.getByLink(link);
    } catch (err) {
        return wrapError(err, 'Failed to fetch album', 500);
    }
}
