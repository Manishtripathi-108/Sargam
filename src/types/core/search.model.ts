import type { SearchType } from '../../validators/common.validators';
import type { AlbumType } from './album.model';
import type { ImageAsset } from './image.model';
import type { Paginated } from './pagination.model';
import type { Playlist } from './playlist.model';
import type { QualityTag, SongBase } from './song.model';

export type SearchParams = {
    query: string;
    limit: number;
    offset: number;
};

export type GlobalSearchParams = SearchParams & {
    type: SearchType;
};

export type SearchBase = {
    id: string;
    name: string;
    image: ImageAsset;
    type: Exclude<SearchType, 'all'>;
};

export type GlobalSearchResult = {
    topHit?: {
        type: string;
        item: SearchBase;
    } | null;
    topQuery: SearchBase[];
    artists: SearchBase[];
    playlists: SearchBase[];
    songs: Array<SearchBase & { artists: string; album: string; quality_tags?: QualityTag[] }>;
    albums: Array<SearchBase & { artists: string; quality_tags?: QualityTag[] }>;
};

export type SearchPlaylist = Paginated<Omit<Playlist, 'songs' | 'description'>>;

export type SearchArtistItem = {
    id: string;
    name: string;
    type: 'artist';
    image: ImageAsset;
    url?: string | null;
};

export type SearchArtist = Paginated<SearchArtistItem>;

export type SearchAlbumItem = {
    id: string;
    name: string;
    type: AlbumType;
    image: ImageAsset;
    release_date: string | null;
    language?: string | null;
    explicit: boolean;
    quality_tags?: QualityTag[];
};

export type SearchAlbum = Paginated<SearchAlbumItem>;

export type SearchSong = Paginated<SongBase>;
