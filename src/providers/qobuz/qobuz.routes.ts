const QOBUZ_ROUTES = {
    BASE: 'https://www.qobuz.com/api.json/0.2',

    TRACK: {
        GET: '/track/get',
        SEARCH: '/track/search',
        /** Requires signature: track_id, format_id, intent='stream', request_ts, request_sig */
        FILE_URL: '/track/getFileUrl',
    },

    /** External stream APIs (fallbacks) */
    STREAM: {
        PRIMARY: 'https://dab.yeet.su/api/stream',
        FALLBACK_1: 'https://dabmusic.xyz/api/stream',
        FALLBACK_2: 'https://qobuz.squid.wtf/api/download-music',
        FALLBACK_3: 'https://qobuzapi.vercel.app/api/stream',
        FALLBACK_4: 'https://qobuz.deno.dev/stream',
    },

    ALBUM: {
        GET: '/album/get',
        SEARCH: '/album/search',
        SUGGEST: '/album/suggest',
        FEATURED: '/album/getFeatured',
    },

    ARTIST: {
        GET: '/artist/get',
        SEARCH: '/artist/search',
        PAGE: '/artist/page',
    },

    PLAYLIST: {
        GET: '/playlist/get',
        SEARCH: '/playlist/search',
        FEATURED: '/playlist/getFeatured',
        USER_PLAYLISTS: '/playlist/getUserPlaylists',
        CREATE: '/playlist/create',
        DELETE: '/playlist/delete',
        UPDATE: '/playlist/update',
        ADD_TRACKS: '/playlist/addTracks',
        REMOVE_TRACKS: '/playlist/deleteTracks',
        SUBSCRIBE: '/playlist/subscribe',
        UNSUBSCRIBE: '/playlist/unsubscribe',
    },

    LABEL: {
        GET: '/label/get',
        SEARCH: '/label/search',
        ALBUMS: '/label/list',
    },

    SEARCH: {
        CATALOG: '/catalog/search',
    },

    USER: {
        LOGIN: '/user/login',
        GET: '/user/get',
    },

    FAVORITE: {
        GET_TRACKS: '/favorite/getUserFavorites',
        GET_ALBUMS: '/favorite/getUserFavorites',
        GET_ARTISTS: '/favorite/getUserFavorites',
        GET_ALL: '/favorite/getUserFavorites',
        ADD: '/favorite/create',
        REMOVE: '/favorite/delete',
    },

    PURCHASE: {
        GET_ALL: '/purchase/getUserPurchases',
    },

    GENRE: {
        LIST: '/genre/list',
        GET: '/genre/get',
    },

    /** Quality: 5=MP3 320, 6=FLAC 16-bit, 7=FLAC 24-bit/96kHz, 27=FLAC 24-bit/192kHz */
    QUALITY: {
        MP3_320: '5',
        FLAC_16: '6',
        FLAC_24_96: '7',
        FLAC_24_192: '27',
    },
} as const;

export default QOBUZ_ROUTES;
