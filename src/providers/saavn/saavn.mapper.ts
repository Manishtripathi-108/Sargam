import type { Album } from '../../types/core/album.model';
import type { Artist, ArtistBase } from '../../types/core/artist.model';
import type { ImageAsset } from '../../types/core/image.model';
import type { Playlist } from '../../types/core/playlist.model';
import type {
    GlobalSearchResult,
    SearchAlbum,
    SearchArtist,
    SearchPlaylist,
    SearchSong,
} from '../../types/core/search.model';
import type { QualityTag, Song, SongBase } from '../../types/core/song.model';
import type {
    SaavnAlbumResponse,
    SaavnArtistBaseResponse,
    SaavnArtistResponse,
    SaavnPlaylistResponse,
    SaavnSearchAlbumResponse,
    SaavnSearchArtistResponse,
    SaavnSearchPlaylistResponse,
    SaavnSearchResponse,
    SaavnSearchSongResponse,
    SaavnSongResponse,
} from '../../types/saavn';
import { createFallbackImageAsset, decodeHtmlEntities, safeParseNumber } from '../../utils/common.utils';
import { decryptAudio } from '../../utils/decrypt.utils';
import { AppError } from '../../utils/error.utils';
import { createPaginatedResponse } from '../../utils/pagination.utils';
import { upgradeToHttps } from '../../utils/url.utils';
import type { SearchType } from '../../validators/common.validators';

const IMG_SIZE_RX = /150x150|50x50|500x500/;

const imgFromSaavn = (link?: string | null): ImageAsset => {
    if (!link || link.includes('default')) return createFallbackImageAsset();

    return {
        low: upgradeToHttps(link.replace(IMG_SIZE_RX, '50x50')),
        medium: upgradeToHttps(link.replace(IMG_SIZE_RX, '150x150')),
        high: upgradeToHttps(link.replace(IMG_SIZE_RX, '500x500')),
        ultra: upgradeToHttps(link.replace(IMG_SIZE_RX, '500x500')),
        original: upgradeToHttps(link.replace(IMG_SIZE_RX, '500x500')),
    };
};

const safeOffset = (offset?: number) => Math.max(0, (offset ?? 0) - 1);

export const mapArtistBase = (a: SaavnArtistBaseResponse): ArtistBase => ({
    id: a.id,
    name: a.name,
    type: 'artist',
});

export const mapSong = (s: SaavnSongResponse): Song => {
    // Guard: required fields must be present
    if (!s.id || !s.title || !s.more_info?.encrypted_media_url) {
        throw new AppError(`[Saavn] Data corruption: missing fields for song ${s.id ?? 'unknown'}`, 502);
    }

    const audio = decryptAudio('saavn', s.more_info.encrypted_media_url);
    if (!audio) {
        throw new AppError(`[Saavn] Data corruption: audio missing for song ${s.id}`, 502);
    }

    const isDolbyAtmos = Boolean(s.more_info?.is_dolby_content);
    const qualityTags: QualityTag[] = [];
    if (isDolbyAtmos) qualityTags.push('DOLBY_ATMOS');
    if (s.more_info?.['320kbps'] === 'true') qualityTags.push('HIGH');
    if (audio.lossless) qualityTags.push('LOSSLESS');

    return {
        id: s.id,
        name: decodeHtmlEntities(s.title) ?? s.title,
        type: 'song',
        year: s.year ? Number(s.year) : null,
        release_date: s.more_info?.release_date ?? null,
        duration_ms: safeParseNumber(s.more_info?.duration) * 1000,
        explicit: s.explicit_content === '1',
        language: s.language,
        disc_number: null,
        track_number: null,
        copyright: s.more_info?.copyright_text ?? null,
        album: {
            id: s.more_info?.album_id,
            name: decodeHtmlEntities(s.more_info?.album) ?? 'unknown album',
            type: 'album',
        },
        artists: s.more_info?.artistMap?.primary_artists?.map(mapArtistBase) ?? [],
        image: imgFromSaavn(s.image),
        audio,

        // Audiophile & Audio Quality
        quality_tags: qualityTags,
        audio_quality: isDolbyAtmos ? 'DOLBY_ATMOS' : s.more_info?.['320kbps'] === 'true' ? 'HIGH' : 'MEDIUM',
        audio_modes: isDolbyAtmos ? ['STEREO', 'DOLBY_ATMOS'] : ['STEREO'],
        is_dolby_atmos: isDolbyAtmos,
        bit_depth: null,
        sample_rate: null,

        // Music Acoustics & Volume Normalization
        bpm: null,
        key: null,
        key_scale: null,
        replay_gain: null,
        peak: null,

        // Industry & Catalog Metadata
        isrc: null,
        label: s.more_info?.label ?? null,
        version: null,
        popularity: safeParseNumber(s.play_count),
        url: s.perma_url ?? null,

        // Lyrics / Availability Flags
        has_lyrics: s.more_info?.has_lyrics === 'true',
        lyrics_id: s.more_info?.lyrics_id ?? null,
    };
};

