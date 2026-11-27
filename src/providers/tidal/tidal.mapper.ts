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
    TidalAlbum,
    TidalArtist,
    TidalAudioMode,
    TidalAudioQuality,
    TidalPaginatedResponse,
    TidalPlaylist,
    TidalSearchAlbum,
    TidalTrack,
} from '../../types/tidal/common.types';
import type { TidalSearchAllResponse } from '../../types/tidal/search.response';
import { createFallbackImageAsset } from '../../utils/common.utils';
import { createPaginatedResponse } from '../../utils/pagination.utils';
import TIDAL_ROUTES from './tidal.routes';

/* -------------------------------------------------------------------------- */
/*                                IMAGE HELPERS                               */
/* -------------------------------------------------------------------------- */

export const imgFromTidal = (uuid?: string | null): ImageAsset => {
    if (!uuid) return createFallbackImageAsset();
    const formatted = uuid.replace(/-/g, '/');
    return {
        low: `${TIDAL_ROUTES.IMAGES.BASE}/${formatted}/${TIDAL_ROUTES.IMAGES.SIZES.SMALL}.jpg`,
        medium: `${TIDAL_ROUTES.IMAGES.BASE}/${formatted}/${TIDAL_ROUTES.IMAGES.SIZES.MEDIUM}.jpg`,
        high: `${TIDAL_ROUTES.IMAGES.BASE}/${formatted}/${TIDAL_ROUTES.IMAGES.SIZES.LARGE}.jpg`,
        ultra: `${TIDAL_ROUTES.IMAGES.BASE}/${formatted}/${TIDAL_ROUTES.IMAGES.SIZES.XL}.jpg`,
        original: `${TIDAL_ROUTES.IMAGES.BASE}/${formatted}/${TIDAL_ROUTES.IMAGES.SIZES.ORIGIN}.jpg`,
    };
};

/* -------------------------------------------------------------------------- */
/*                            QUALITY TAG NORMALIZATION                       */
/* -------------------------------------------------------------------------- */

export const normalizeQualityTags = (
    tags?: string[],
    audioQuality?: TidalAudioQuality | string,
    audioModes?: TidalAudioMode[] | string[]
): QualityTag[] => {
    const set = new Set<QualityTag>();

    if (tags) {
        for (const tag of tags) {
            if (tag === 'HIRES_LOSSLESS' || tag === 'HI_RES') {
                set.add('HI_RES');
            } else if (tag === 'LOSSLESS') {
                set.add('LOSSLESS');
            } else if (tag === 'DOLBY_ATMOS') {
                set.add('DOLBY_ATMOS');
            } else if (tag === 'MQA') {
                set.add('MQA');
            }
        }
    }

    if (audioQuality === 'HI_RES' || audioQuality === 'HI_RES_LOSSLESS') {
        set.add('HI_RES');
    } else if (audioQuality === 'LOSSLESS') {
        set.add('LOSSLESS');
    } else if (audioQuality === 'HIGH') {
        set.add('HIGH');
    }

    if (audioModes?.includes('DOLBY_ATMOS')) {
        set.add('DOLBY_ATMOS');
    }
    if (audioModes?.includes('SONY_360RA')) {
        set.add('360_REALITY_AUDIO');
    }

    return Array.from(set);
};

/* -------------------------------------------------------------------------- */
/*                              ARTIST MAPPERS                                */
/* -------------------------------------------------------------------------- */

export const mapArtistBase = (a: TidalArtist): ArtistBase => ({
    id: String(a.id),
    name: a.name,
    type: 'artist',
});

export const mapArtist = (a: TidalArtist): Artist => ({
    id: String(a.id),
    name: a.name,
    type: 'artist',
    bio: null,
    follower_count: 0,
    image: imgFromTidal(a.picture),
    popularity: a.popularity ?? null,
    roles: a.artistRoles?.map((r) => r.category) ?? [],
    artist_types: a.artistTypes ?? [],
    url: a.url ?? null,
});

/* -------------------------------------------------------------------------- */
/*                                SONG MAPPERS                                */
/* -------------------------------------------------------------------------- */

export const mapSongBase = (t: TidalTrack): SongBase => ({
    id: String(t.id),
    name: t.title,
    type: 'song',
    duration_ms: t.duration * 1000,
    explicit: Boolean(t.explicit),
    language: null,
    image: imgFromTidal(t.album?.cover),
    year: t.streamStartDate
        ? new Date(t.streamStartDate).getFullYear()
        : t.album?.releaseDate
          ? new Date(t.album.releaseDate).getFullYear()
          : null,
    album: t.album?.title ?? '',
    artists: t.artists?.map((a) => a.name).join(', ') ?? t.artist?.name ?? '',
    quality_tags: normalizeQualityTags(t.mediaMetadata?.tags, t.audioQuality, t.audioModes),
    audio_quality: t.audioQuality ?? null,
    isrc: t.isrc ?? null,
    version: t.version ?? null,
    popularity: t.popularity ?? null,
});

