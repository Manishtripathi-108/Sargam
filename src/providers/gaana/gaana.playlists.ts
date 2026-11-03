import type { GaanaPlaylistResponse } from '../../types/gaana';
import { assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { gaanaClient } from './gaana.client';
import GAANA_ROUTES from './gaana.routes';

export async function getById(id: string) {
    const res = await gaanaClient.post<GaanaPlaylistResponse>('/', null, {
        params: {
            seokey: id,
            page: 0,
            limit: 10,
            type: GAANA_ROUTES.PLAYLIST.DETAILS,
        },
    });

    return assertData(res.data, '[Gaana] Playlist not found');
}

export async function getByLink(link: string) {
    const seokey = extractId(link, 'gaana', 'playlist');

    const res = await gaanaClient.post<GaanaPlaylistResponse>('/', null, {
        params: {
            seokey,
            page: 0,
            limit: 10,
            type: GAANA_ROUTES.PLAYLIST.DETAILS,
        },
    });

    return assertData(res.data, '[Gaana] Playlist not found');
}