export const mapSongBase = (s: SaavnSongResponse): SongBase => {
    const isDolbyAtmos = Boolean(s.more_info?.is_dolby_content);
    const qualityTags: QualityTag[] = [];
    if (isDolbyAtmos) qualityTags.push('DOLBY_ATMOS');
    if (s.more_info?.['320kbps'] === 'true') qualityTags.push('HIGH');

    return {
        id: s.id,
        name: decodeHtmlEntities(s.title) ?? s.title,
        type: 'song',
        year: s.year ? Number(s.year) : null,
        duration_ms: safeParseNumber(s.more_info?.duration) * 1000,
        explicit: s.explicit_content === '1',
        language: s.language,
        album: decodeHtmlEntities(s.more_info?.album) ?? 'unknown album',
        artists: s.more_info?.artistMap?.primary_artists?.map((a) => a.name).join(', ') ?? 'unknown artists',
        image: imgFromSaavn(s.image),
        quality_tags: qualityTags,
        audio_quality: isDolbyAtmos ? 'DOLBY_ATMOS' : s.more_info?.['320kbps'] === 'true' ? 'HIGH' : 'MEDIUM',
        isrc: null,
        version: null,
        popularity: safeParseNumber(s.play_count),
    };
};

export const mapArtist = (a: SaavnArtistResponse): Artist => ({
    id: a.artistId ?? a.id,
    name: a.name,
    type: 'artist',
    follower_count: safeParseNumber(a.follower_count),
    bio: (() => {
        try {
            return a.bio ? (JSON.parse(a.bio) as string) : null;
        } catch {
            return null;
        }
    })(),
    image: imgFromSaavn(a.image),
    popularity: safeParseNumber(a.follower_count),
    roles: [],
    artist_types: [],
    url: a.perma_url ?? null,
});

export const mapAlbum = (a: SaavnAlbumResponse): Album => {
    const isDolbyAtmos = Boolean(a.list?.some((s) => s.more_info?.is_dolby_content));
    return {
        id: a.id,
        name: a.title,
        type: 'album',
        release_date: a.year ? `${a.year}-01-01` : null,
        language: a.language,
        explicit: a.explicit_content === '1',
        total_songs: safeParseNumber(a.more_info?.song_count),
        popularity: safeParseNumber(a.play_count),
        artists: a.more_info?.artistMap?.primary_artists?.map(mapArtistBase) ?? [],
        image: imgFromSaavn(a.image),
        songs: a.list?.map(mapSongBase) ?? [],

        // Enriched Fields
        quality_tags: isDolbyAtmos ? ['DOLBY_ATMOS'] : ['HIGH'],
        audio_quality: isDolbyAtmos ? 'DOLBY_ATMOS' : 'HIGH',
        audio_modes: isDolbyAtmos ? ['STEREO', 'DOLBY_ATMOS'] : ['STEREO'],
        is_dolby_atmos: isDolbyAtmos,
        duration_ms: null,
        number_of_volumes: 1,
        upc: null,
        copyright: a.more_info?.copyright_text ?? null,
        label: a.list?.[0]?.more_info?.label ?? null,
        url: a.perma_url ?? null,
    };
};

export const mapAlbumBase = (a: SaavnAlbumResponse): Omit<Album, 'songs'> => {
    const isDolbyAtmos = Boolean(a.list?.some((s) => s.more_info?.is_dolby_content));
    return {
        id: a.id,
        name: a.title,
        type: 'album',
        release_date: a.year ? `${a.year}-01-01` : null,
        language: a.language,
        explicit: a.explicit_content === '1',
        total_songs: safeParseNumber(a.more_info?.song_count),
        popularity: safeParseNumber(a.play_count),
        artists: a.more_info?.artistMap?.primary_artists?.map(mapArtistBase) ?? [],
        image: imgFromSaavn(a.image),

        // Enriched Fields
        quality_tags: isDolbyAtmos ? ['DOLBY_ATMOS'] : ['HIGH'],
        audio_quality: isDolbyAtmos ? 'DOLBY_ATMOS' : 'HIGH',
        audio_modes: isDolbyAtmos ? ['STEREO', 'DOLBY_ATMOS'] : ['STEREO'],
        is_dolby_atmos: isDolbyAtmos,
        duration_ms: null,
        number_of_volumes: 1,
        upc: null,
        copyright: a.more_info?.copyright_text ?? null,
        label: a.list?.[0]?.more_info?.label ?? null,
        url: a.perma_url ?? null,
    };
};

