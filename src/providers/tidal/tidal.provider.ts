import * as TidalAlbums from './tidal.albums';
import * as TidalArtists from './tidal.artists';
import { getCountryCode, isTidalConfigured, resetTidalClient } from './tidal.client';
import * as TidalPlaylists from './tidal.playlists';
import * as TidalSearch from './tidal.search';
import * as TidalSongs from './tidal.songs';

export const TidalProvider = {
    songs: TidalSongs,
    albums: TidalAlbums,
    artists: TidalArtists,
    playlists: TidalPlaylists,
    search: TidalSearch,

    // Utilities
    isConfigured: isTidalConfigured,
    resetClient: resetTidalClient,
    getCountryCode,
    getAlbumArtUrl: TidalAlbums.getAlbumArtUrl,
};

export default TidalProvider;
