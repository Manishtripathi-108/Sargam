import type { Song } from '../../types/core/song.model';
import type { SaavnLyrics, SaavnSongResponse, SaavnSongSuggestionResponse } from '../../types/saavn';
import { AppError, assertData } from '../../utils/error.utils';
import { extractId } from '../../utils/url.utils';
import { saavnClient } from './saavn.client';
import { mapSong } from './saavn.mapper';
import SAAVN_ROUTES from './saavn.routes';

export async function getById(id: string): Promise<Song> {
    const res = await saavnClient.get<{ songs: SaavnSongResponse[] }>('/', {
        params: {
            pids: id,
            __call: SAAVN_ROUTES.SONG.ID,
        },
    });

    return assertData(
        res.data?.songs,
        '[Saavn] Song not found',
        () => !res.data?.songs || res.data.songs.length === 0
    ).map(mapSong)[0];
}

export async function getByIds(ids: string): Promise<Song[]> {
    const res = await saavnClient.get<{ songs: SaavnSongResponse[] }>('/', {
        params: {
            pids: ids,
            __call: SAAVN_ROUTES.SONG.ID,
        },
    });

    return assertData(
        res.data?.songs,
        '[Saavn] Song not found',
        () => !res.data?.songs || res.data.songs.length === 0
    ).map(mapSong);
}

export async function getByLink(link: string): Promise<Song> {
    const token = extractId(link, 'saavn', 'song');

    const res = await saavnClient.get<{ songs: SaavnSongResponse[] }>('/', {
        params: {
            token,
            type: 'song',
            __call: SAAVN_ROUTES.SONG.LINK,
        },
    });

    return mapSong(
        assertData(res.data?.songs, '[Saavn] Song not found', () => !res.data?.songs || res.data.songs.length === 0)[0]
    );
}

export async function getStation(songId: string): Promise<string> {
    const encoded = JSON.stringify([encodeURIComponent(songId)]);

    const res = await saavnClient.get<{ stationid: string }>(SAAVN_ROUTES.SONG.STATION, {
        params: {
            entity_id: encoded,
            entity_type: 'queue',
            ctx: 'android',
        },
    });

    const stationId = res.data?.stationid;
    if (!stationId) {
        throw new AppError('[Saavn] Failed to create song station', 502);
    }

    return stationId;
}

export async function getSuggestions(id: string, limit: number): Promise<Song[]> {
    const stationId = await getStation(id);

    const res = await saavnClient.get<SaavnSongSuggestionResponse>(SAAVN_ROUTES.SONG.SUGGESTIONS, {
        params: {
            stationid: stationId,
            k: limit,
            ctx: 'android',
        },
    });

    const data = assertData(res.data, '[Saavn] No suggestions found');

    return Object.values(data)
        .map((entry) => {
            if (typeof entry === 'object' && entry.song) {
                return mapSong(entry.song);
            }
            return null;
        })
        .filter((s) => s !== null)
        .slice(0, limit);
}

export async function getLyrics(songId: string): Promise<string> {
    const res = await saavnClient.get<SaavnLyrics>(SAAVN_ROUTES.SONG.LYRICS, {
        params: {
            id: songId,
            __call: SAAVN_ROUTES.SONG.LYRICS,
        },
    });

    return assertData(res.data.lyrics, '[Saavn] Lyrics not found');
}
