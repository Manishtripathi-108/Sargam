import type {
    TidalAlbum,
    TidalArtist,
    TidalPaginatedResponse,
    TidalPlaylist,
    TidalTrack,
    TidalVideo,
} from './common.types';

/* -------------------------------------------------------------------------- */
/*                            SEARCH RESPONSE TYPES                           */
/* -------------------------------------------------------------------------- */

export type TidalSearchTopHit = {
    type: string;
    value: TidalArtist | TidalAlbum | TidalTrack | TidalPlaylist;
};

export type TidalSearchAllResponse = {
    artists?: TidalPaginatedResponse<TidalArtist>;
    albums?: TidalPaginatedResponse<TidalAlbum>;
    tracks?: TidalPaginatedResponse<TidalTrack>;
    playlists?: TidalPaginatedResponse<TidalPlaylist>;
    videos?: TidalPaginatedResponse<TidalVideo>;
    topHit?: TidalSearchTopHit;
};