export const mapSong = (t: TidalTrack): Song => {
    const qualityTags = normalizeQualityTags(t.mediaMetadata?.tags, t.audioQuality, t.audioModes);
    const isDolbyAtmos =
        Boolean(t.audioModes?.includes('DOLBY_ATMOS')) ||
        Boolean(t.mediaMetadata?.tags?.includes('DOLBY_ATMOS'));

    return {
        id: String(t.id),
        name: t.title,
        type: 'song',
        duration_ms: t.duration * 1000,
        explicit: Boolean(t.explicit),
        language: null,
        image: imgFromTidal(t.album?.cover),
        year: t.streamStartDate
            ? new Date(t.streamStartDate).getFullYear()
            : t.album?.releaseDate
              ? new Date(t.album.releaseDate).getFullYear()
              : null,
        disc_number: t.volumeNumber ?? null,
        track_number: t.trackNumber ?? null,
        release_date: t.streamStartDate
            ? t.streamStartDate.split('T')[0]
            : t.album?.releaseDate ?? null,
        copyright: t.copyright ?? null,
        album: {
            id: String(t.album?.id ?? ''),
            name: t.album?.title ?? '',
            type: 'album',
        },
        artists: t.artists?.map(mapArtistBase) ?? (t.artist ? [mapArtistBase(t.artist)] : []),
        audio: {},

        // Audiophile & Audio Quality
        quality_tags: qualityTags,
        audio_quality: t.audioQuality ?? null,
        audio_modes: t.audioModes ?? [],
        is_dolby_atmos: isDolbyAtmos,
        bit_depth: qualityTags.includes('HI_RES') ? 24 : qualityTags.includes('LOSSLESS') ? 16 : null,
        sample_rate: qualityTags.includes('HI_RES') ? 96 : qualityTags.includes('LOSSLESS') ? 44.1 : null,

        // Music Acoustics & Volume Normalization
        bpm: t.bpm ?? null,
        key: t.key ?? null,
        key_scale: t.keyScale ? (t.keyScale.toLowerCase() as 'major' | 'minor') : null,
        replay_gain: t.replayGain ?? null,
        peak: t.peak ?? null,

        // Industry & Catalog Metadata
        isrc: t.isrc ?? null,
        label: t.copyright ?? null,
        version: t.version ?? null,
        popularity: t.popularity ?? null,
        url: t.url ?? null,

        // Lyrics / Availability Flags
        has_lyrics: false,
        lyrics_id: null,
    };
};

/* -------------------------------------------------------------------------- */
/*                               ALBUM MAPPERS                                */
/* -------------------------------------------------------------------------- */

export const mapAlbumBase = (a: TidalAlbum | TidalSearchAlbum): Omit<Album, 'songs'> => {
    const qualityTags = normalizeQualityTags(a.mediaMetadata?.tags, a.audioQuality, a.audioModes);
    const isDolbyAtmos =
        Boolean(a.audioModes?.includes('DOLBY_ATMOS')) ||
        Boolean(a.mediaMetadata?.tags?.includes('DOLBY_ATMOS'));

    return {
        id: String(a.id),
        name: a.title,
        type: a.type?.toLowerCase() === 'single' ? 'single' : a.type?.toLowerCase() === 'ep' ? 'ep' : 'album',
        release_date: a.releaseDate ?? null,
        language: null,
        explicit: Boolean(a.explicit),
        total_songs: a.numberOfTracks,
        popularity: a.popularity ?? 0,
        artists: a.artists?.map(mapArtistBase) ?? (a.artist ? [mapArtistBase(a.artist)] : []),
        image: imgFromTidal(a.cover),

        // Quality & Modes
        quality_tags: qualityTags,
        audio_quality: a.audioQuality ?? null,
        audio_modes: a.audioModes ?? [],
        is_dolby_atmos: isDolbyAtmos,

        // Catalog Details
        duration_ms: 'duration' in a && a.duration ? a.duration * 1000 : null,
        number_of_volumes: 'numberOfVolumes' in a ? a.numberOfVolumes : null,
        upc: a.upc ?? null,
        copyright: 'copyright' in a ? a.copyright ?? null : null,
        label: 'copyright' in a ? a.copyright ?? null : null,
        url: 'url' in a ? a.url ?? null : null,
    };
};

export const mapAlbum = (a: TidalAlbum): Album => ({
    ...mapAlbumBase(a),
    songs: a.tracks?.map(mapSongBase) ?? [],
});

/* -------------------------------------------------------------------------- */
/*                              PLAYLIST MAPPERS                              */
/* -------------------------------------------------------------------------- */

export const mapPlaylist = (p: TidalPlaylist): Playlist => ({
    id: p.uuid,
    name: p.title,
    description: p.description ?? null,
    type: 'playlist',
    playlist_type: p.type?.toLowerCase() === 'user' ? 'user' : 'editorial',
    explicit: p.tracks?.some((t) => t.explicit) ?? false,
    image: imgFromTidal(p.squareImage ?? p.image),
    total_songs: p.numberOfTracks,
    duration_ms: p.duration ? p.duration * 1000 : null,
    popularity: p.popularity ?? 0,
    url: p.url ?? null,
    creator: p.creator ? { id: String(p.creator.id ?? ''), name: p.creator.name } : null,
    last_updated: p.lastUpdated ?? null,
    created_at: p.created ?? null,
    songs: p.tracks?.map(mapSong) ?? null,
});