export const mapPlaylist = (p: SaavnPlaylistResponse): Playlist => ({
    id: p.id,
    name: p.title,
    description: p.header_desc,
    type: 'playlist',
    playlist_type: p.list_type?.toLowerCase() === 'user' ? 'user' : 'editorial',
    explicit: p.explicit_content === '1',
    total_songs: safeParseNumber(p.list_count),
    image: imgFromSaavn(p.image),
    duration_ms: null,
    popularity: null,
    url: p.perma_url ?? null,
    creator: p.more_info?.firstname
        ? {
              id: String(p.more_info?.uid ?? ''),
              name: `${p.more_info.firstname} ${p.more_info.lastname ?? ''}`.trim(),
          }
        : null,
    last_updated: null,
    created_at: null,
    songs: p.list?.map(mapSong) ?? null,
});

/* -------------------------------------------------------------------------- */
/*                              search mappers                                */
/* -------------------------------------------------------------------------- */

export const mapGlobalSearch = (s: SaavnSearchResponse): GlobalSearchResult => ({
    topQuery:
        s.topquery?.data.map((i) => ({
            id: i.id,
            name: i.title,
            type: i.type as Exclude<SearchType, 'all'>,
            image: imgFromSaavn(i.image),
            artists: i.more_info?.primary_artists,
        })) ?? [],
    songs:
        s.songs?.data.map((i) => ({
            id: i.id,
            name: i.title,
            type: 'song',
            image: imgFromSaavn(i.image),
            album: i.more_info?.album ?? 'Unknown Album',
            artists: i.more_info?.primary_artists ?? 'Unknown Artists',
        })) ?? [],
    albums:
        s.albums?.data.map((i) => ({
            id: i.id,
            name: i.title,
            type: 'album',
            image: imgFromSaavn(i.image),
            artists: i.more_info?.music ?? 'Unknown Artists',
        })) ?? [],
    artists:
        s.artists?.data.map((i) => ({
            id: i.id,
            name: i.name ?? i.title,
            type: 'artist',
            image: imgFromSaavn(i.image),
        })) ?? [],
    playlists:
        s.playlists?.data.map((i) => ({
            id: i.id,
            name: i.title,
            type: 'playlist',
            image: imgFromSaavn(i.image),
        })) ?? [],
});

export const mapSearchSong = (s: SaavnSearchSongResponse, limit?: number): SearchSong =>
    createPaginatedResponse({
        items: s.results.map(mapSongBase),
        limit,
        total: s.total,
        offset: safeOffset(s.start),
    });

export const mapSearchAlbum = (a: SaavnSearchAlbumResponse, limit?: number): SearchAlbum =>
    createPaginatedResponse({
        items: a.results.map((i) => ({
            id: i.id,
            name: i.title,
            release_date: i.year ? `${i.year}-01-01` : null,
            type: 'album' as const,
            language: i.language,
            explicit: i.explicit_content === '1',
            image: imgFromSaavn(i.image),
        })),
        limit,
        total: a.total,
        offset: safeOffset(a.start),
    });

export const mapSearchPlaylist = (p: SaavnSearchPlaylistResponse, limit?: number): SearchPlaylist =>
    createPaginatedResponse({
        items: p.results.map((i) => ({
            id: i.id,
            name: i.title,
            type: 'playlist' as const,
            image: imgFromSaavn(i.image),
            total_songs: safeParseNumber(i.more_info?.song_count),
            language: i.more_info?.language,
            explicit: i.explicit_content === '1',
        })),
        limit,
        total: p.total,
        offset: safeOffset(p.start),
    });

export const mapSearchArtist = (a: SaavnSearchArtistResponse, limit?: number): SearchArtist =>
    createPaginatedResponse({
        items: a.results.map((i) => ({
            id: i.id,
            name: i.name,
            type: 'artist' as const,
            image: imgFromSaavn(i.image),
        })),
        limit,
        total: a.total,
        offset: safeOffset(a.start),
    });
