import type { Paginated } from '../../types/core/pagination.model';
import type { Playlist } from '../../types/core/playlist.model';
import type { Song } from '../../types/core/song.model';
import type { SaavnPlaylistResponse } from '../../types/saavn';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { saavnClient } from './saavn.client';
import { mapPlaylist } from './saavn.mapper';
import SAAVN_ROUTES from './saavn.routes';

export async function getById(id: string, limit?: number, offset = 0): Promise<Playlist> {
    const fetchLimit = limit ?? 1000;
    const { page } = normalizePagination(fetchLimit, offset);

    const res = await saavnClient.get<SaavnPlaylistResponse>('/', {
        params: {
            listid: id,
            p: page,
            n: fetchLimit,
            __call: SAAVN_ROUTES.PLAYLIST.DETAILS,
        },
    });

    return mapPlaylist(assertData(res.data, '[Saavn] Playlist not found'));
}

export async function getByLink(link: string, limit?: number, offset = 0): Promise<Playlist> {
    const token = extractId(link, 'saavn', 'playlist');
    const fetchLimit = limit ?? 1000;
    const { page } = normalizePagination(fetchLimit, offset);

    const res = await saavnClient.get<SaavnPlaylistResponse>('/', {
        params: {
            token,
            type: 'playlist',
            p: page,
            n: fetchLimit,
            __call: SAAVN_ROUTES.PLAYLIST.LINK,
        },
    });

    return mapPlaylist(assertData(res.data, '[Saavn] Playlist not found'));
}

export async function getSongs({
    id,
    limit,
    offset,
}: {
    id: string;
    limit?: number;
    offset?: number;
}): Promise<Paginated<Song>> {
    const playlist = await getById(id, limit, offset);
    const songs = playlist.songs ?? [];

    if (limit === undefined) {
        return createPaginatedResponse({
            items: songs,
            total: playlist.total_songs || songs.length,
            offset: 0,
            limit: songs.length,
            hasNext: false,
        });
    }

    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    return createPaginatedResponse({
        items: songs,
        total: playlist.total_songs || songs.length,
        offset: safeOffset,
        limit: safeLimit,
        hasNext: safeOffset + songs.length < (playlist.total_songs || songs.length),
    });
}
