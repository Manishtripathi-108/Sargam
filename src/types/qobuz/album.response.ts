import type {
    QobuzArtistBase,
    QobuzAudioQuality,
    QobuzGenre,
    QobuzImage,
    QobuzLabel,
    QobuzPaginatedList,
    QobuzReleaseDates,
    QobuzRights,
} from './common.types';
import type { QobuzSearchTrack } from './song.response';

export type QobuzAlbumArtist = {
    id: number;
    name: string;
    roles: string[];
};

type QobuzAlbumAdditionalDetails = {
    description?: string;
    description_language?: string;
    catchline?: string;
    composer: QobuzArtistBase;
    created_at: number;
    genres_list: string[];
    is_official: boolean;
    maximum_technical_specifications: string;
    product_sales_factors_monthly: number;
    product_sales_factors_weekly: number;
    product_sales_factors_yearly: number;
    product_type: string;
    product_url: string;
    recording_information: string;
    relative_url: string;
    release_tags: string[];
    release_type: string;
    subtitle: string;
};

type QobuzAlbumBase = QobuzAudioQuality &
    QobuzRights &
    QobuzReleaseDates & {
        id: string;
        qobuz_id: number;
        title: string;
        version?: string;
        duration: number;
        tracks_count: number;
        media_count: number;
        copyright?: string;
        upc: string;
        url: string;
        image: QobuzImage;
        artist: QobuzArtistBase;
        label: QobuzLabel;
        genre: QobuzGenre;
        parental_warning: boolean;
        released_at: number;
    };

export type QobuzAlbum = QobuzAlbumBase &
    QobuzAlbumAdditionalDetails & {
        artists: QobuzAlbumArtist;
        tracks: QobuzPaginatedList<Omit<QobuzSearchTrack, 'album'>>;
        genres_list?: string[];
    };

export type QobuzSearchAlbum = QobuzAlbumBase & {
    artists: QobuzAlbumArtist;
    popularity: number;
};

export type QobuzSearchTrackAlbum = Omit<QobuzAlbum, 'tracks' | 'artists'>;

export type QobuzTrackAlbum = Omit<QobuzAlbum, 'tracks' | 'artists' | keyof QobuzAlbumAdditionalDetails>;

export type QobuzArtistAlbum = {
    id: string;
    title: string;
    duration: number;
    tracks_count: number;
    release_date_original?: string;
    hires: boolean;
    hires_streamable: boolean;
    image: QobuzImage;
};
