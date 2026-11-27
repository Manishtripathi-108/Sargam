const TIDAL_ROUTES = {
    AUTH: 'https://auth.tidal.com/v1/oauth2/token',

    BASE: 'https://api.tidal.com/v1',

    TRACK: {
        DETAILS: '/tracks',
        PLAYBACK_INFO: '/tracks/{id}/playbackinfo',
    },

    ALBUM: {
        DETAILS: '/albums',
        TRACKS: '/albums/{id}/tracks',
        ITEMS: '/albums/{id}/items',
    },

    ARTIST: {
        DETAILS: '/artists',
        TOP_TRACKS: '/artists/{id}/toptracks',
        ALBUMS: '/artists/{id}/albums',
        SIMILAR: '/artists/{id}/similar',
    },

    PLAYLIST: {
        DETAILS: '/playlists',
        TRACKS: '/playlists/{uuid}/tracks',
        ITEMS: '/playlists/{uuid}/items',
    },

    SEARCH: {
        BASE: '/search',
        TRACKS: '/search/tracks',
        ALBUMS: '/search/albums',
        ARTISTS: '/search/artists',
        PLAYLISTS: '/search/playlists',
    },

    IMAGES: {
        BASE: 'https://resources.tidal.com/images',
        SIZES: {
            SMALL: '160x160',
            MEDIUM: '320x320',
            LARGE: '640x640',
            XL: '1280x1280',
            ORIGIN: 'origin',
        },
    },
} as const;

export default TIDAL_ROUTES;
