import { resolveProvider, type ServiceOptions } from '../providers';
import { AppError, wrapError } from '../utils/error.utils';

export async function getPlaylistById(id: string, opts: ServiceOptions) {
    if (!id) {
        throw new AppError('Playlist id is required', 400);
    }

    try {
        return await resolveProvider(opts).playlists.getById(id);
    } catch (err) {
        return wrapError(err, 'Failed to fetch playlist', 500);
    }
}

export async function getPlaylistByLink(link: string, opts: ServiceOptions) {
    if (!link) {
        throw new AppError('Playlist link is required', 400);
    }

    try {
        return await resolveProvider(opts).playlists.getByLink(link);
    } catch (err) {
        return wrapError(err, 'Failed to fetch playlist', 500);
    }
}
