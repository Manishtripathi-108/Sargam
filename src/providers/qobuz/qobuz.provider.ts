import * as QobuzAlbums from './qobuz.albums';
import * as QobuzArtists from './qobuz.artists';
import * as QobuzAuth from './qobuz.auth';
import * as QobuzFeatured from './qobuz.featured';
import * as QobuzLabels from './qobuz.labels';
import * as QobuzPlaylists from './qobuz.playlists';
import * as QobuzSearch from './qobuz.search';
import * as QobuzSongs from './qobuz.songs';

export const QobuzProvider = {
    // Content modules
    songs: QobuzSongs,
    albums: QobuzAlbums,
    artists: QobuzArtists,
    playlists: QobuzPlaylists,
    labels: QobuzLabels,
    search: QobuzSearch,
    featured: QobuzFeatured,

    // Auth module
    auth: QobuzAuth,
};

export default QobuzProvider;
