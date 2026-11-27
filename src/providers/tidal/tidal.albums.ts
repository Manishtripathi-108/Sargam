import type { Album } from '../../types/core/album.model';
import type { Paginated } from '../../types/core/pagination.model';
import type { Song } from '../../types/core/song.model';
import type { TidalAlbum, TidalPaginatedResponse, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import { mapAlbum, mapSong } from './tidal.mapper';
import TIDAL_ROUTES from './tidal.routes';

const BATCH_SIZE = 100;

/**
 * Fetches all tracks for an album by paginating until completion.
 */
export async function getAllTracks(id: string): Promise<TidalTrack[]> {
    let offset = 0;
    const allTracks: TidalTrack[] = [];

    while (true) {
        const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
            TIDAL_ROUTES.ALBUM.TRACKS.replace('{id}', id),
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

export async function getById(id: string): Promise<Album> {
    const res = await tidalClient.get<TidalAlbum>(`${TIDAL_ROUTES.ALBUM.DETAILS}/${id}`);
    const album = assertData(res.data, '[Tidal] Album not found');

    try {
        const tracks = await getAllTracks(id);
        return mapAlbum({
            ...album,
            tracks,
        });
    } catch {
        return mapAlbum(album);
    }
}

export async function getByIds(ids: string | string[]): Promise<Album[]> {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const albums = await Promise.all(idList.map((id) => getById(id).catch(() => null)));

    return albums.filter((album): album is Album => album !== null);
}

export async function getByLink(link: string): Promise<Album> {
    const id = extractId(link, 'tidal', 'album');
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
        TIDAL_ROUTES.ALBUM.TRACKS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Album tracks not found');

    return createPaginatedResponse({
        items: data.items.map(mapSong),
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export const getSongs = getTracks;

export async function getByUpc(upc: string): Promise<Album | null> {
    const res = await tidalClient.get<TidalPaginatedResponse<TidalAlbum>>(TIDAL_ROUTES.SEARCH.ALBUMS, {
        params: {
            query: upc,
            limit: 10,
            offset: 0,
        },
    });

    const data = assertData(res.data, '[Tidal] Search failed');
    const exactMatch = data.items.find((album) => album.upc === upc);

    if (exactMatch) {
        return getById(String(exactMatch.id));
    }

    if (data.items.length > 0) {
        return getById(String(data.items[0].id));
    }

    return null;
}

export function getAlbumArtUrl(coverUuid: string, size: keyof typeof TIDAL_ROUTES.IMAGES.SIZES = 'XL'): string {
    const formattedUuid = coverUuid.replace(/-/g, '/');
    return `${TIDAL_ROUTES.IMAGES.BASE}/${formattedUuid}/${TIDAL_ROUTES.IMAGES.SIZES[size]}.jpg`;
}
