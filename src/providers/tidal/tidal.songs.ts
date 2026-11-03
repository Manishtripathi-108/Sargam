import type { TidalPaginatedResponse, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import TIDAL_ROUTES from './tidal.routes';

export async function getById(id: string) {
    const res = await tidalClient.get<TidalTrack>(`${TIDAL_ROUTES.TRACK.DETAILS}/${id}`);

    return assertData(res.data, '[Tidal] Track not found');
}

export async function getByIds(ids: string[]) {
    const tracks = await Promise.all(ids.map((id) => getById(id).catch(() => null)));

    return tracks.filter((track): track is TidalTrack => track !== null);
}

export async function getByLink(link: string) {
    const id = extractId(link, 'tidal', 'song');

    return getById(id);
}

export async function getSuggestions(_id: string, _limit = 10): Promise<TidalTrack[]> {
    return [];
}

export async function getByIsrc(isrc: string) {
    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(TIDAL_ROUTES.SEARCH.TRACKS, {
        params: {
            query: isrc,
            limit: 10,
            offset: 0,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');

    const exactMatch = data.items.find((track) => track.isrc === isrc);

    if (exactMatch) {
        return exactMatch;
    }

    if (data.items.length > 0) {
        return data.items[0];
    }

    return null;
}

export async function getIsrc(id: string): Promise<string> {
    const track = await getById(id);
    return track.isrc;
}
