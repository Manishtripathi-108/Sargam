import type { Prettify } from '../helper.types';
import type { ImageAsset } from './image.model';

export type ArtistBase = {
    id: string;
    name: string;
    type: 'artist';
};

export type Artist = Prettify<
    ArtistBase & {
        bio: string | null;
        image: ImageAsset;
        follower_count: number;

        // Enriched fields:
        popularity: number | null;
        roles: string[];
        artist_types: string[];
        url: string | null;
    }
>;
