import type {
    QobuzArtistBase,
    QobuzArtistImage,
    QobuzImage,
    QobuzOwner,
    QobuzPaginatedList,
    QobuzPerformer,
} from './common.types';

/* -------------------------------------------------------------------------- */
/*                              FAVORITE TYPES                                */
/* -------------------------------------------------------------------------- */

export type QobuzFavoriteTrack = {
    id: number;
    title: string;
    duration: number;
    track_number: number;
    media_number: number;
    performer: QobuzPerformer;
    album: {
        id: string;
        title: string;
        image: QobuzImage;
        artist: QobuzArtistBase;
    };
    created_at: number;
};

export type QobuzFavoriteAlbum = {
    id: string;
    title: string;
    artist: QobuzArtistBase;
    image: QobuzImage;
    release_date_original: string;
    hires_streamable: boolean;
    created_at: number;
};

export type QobuzFavoriteArtist = {
    id: number;
    name: string;
    slug: string;
    image?: QobuzArtistImage;
    albums_count: number;
    created_at: number;
};

export type QobuzFavoriteTracksResponse = {
    tracks: QobuzPaginatedList<QobuzFavoriteTrack>;
};

export type QobuzFavoriteAlbumsResponse = {
    albums: QobuzPaginatedList<QobuzFavoriteAlbum>;
};

export type QobuzFavoriteArtistsResponse = {
    artists: QobuzPaginatedList<QobuzFavoriteArtist>;
};

/* -------------------------------------------------------------------------- */
/*                              PLAYLIST TYPES                                */
/* -------------------------------------------------------------------------- */

export type QobuzUserPlaylist = {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    is_collaborative: boolean;
    tracks_count: number;
    duration: number;
    created_at: number;
    updated_at: number;
    owner: QobuzOwner;
    images?: string[];
    images300?: string[];
};

export type QobuzUserPlaylistsResponse = {
    playlists: QobuzPaginatedList<QobuzUserPlaylist>;
};

/* -------------------------------------------------------------------------- */
/*                              PURCHASE TYPES                                */
/* -------------------------------------------------------------------------- */

export type QobuzPurchase = {
    id: number;
    created_at: number;
    type: 'album' | 'track';
    album?: {
        id: string;
        title: string;
        artist: QobuzArtistBase;
        image: QobuzImage;
    };
    track?: {
        id: number;
        title: string;
        album: {
            id: string;
            title: string;
            image: QobuzImage;
        };
    };
};

export type QobuzPurchasesResponse = {
    purchases: QobuzPaginatedList<QobuzPurchase>;
};
