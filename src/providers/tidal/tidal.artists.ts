import type { Album } from '../../types/core/album.model';
import type { Artist } from '../../types/core/artist.model';
import type { Paginated } from '../../types/core/pagination.model';
import type { Song } from '../../types/core/song.model';
import type { TidalArtist, TidalPaginatedResponse, TidalSearchAlbum, TidalTrack } from '../../types/tidal';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { tidalClient } from './tidal.client';
import { mapAlbumBase, mapArtist, mapSong } from './tidal.mapper';
import TIDAL_ROUTES from './tidal.routes';

const BATCH_SIZE = 100;

export async function getById(id: string): Promise<Artist> {
    const res = await tidalClient.get<TidalArtist>(`${TIDAL_ROUTES.ARTIST.DETAILS}/${id}`);
    const artist = assertData(res.data, '[Tidal] Artist not found');
    return mapArtist(artist);
}

export async function getByIds(ids: string | string[]): Promise<Artist[]> {
    const idList = Array.isArray(ids) ? ids : ids.split(',').map((id) => id.trim());
    const artists = await Promise.all(idList.map((id) => getById(id).catch(() => null)));

    return artists.filter((artist): artist is Artist => artist !== null);
}

export async function getByLink(link: string): Promise<Artist> {
    const id = extractId(link, 'tidal', 'artist');
    return getById(id);
}

export async function getTopTracks({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<Song>> {
    // When limit is omitted, fetch all available artist tracks without truncation
    if (limit === undefined) {
        let currentOffset = 0;
        const allTracks: TidalTrack[] = [];

        while (true) {
            const res = await tidalClient.get<TidalPaginatedResponse<TidalTrack>>(
                TIDAL_ROUTES.ARTIST.TOP_TRACKS.replace('{id}', id),
                {
                    params: {
                        limit: BATCH_SIZE,
                        offset: currentOffset,
                    },
                }
            );

            const data = res.data;
            if (!data?.items || data.items.length === 0) {
                break;
            }

            allTracks.push(...data.items);
            currentOffset += data.items.length;

            if (currentOffset >= data.totalNumberOfItems) {
                break;
            }
        }

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
        TIDAL_ROUTES.ARTIST.TOP_TRACKS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Top tracks not found');

    return createPaginatedResponse({
        items: data.items.map(mapSong),
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export const getSongs = getTopTracks;

export async function getAlbums({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<Omit<Album, 'songs'>>> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalSearchAlbum>>(
        TIDAL_ROUTES.ARTIST.ALBUMS.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Albums not found');

    return createPaginatedResponse({
        items: data.items.map(mapAlbumBase),
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}

export async function getSimilarArtists({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<Artist>> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const res = await tidalClient.get<TidalPaginatedResponse<TidalArtist>>(
        TIDAL_ROUTES.ARTIST.SIMILAR.replace('{id}', id),
        {
            params: {
                limit: safeLimit,
                offset: safeOffset,
            },
        }
    );

    const data = assertData(res.data, '[Tidal] Similar artists not found');

    return createPaginatedResponse({
        items: data.items.map(mapArtist),
        total: data.totalNumberOfItems,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + data.items.length < data.totalNumberOfItems,
    });
}
