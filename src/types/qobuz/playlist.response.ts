import type { QobuzSearchArtist } from './artist.response';
import type { QobuzGenre, QobuzImage, QobuzOwner, QobuzPaginatedList, QobuzPerformer, QobuzTag } from './common.types';

export type QobuzPlaylistTrack = {
    id: number;
    title: string;
    version?: string;
    duration: number;
    track_number: number;
    isrc: string;
    hires: boolean;
    hires_streamable: boolean;
    performer: QobuzPerformer;
    album: {
        id: string;
        title: string;
        image: QobuzImage;
    };
};

export type QobuzPlaylist = {
    id: number;
    name: string;
    description?: string;
    duration: number;
    tracks_count: number;
    users_count?: number;
    is_public: boolean;
    is_collaborative?: boolean;
    created_at?: string;
    updated_at?: string;
    images?: string[];
    images150?: string[];
    images300?: string[];
    owner: QobuzOwner;
    tracks?: QobuzPaginatedList<QobuzPlaylistTrack>;
};

export type QobuzSearchPlaylist = {
    id: number;
    name: string;
    description: string;
    tracks_count: number;
    users_count: number;
    duration: number;
    public_at: number;
    created_at: number;
    updated_at: number;
    is_public: boolean;
    is_collaborative: boolean;
    owner: QobuzOwner;
    indexed_at: number;
    slug: string;
    genres: QobuzGenre[];
    images: string[];
    is_published: boolean;
    is_featured: boolean;
    published_from: number;
    published_to: number;
    stores: string[];
    tags: QobuzTag[];
    image_rectangle: string[];
    image_rectangle_mini: string[];
    featured_artists: (Omit<QobuzSearchArtist, 'image'> & Partial<Pick<QobuzSearchArtist, 'image'>>)[];
    timestamp_position: number;
    images150: string[];
    images300: string[];
};
