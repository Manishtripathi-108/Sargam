import type { SearchType } from '../../validators/common.validators';
import type { Album } from './album.model';
import type { Artist } from './artist.model';
import type { ImageAsset } from './image.model';
import type { Paginated } from './pagination.model';
import type { Playlist } from './playlist.model';
import type { SongBase } from './song.model';

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
    topQuery: SearchBase[];
    artists: SearchBase[];
    playlists: SearchBase[];
    songs: Array<SearchBase & { artists: string; album: string }>;
    albums: Array<SearchBase & { artists: string }>;
};

export type SearchPlaylist = Paginated<Omit<Playlist, 'songs' | 'description'>>;

export type SearchArtist = Paginated<Omit<Artist, 'bio' | 'follower_count'>>;

export type SearchAlbum = Paginated<Omit<Album, 'songs' | 'popularity' | 'total_songs' | 'artists'>>;

export type SearchSong = Paginated<SongBase>;
