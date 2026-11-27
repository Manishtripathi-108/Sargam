import type { Prettify } from '../helper.types';
import type { ArtistBase } from './artist.model';
import type { ImageAsset } from './image.model';
import type { QualityTag, SongBase } from './song.model';

export type AlbumType = 'single' | 'album' | 'compilation' | 'ep';

export type AlbumBase = {
    id: string;
    name: string;
    type: AlbumType;
};

export type Album = Prettify<
    AlbumBase & {
        image: ImageAsset;
        language?: string | null;
        artists: ArtistBase[];
        songs: SongBase[];
        popularity: number;
        release_date: string | null;
        explicit: boolean;
        total_songs: number;

        // Audiophile & Audio Quality
        quality_tags: QualityTag[];
        audio_quality: string | null;
        audio_modes: string[];
        is_dolby_atmos: boolean;

        // Catalog & Release Details
        duration_ms: number | null;
        number_of_volumes: number | null;
        upc: string | null;
        copyright: string | null;
        label: string | null;
        url: string | null;
    }
>;
