import type { Prettify } from '../helper.types';
import type { AlbumBase } from './album.model';
import type { ArtistBase } from './artist.model';
import type { ImageAsset } from './image.model';

export type QualityTag =
    | 'LOSSLESS'
    | 'HI_RES'
    | 'HIRES_LOSSLESS'
    | 'DOLBY_ATMOS'
    | 'SPATIAL_AUDIO'
    | '360_REALITY_AUDIO'
    | 'MQA'
    | 'HIGH'
    | 'STANDARD'

export type SongAudioQuality = 'very_low' | 'low' | 'medium' | 'high' | 'lossless' | 'hi_res';

export type SongAudio = {
    very_low?: string;
    low?: string;
    medium?: string;
    high?: string;
    lossless?: string;
    hi_res?: string;
};

export type SongBase = {
    id: string;
    name: string;
    type: 'song';
    duration_ms: number;
    explicit: boolean;
    language: string | null;
    image: ImageAsset;
    year: number | null;
    album: string;
    artists: string;
    quality_tags?: QualityTag[];
    audio_quality?: string | null;
    isrc?: string | null;
    version?: string | null;
    popularity?: number | null;
};

export type Song = Prettify<
    Omit<SongBase, 'album' | 'artists'> & {
        disc_number: number | null;
        track_number: number | null;
        release_date: string | null;
        copyright: string | null;
        album: AlbumBase;
        artists: ArtistBase[];
        audio?: SongAudio;

        // Audiophile & Audio Quality
        quality_tags: QualityTag[];
        audio_quality: string | null;
        audio_modes: string[];
        is_dolby_atmos: boolean;
        bit_depth: number | null;
        sample_rate: number | null;

        // Music Acoustics & Volume Normalization
        bpm: number | null;
        key: string | null;
        key_scale: 'major' | 'minor' | null;
        replay_gain: number | null;
        peak: number | null;

        // Industry & Catalog Metadata
        isrc: string | null;
        label: string | null;
        version: string | null;
        popularity: number | null;
        url: string | null;

        // Lyrics / Availability Flags
        has_lyrics: boolean;
        lyrics_id: string | null;
    }
>;
