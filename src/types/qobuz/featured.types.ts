import type { QobuzAlbum } from './album.response';
import type { QobuzPaginatedList } from './common.types';
import type { QobuzPlaylist } from './playlist.response';

export type QobuzGenreInfo = {
    id: number;
    name: string;
    slug: string;
    path: number[];
    color?: string;
    image?: {
        small: string;
        large: string;
    };
    subgenres?: QobuzGenreInfo[];
};

export type QobuzFeaturedItem = {
    id: string;
    type: 'album' | 'playlist' | 'article' | 'label';
    title: string;
    subtitle?: string;
    image?: {
        small: string;
        large: string;
    };
    album?: QobuzAlbum;
    playlist?: QobuzPlaylist;
};

export type QobuzFeaturedAlbumsResponse = {
    albums: QobuzPaginatedList<QobuzAlbum>;
};

export type QobuzFeaturedPlaylistsResponse = {
    playlists: QobuzPaginatedList<QobuzPlaylist>;
};

export type QobuzGenreListResponse = {
    genres: QobuzPaginatedList<QobuzGenreInfo>;
};

export type QobuzAlbumListType =
    | 'new-releases'
    | 'new-releases-full'
    | 'press-awards'
    | 'best-sellers'
    | 'editor-picks'
    | 'most-streamed'
    | 'most-featured'
    | 'ideal-discography'
    | 'recent-releases';
