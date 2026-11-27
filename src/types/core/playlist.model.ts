import type { Prettify } from '../helper.types';
import type { ImageAsset } from './image.model';
import type { Song } from './song.model';

export type PlaylistType = 'user' | 'editorial' | 'mix';

export type PlaylistBase = {
    id: string;
    name: string;
    description: string | null;
    type: 'playlist';
    explicit: boolean;
    image: ImageAsset;
    total_songs: number;

    // Enriched fields:
    playlist_type?: PlaylistType | null;
    duration_ms?: number | null;
    popularity?: number | null;
    url?: string | null;
    creator?: { id: string; name?: string } | null;
    last_updated?: string | null;
    created_at?: string | null;
};

export type Playlist = Prettify<
    PlaylistBase & {
        songs: Song[] | null;
    }
>;