/* -------------------------------------------------------------------------- */
/*                               SEARCH MAPPERS                               */
/* -------------------------------------------------------------------------- */

export const mapGlobalSearch = (res: TidalSearchAllResponse): GlobalSearchResult => {
    let topHitItem: GlobalSearchResult['topHit'] = null;
    if (res.topHit) {
        const val = res.topHit.value;
        if ('isrc' in val) {
            topHitItem = {
                type: 'song',
                item: {
                    id: String(val.id),
                    name: val.title,
                    type: 'song',
                    image: imgFromTidal(val.album?.cover),
                },
            };
        } else if ('cover' in val) {
            topHitItem = {
                type: 'album',
                item: {
                    id: String(val.id),
                    name: val.title,
                    type: 'album',
                    image: imgFromTidal(val.cover),
                },
            };
        } else if ('uuid' in val) {
            topHitItem = {
                type: 'playlist',
                item: {
                    id: val.uuid,
                    name: val.title,
                    type: 'playlist',
                    image: imgFromTidal(val.squareImage ?? val.image),
                },
            };
        } else if ('name' in val) {
            topHitItem = {
                type: 'artist',
                item: {
                    id: String(val.id),
                    name: val.name,
                    type: 'artist',
                    image: imgFromTidal(val.picture),
                },
            };
        }
    }

    return {
        topHit: topHitItem,
        topQuery: [],
        artists:
            res.artists?.items.map((a) => ({
                id: String(a.id),
                name: a.name,
                type: 'artist' as const,
                image: imgFromTidal(a.picture),
            })) ?? [],
        playlists:
            res.playlists?.items.map((p) => ({
                id: p.uuid,
                name: p.title,
                type: 'playlist' as const,
                image: imgFromTidal(p.squareImage ?? p.image),
            })) ?? [],
        songs:
            res.tracks?.items.map((t) => ({
                id: String(t.id),
                name: t.title,
                type: 'song' as const,
                image: imgFromTidal(t.album?.cover),
                album: t.album?.title ?? '',
                artists: t.artists?.map((a) => a.name).join(', ') ?? t.artist?.name ?? '',
                quality_tags: normalizeQualityTags(t.mediaMetadata?.tags, t.audioQuality, t.audioModes),
            })) ?? [],
        albums:
            res.albums?.items.map((a) => ({
                id: String(a.id),
                name: a.title,
                type: 'album' as const,
                image: imgFromTidal(a.cover),
                artists: a.artists?.map((art) => art.name).join(', ') ?? a.artist?.name ?? '',
                quality_tags: normalizeQualityTags(a.mediaMetadata?.tags, a.audioQuality, a.audioModes),
            })) ?? [],
    };
};

export const mapSearchSong = (res: TidalPaginatedResponse<TidalTrack>, limit?: number): SearchSong =>
    createPaginatedResponse({
        items: res.items.map(mapSongBase),
        total: res.totalNumberOfItems,
        offset: res.offset,
        limit: limit ?? res.limit,
        hasNext: res.offset + res.items.length < res.totalNumberOfItems,
    });

export const mapSearchAlbum = (res: TidalPaginatedResponse<TidalSearchAlbum>, limit?: number): SearchAlbum =>
    createPaginatedResponse({
        items: res.items.map((a) => ({
            id: String(a.id),
            name: a.title,
            type: 'album' as const,
            image: imgFromTidal(a.cover),
            language: null,
            explicit: Boolean(a.explicit),
            release_date: a.releaseDate ?? null,
        })),
        total: res.totalNumberOfItems,
        offset: res.offset,
        limit: limit ?? res.limit,
        hasNext: res.offset + res.items.length < res.totalNumberOfItems,
    });

export const mapSearchArtist = (res: TidalPaginatedResponse<TidalArtist>, limit?: number): SearchArtist =>
    createPaginatedResponse({
        items: res.items.map((a) => ({
            id: String(a.id),
            name: a.name,
            type: 'artist' as const,
            image: imgFromTidal(a.picture),
        })),
        total: res.totalNumberOfItems,
        offset: res.offset,
        limit: limit ?? res.limit,
        hasNext: res.offset + res.items.length < res.totalNumberOfItems,
    });

export const mapSearchPlaylist = (res: TidalPaginatedResponse<TidalPlaylist>, limit?: number): SearchPlaylist =>
    createPaginatedResponse({
        items: res.items.map((p) => ({
            id: p.uuid,
            name: p.title,
            type: 'playlist' as const,
            image: imgFromTidal(p.squareImage ?? p.image),
            explicit: false,
            total_songs: p.numberOfTracks,
            playlist_type: p.type?.toLowerCase() === 'user' ? 'user' : 'editorial',
        })),
        total: res.totalNumberOfItems,
        offset: res.offset,
        limit: limit ?? res.limit,
        hasNext: res.offset + res.items.length < res.totalNumberOfItems,
    });
