import type { QobuzSearchAlbum } from './album.response';
import type { QobuzSearchArtist } from './artist.response';
import type { QobuzPaginatedList } from './common.types';
import type { QobuzSearchPlaylist } from './playlist.response';
import type { QobuzSearchTrack } from './song.response';

export type QobuzCatalogSearchResponse = {
    query: string;
    albums?: QobuzPaginatedList<QobuzSearchAlbum>;
    artists?: QobuzPaginatedList<QobuzSearchArtist>;
    tracks?: QobuzPaginatedList<QobuzSearchTrack>;
    playlists?: QobuzPaginatedList<QobuzSearchPlaylist>;
};

export type QobuzAlbumSearchResponse = {
    query: string;
    albums: QobuzPaginatedList<QobuzSearchAlbum>;
};

export type QobuzTrackSearchResponse = {
    query: string;
    tracks: QobuzPaginatedList<QobuzSearchTrack>;
};

export type QobuzArtistSearchResponse = {
    query: string;
    artists: QobuzPaginatedList<QobuzSearchArtist>;
};

export type QobuzPlaylistSearchResponse = {
    query: string;
    playlists: QobuzPaginatedList<QobuzSearchPlaylist>;
};
