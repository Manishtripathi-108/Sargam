import type { QobuzAlbumArtist } from './album.response';
import type {
    QobuzArtistBase,
    QobuzArtistImage,
    QobuzAudioQuality,
    QobuzGenre,
    QobuzImage,
    QobuzLabel,
    QobuzRights,
} from './common.types';

/* -------------------------------------------------------------------------- */
/*                             ARTIST GET TYPES                               */
/* -------------------------------------------------------------------------- */

type QobuzArtistBiography = {
    summary: string;
    content: string;
    source: string;
    language: string;
};

export type QobuzArtist = QobuzArtistBase & {
    albums_as_primary_artist_count: number;
    albums_as_primary_composer_count: number;
    picture?: string;
    image?: QobuzArtistImage;
    similar_artist_ids: number[];
    information?: string;
    biography?: QobuzArtistBiography;
};

export type QobuzSearchArtist = QobuzArtistBase & {
    picture?: string;
    image: QobuzArtistImage;
};

/* -------------------------------------------------------------------------- */
/*                            ARTIST PAGE TYPES                               */
/* -------------------------------------------------------------------------- */

export type QobuzDisplayName = {
    display: string;
};

export type QobuzPortraitImage = {
    hash: string;
    format: string;
};

export type QobuzArtistImages = {
    portrait?: QobuzPortraitImage;
};

export type QobuzArtistPageBiography = {
    content: string;
    source: string | null;
    language: string;
};

export type QobuzSimilarArtist = {
    id: number;
    name: QobuzDisplayName;
    images: QobuzArtistImages;
};

export type QobuzSimilarArtists = {
    has_more: boolean;
    items: QobuzSimilarArtist[];
};

export type QobuzPageArtist = {
    id: number;
    name: QobuzDisplayName;
};

export type QobuzPageComposer = {
    id: number;
    name: QobuzDisplayName;
};

export type QobuzPageAudioInfo = Omit<QobuzAudioQuality, 'hires' | 'hires_streamable'>;

export type QobuzPhysicalSupport = {
    media_number: number;
    track_number: number;
};

export type QobuzPageTrackAlbum = {
    id: string;
    title: string;
    version: string | null;
    image: QobuzImage;
    label: Pick<QobuzLabel, 'id' | 'name'>;
    genre: Omit<QobuzGenre, 'slug' | 'color'>;
};

export type QobuzTopTrack = {
    id: number;
    isrc: string;
    title: string;
    work: string | null;
    version: string | null;
    duration: number;
    parental_warning: boolean;
    composer: QobuzPageComposer;
    artist: QobuzPageArtist;
    artists: QobuzPageArtist[];
    audio_info: QobuzPageAudioInfo;
    rights: QobuzRights;
    physical_support: QobuzPhysicalSupport;
    album: QobuzPageTrackAlbum;
};

export type QobuzPageDates = {
    download: string;
    original: string;
    stream: string;
};

export type QobuzReleaseRights = {
    purchasable: boolean;
    streamable: boolean;
    downloadable: boolean;
    hires_streamable: boolean;
    hires_purchasable: boolean;
};

export type QobuzReleaseItem = {
    id: string;
    title: string;
    version?: string;
    tracks_count: number;
    artist: QobuzPageArtist;
    artists: QobuzAlbumArtist[];
    image: QobuzImage;
    label: Pick<QobuzLabel, 'id' | 'name'>;
    genre: Omit<QobuzGenre, 'slug' | 'color'>;
    release_type: string;
    release_tags: string[];
    duration: number;
    dates: QobuzPageDates;
    parental_warning: boolean;
    audio_info: QobuzPageAudioInfo;
    rights: QobuzReleaseRights;
    awards: unknown[];
};

export type QobuzRelease = {
    type: string;
    has_more: boolean;
    items: QobuzReleaseItem[];
};

export type QobuzTracksAppearsOn = {
    id: number;
    isrc: string;
    title: string;
    work: string | null;
    version: string | null;
    duration: number;
    parental_warning: boolean;
    composer?: QobuzPageComposer;
    artist: QobuzPageArtist;
    artists: QobuzPageArtist[];
    audio_info: QobuzPageAudioInfo;
    rights: QobuzRights;
    physical_support: QobuzPhysicalSupport;
    album: QobuzPageTrackAlbum;
};

export type QobuzArtistPlaylists = {
    has_more: boolean;
    items: unknown[];
};

export type QobuzArtistPage = {
    id: number;
    name: QobuzDisplayName;
    artist_category: string;
    biography: QobuzArtistPageBiography;
    images: QobuzArtistImages;
    similar_artists: QobuzSimilarArtists;
    top_tracks: QobuzTopTrack[];
    last_release: QobuzReleaseItem | null;
    releases: QobuzRelease[];
    tracks_appears_on: QobuzTracksAppearsOn[];
    playlists: QobuzArtistPlaylists;
};
