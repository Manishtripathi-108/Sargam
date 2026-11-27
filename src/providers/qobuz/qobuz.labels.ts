import type { QobuzAlbum, QobuzLabelAlbumsResponse, QobuzLabelFull, QobuzLabelSearchResponse } from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

export async function getById(labelId: string): Promise<QobuzLabelFull> {
    const res = await qobuzClient.get<QobuzLabelFull>(QOBUZ_ROUTES.LABEL.GET, {
        params: { label_id: labelId },
    });
    return assertData(res.data, '[Qobuz] Label not found');
}

export const getByLink = async (link: string): Promise<QobuzLabelFull> => getById(extractId(link, 'qobuz', 'label'));

export async function getAlbums(
    labelId: string,
    options: { limit?: number; offset?: number; sort?: 'release_date' | 'relevance' | 'title' } = {}
): Promise<QobuzLabelAlbumsResponse> {
    const { limit = 50, offset = 0, sort = 'release_date' } = options;
    const res = await qobuzClient.get<QobuzLabelAlbumsResponse>(QOBUZ_ROUTES.LABEL.ALBUMS, {
        params: { label_id: labelId, limit, offset, sort },
    });
    return assertData(res.data, '[Qobuz] Failed to get label albums');
}

export async function search(query: string, limit = 25, offset = 0): Promise<QobuzLabelSearchResponse> {
    const res = await qobuzClient.get<QobuzLabelSearchResponse>(QOBUZ_ROUTES.LABEL.SEARCH, {
        params: { query, limit, offset },
    });
    return assertData(res.data, '[Qobuz] Label search failed');
}

export async function getAllAlbums(labelId: string, maxAlbums = 500): Promise<QobuzAlbum[]> {
    const albums: QobuzAlbum[] = [];
    let offset = 0;
    const limit = 100;

    while (albums.length < maxAlbums) {
        const response = await getAlbums(labelId, { limit, offset });
        if (!response.albums.items?.length) break;
        albums.push(...response.albums.items);
        if (albums.length >= response.albums.total) break;
        offset += limit;
    }

    return albums.slice(0, maxAlbums);
}
