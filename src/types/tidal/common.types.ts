/* -------------------------------------------------------------------------- */
/*                                BASE TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalImageSizes = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';

export type TidalAudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES' | 'HI_RES_LOSSLESS';

export type TidalAudioMode = 'STEREO' | 'DOLBY_ATMOS' | 'SONY_360RA';

export type TidalMediaMetadata = {
    tags: string[];
};

export type TidalArtistRole = {
    categoryId: number;
    category: string;
};

/* -------------------------------------------------------------------------- */
/*                              ARTIST TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalArtist = {
    id: number;
    name: string;
    artistTypes?: string[];
    picture?: string | null;
    selectedAlbumCoverFallback?: string | null;
    popularity?: number;
    url?: string;
    artistRoles?: TidalArtistRole[];
    mixes?: {
        ARTIST_MIX?: string;
    };
    handle?: string | null;
    userId?: number | null;
    spotlighted?: boolean;
    type?: string;
};

/* -------------------------------------------------------------------------- */
/*                               ALBUM TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalAlbumBase = {
    id: number;
    title: string;
    cover: string;
    vibrantColor?: string | null;
    videoCover?: string | null;
    releaseDate?: string;
};

export type TidalAlbum = TidalAlbumBase & {
    duration: number;
    numberOfTracks: number;
    numberOfVideos?: number;
    numberOfVolumes: number;
    streamReady?: boolean;
    payToStream?: boolean;
    adSupportedStreamReady?: boolean;
    djReady?: boolean;
    stemReady?: boolean;
    streamStartDate?: string;
    allowStreaming?: boolean;
    premiumStreamingOnly?: boolean;
    releaseDate?: string;
    copyright?: string;
    type: string;
    version?: string | null;
    url: string;
    explicit: boolean;
    upc?: string;
    popularity?: number;
    audioQuality: TidalAudioQuality;
    audioModes: TidalAudioMode[];
    mediaMetadata?: TidalMediaMetadata;
    upload?: boolean;
    ai?: boolean;
    artist: TidalArtist;
    artists: TidalArtist[];
    tracks?: TidalTrack[];
};

export type TidalSearchAlbum = TidalAlbumBase & {
    numberOfTracks: number;
    explicit: boolean;
    audioQuality: TidalAudioQuality;
    audioModes?: TidalAudioMode[];
    mediaMetadata?: TidalMediaMetadata;
    artist?: TidalArtist;
    artists?: TidalArtist[];
    popularity?: number;
    duration?: number;
    upc?: string;
    type?: string;
};

/* -------------------------------------------------------------------------- */
/*                               TRACK TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalTrack = {
    id: number;
    title: string;
    duration: number;
    replayGain?: number;
    peak?: number;
    allowStreaming?: boolean;
    streamReady?: boolean;
    payToStream?: boolean;
    adSupportedStreamReady?: boolean;
    djReady?: boolean;
    stemReady?: boolean;
    streamStartDate?: string;
    premiumStreamingOnly?: boolean;
    trackNumber: number;
    volumeNumber: number;
    version?: string | null;
    popularity?: number;
    copyright?: string;
    bpm?: number | null;
    key?: string | null;
    keyScale?: 'MAJOR' | 'MINOR' | null;
    url: string;
    isrc: string;
    editable?: boolean;
    explicit: boolean;
    audioQuality: TidalAudioQuality;
    audioModes: TidalAudioMode[];
    mediaMetadata?: TidalMediaMetadata;
    upload?: boolean;
    accessType?: string | null;
    spotlighted?: boolean;
    ai?: boolean;
    artist: TidalArtist;
    artists: TidalArtist[];
    album: TidalAlbumBase;
    mixes?: {
        TRACK_MIX?: string;
    };
    dateAdded?: string;
    index?: number;
    itemUuid?: string;
};

/* -------------------------------------------------------------------------- */
/*                               VIDEO TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalVideo = {
    id: number;
    title: string;
    duration: number;
    quality: string;
    releaseDate?: string;
    imagePath?: string | null;
    imageId?: string;
    vibrantColor?: string | null;
    streamReady?: boolean;
    adSupportedStreamReady?: boolean;
    djReady?: boolean;
    stemReady?: boolean;
    streamStartDate?: string;
    allowStreaming?: boolean;
    explicit?: boolean;
    popularity?: number;
    type?: string;
    artists: TidalArtist[];
    album?: TidalAlbumBase | null;
};

/* -------------------------------------------------------------------------- */
/*                              USER TYPES                                    */
/* -------------------------------------------------------------------------- */

export type TidalUser = {
    id: number;
    nickname?: string;
    picture?: string;
};

/* -------------------------------------------------------------------------- */
/*                            PLAYLIST TYPES                                  */
/* -------------------------------------------------------------------------- */

export type TidalPlaylist = {
    uuid: string;
    title: string;
    numberOfTracks: number;
    numberOfVideos?: number;
    creator?: {
        id?: number;
        name?: string;
    };
    description?: string | null;
    duration: number;
    lastUpdated: string;
    created: string;
    type: string;
    publicPlaylist: boolean;
    url: string;
    image?: string | null;
    squareImage?: string | null;
    customImageUrl?: string | null;
    popularity?: number;
    promotedArtists?: TidalArtist[];
    lastItemAddedAt?: string | null;
    tracks?: TidalTrack[];
};

export type TidalPlaylistItem = {
    item: TidalTrack;
    type: string;
    cut?: {
        name: string;
        startTime?: number;
        endTime?: number;
    };
};

/* -------------------------------------------------------------------------- */
/*                            PAGINATION TYPES                                */
/* -------------------------------------------------------------------------- */

export type TidalPaginatedResponse<T> = {
    items: T[];
    limit: number;
    offset: number;
    totalNumberOfItems: number;
};
