import type { Paginated } from '../../types/core/pagination.model';
import type { Playlist } from '../../types/core/playlist.model';
import type { Song } from '../../types/core/song.model';
import type { TidalPaginatedResponse, TidalPlaylist, TidalPlaylistItem, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import { mapPlaylist, mapSong } from './tidal.mapper';
import TIDAL_ROUTES from './tidal.routes';

const BATCH_SIZE = 100;

/**
 * Fetches all tracks for a playlist by paginating until completion.
 */
export async function getAllTracks(uuid: string): Promise<TidalTrack[]> {
    let offset = 0;
    const allTracks: TidalTrack[] = [];

    while (true) {
        const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
            TIDAL_ROUTES.PLAYLIST.TRACKS.replace('{uuid}', uuid),
            {
                params: {
                    limit: BATCH_SIZE,
                    offset,
                },
            }
        );

        const data = res.data;
        if (!data?.items || data.items.length === 0) {
            break;
        }

        allTracks.push(...data.items);
        offset += data.items.length;

        if (offset >= data.totalNumberOfItems) {
            break;
        }
    }

    return allTracks;
}

export async function getById(id: string): Promise<Playlist> {
    const res = await tidalClient.get<TidalPlaylist>(`${TIDAL_ROUTES.PLAYLIST.DETAILS}/${id}`);
    const playlist = assertData(res.data, '[Tidal] Playlist not found');

    try {
        const tracks = await getAllTracks(id);
        return mapPlaylist({
            ...playlist,
            tracks,
        });
    } catch {
        return mapPlaylist(playlist);
    }
}

export async function getByLink(link: string): Promise<Playlist> {
    const id = extractId(link, 'tidal', 'playlist');
    return getById(id);
}

export async function getTracks({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<Song>> {
    // When limit is omitted, fetch all tracks without truncation
    if (limit === undefined) {
        const allTracks = await getAllTracks(id);
        const mapped = allTracks.map(mapSong);
        return createPaginatedResponse({
            items: mapped,
            total: allTracks.length,
            offset: 0,
            limit: allTracks.length,
            hasNext: false,
        });
    }

    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
        TIDAL_ROUTES.PLAYLIST.TRACKS.replace('{uuid}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Playlist tracks not found');

    return createPaginatedResponse({
        items: data.items.map(mapSong),
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export const getSongs = getTracks;

export async function getItems({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<TidalPlaylistItem>> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalPlaylistItem>>(
        TIDAL_ROUTES.PLAYLIST.ITEMS.replace('{uuid}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Playlist items not found');

    return createPaginatedResponse({
        items: data.items,
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}
