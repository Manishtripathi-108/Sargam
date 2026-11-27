# Tidal Provider Documentation

> **Provider**: Tidal  
> **Type**: High-fidelity music streaming service  
> **Base URL**: `https://api.tidal.com/v1`  
> **Authentication**: OAuth2 Client Credentials (app-level)

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Provider Architecture](#provider-architecture)
- [API Reference](#api-reference)
    - [Songs Module](#songs-module)
    - [Albums Module](#albums-module)
    - [Artists Module](#artists-module)
    - [Playlists Module](#playlists-module)
    - [Search Module](#search-module)
- [API Endpoints](#api-endpoints)
- [Types Reference](#types-reference)
- [Quality Levels](#quality-levels)
- [URL Patterns](#url-patterns)
- [Album Art](#album-art)
- [Known Limitations](#known-limitations)

---

## Overview

The Tidal provider implements metadata access to Tidal's music streaming API:

- **Metadata retrieval** for tracks, albums, artists, and playlists
- **Search functionality** across all content types
- **ISRC/UPC lookup** for cross-platform matching
- **OAuth2 authentication** with automatic token refresh
- **Pagination support** for all list endpoints

---

## File Structure

```
src/providers/tidal/
├── tidal.provider.ts      # Main provider export (aggregates all modules)
├── tidal.client.ts        # Axios client with OAuth2 authentication
├── tidal.routes.ts        # API endpoint constants
├── tidal.songs.ts         # Track operations (get by ID, ISRC, link)
├── tidal.albums.ts        # Album operations (get, tracks, UPC lookup)
├── tidal.artists.ts       # Artist operations (get, top tracks, albums, similar)
├── tidal.playlists.ts     # Playlist operations (get, tracks, items)
└── tidal.search.ts        # Search across all content types

src/types/tidal/
├── index.ts               # Type exports
├── common.types.ts        # Base types (artist, album, track, playlist, pagination)
└── search.response.ts     # Search response types
```

---

## Configuration

### Environment Variables

```bash
# Required
TIDAL_CLIENT_ID=your_client_id        # OAuth client ID
TIDAL_CLIENT_SECRET=your_client_secret # OAuth client secret

# Optional
TIDAL_COUNTRY_CODE=US                  # Default country code (default: US)
```

---

## Provider Architecture

### Main Provider Export

```typescript
// src/providers/tidal/tidal.provider.ts
import * as TidalAlbums from './tidal.albums';
import * as TidalArtists from './tidal.artists';
import { isTidalConfigured, resetTidalClient, getAlbumArtUrl, getCountryCode } from './tidal.client';
import * as TidalPlaylists from './tidal.playlists';
import * as TidalSearch from './tidal.search';
import * as TidalSongs from './tidal.songs';

export const TidalProvider = {
    songs: TidalSongs,
    albums: TidalAlbums,
    artists: TidalArtists,
    playlists: TidalPlaylists,
    search: TidalSearch,

    // Utility functions
    isConfigured: isTidalConfigured,
    resetClient: resetTidalClient,
    getAlbumArtUrl,
    getCountryCode,
};
```

### HTTP Client

```typescript
// src/providers/tidal/tidal.client.ts
export async function getTidalClient(): Promise<AxiosInstance>;
export function getCountryCode(): string;
export function isTidalConfigured(): boolean;
export function resetTidalClient(): void;
export function getAlbumArtUrl(coverUuid: string, size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'): string;
```

---

## API Reference

### Songs Module

**File**: `tidal.songs.ts`

| Function    | Parameters      | Returns                       | Description            |
| ----------- | --------------- | ----------------------------- | ---------------------- |
| `getById`   | `id: string`    | `Promise<TidalTrack>`         | Get track by ID        |
| `getByIds`  | `ids: string[]` | `Promise<TidalTrack[]>`       | Get multiple tracks    |
| `getByLink` | `link: string`  | `Promise<TidalTrack>`         | Get track by Tidal URL |
| `getByIsrc` | `isrc: string`  | `Promise<TidalTrack \| null>` | Find track by ISRC     |
| `getIsrc`   | `id: string`    | `Promise<string>`             | Get ISRC for track     |

### Albums Module

**File**: `tidal.albums.ts`

| Function    | Parameters              | Returns                       | Description            |
| ----------- | ----------------------- | ----------------------------- | ---------------------- |
| `getById`   | `id: string`            | `Promise<TidalAlbum>`         | Get album by ID        |
| `getByIds`  | `ids: string[]`         | `Promise<TidalAlbum[]>`       | Get multiple albums    |
| `getByLink` | `link: string`          | `Promise<TidalAlbum>`         | Get album by Tidal URL |
| `getTracks` | `{ id, limit, offset }` | `Promise<PaginatedResponse>`  | Get album tracks       |
| `getByUpc`  | `upc: string`           | `Promise<TidalAlbum \| null>` | Find album by UPC      |

### Artists Module

**File**: `tidal.artists.ts`

| Function            | Parameters              | Returns                      | Description             |
| ------------------- | ----------------------- | ---------------------------- | ----------------------- |
| `getById`           | `id: string`            | `Promise<TidalArtist>`       | Get artist by ID        |
| `getByIds`          | `ids: string[]`         | `Promise<TidalArtist[]>`     | Get multiple artists    |
| `getByLink`         | `link: string`          | `Promise<TidalArtist>`       | Get artist by Tidal URL |
| `getTopTracks`      | `{ id, limit, offset }` | `Promise<PaginatedResponse>` | Get top tracks          |
| `getAlbums`         | `{ id, limit, offset }` | `Promise<PaginatedResponse>` | Get artist albums       |
| `getSimilarArtists` | `{ id, limit, offset }` | `Promise<PaginatedResponse>` | Get similar artists     |

### Playlists Module

**File**: `tidal.playlists.ts`

| Function    | Parameters              | Returns                      | Description                  |
| ----------- | ----------------------- | ---------------------------- | ---------------------------- |
| `getById`   | `id: string`            | `Promise<TidalPlaylist>`     | Get playlist by UUID         |
| `getByLink` | `link: string`          | `Promise<TidalPlaylist>`     | Get playlist by Tidal URL    |
| `getTracks` | `{ id, limit, offset }` | `Promise<PaginatedResponse>` | Get playlist tracks          |
| `getItems`  | `{ id, limit, offset }` | `Promise<PaginatedResponse>` | Get playlist items with cuts |

### Search Module

**File**: `tidal.search.ts`

| Function    | Parameters                 | Returns                           | Description        |
| ----------- | -------------------------- | --------------------------------- | ------------------ |
| `all`       | `{ query, limit, offset }` | `Promise<TidalSearchAllResponse>` | Search all types   |
| `songs`     | `{ query, limit, offset }` | `Promise<PaginatedResponse>`      | Search tracks      |
| `albums`    | `{ query, limit, offset }` | `Promise<PaginatedResponse>`      | Search albums      |
| `artists`   | `{ query, limit, offset }` | `Promise<PaginatedResponse>`      | Search artists     |
| `playlists` | `{ query, limit, offset }` | `Promise<PaginatedResponse>`      | Search playlists   |
| `byIsrc`    | `{ isrc: string }`         | `Promise<TidalTrack \| null>`     | Find track by ISRC |

---

## API Endpoints

```
# Authentication
POST https://auth.tidal.com/v1/oauth2/token

# Tracks
GET /tracks/{id}?countryCode={code}

# Albums
GET /albums/{id}?countryCode={code}
GET /albums/{id}/tracks?countryCode={code}&limit={n}&offset={o}

# Artists
GET /artists/{id}?countryCode={code}
GET /artists/{id}/toptracks?countryCode={code}&limit={n}&offset={o}
GET /artists/{id}/albums?countryCode={code}&limit={n}&offset={o}
GET /artists/{id}/similar?countryCode={code}&limit={n}&offset={o}

# Playlists
GET /playlists/{uuid}?countryCode={code}
GET /playlists/{uuid}/tracks?countryCode={code}&limit={n}&offset={o}
GET /playlists/{uuid}/items?countryCode={code}&limit={n}&offset={o}

# Search
GET /search?query={q}&countryCode={code}&limit={n}&offset={o}
GET /search/tracks?query={q}&countryCode={code}&limit={n}&offset={o}
GET /search/albums?query={q}&countryCode={code}&limit={n}&offset={o}
GET /search/artists?query={q}&countryCode={code}&limit={n}&offset={o}
GET /search/playlists?query={q}&countryCode={code}&limit={n}&offset={o}
```

---

## Types Reference

### Base Types

```typescript
type TidalAudioQuality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES' | 'HI_RES_LOSSLESS';
type TidalAudioMode = 'STEREO' | 'DOLBY_ATMOS' | 'SONY_360RA';

type TidalArtist = {
    id: number;
    name: string;
    artistTypes?: string[];
    picture?: string;
    popularity?: number;
    url?: string;
};

type TidalTrack = {
    id: number;
    title: string;
    duration: number;
    trackNumber: number;
    volumeNumber: number;
    isrc: string;
    explicit: boolean;
    audioQuality: TidalAudioQuality;
    copyright?: string;
    album: TidalAlbumBase;
    artist: TidalArtist;
    artists: TidalArtist[];
    mediaMetadata?: { tags: string[] };
};

type TidalAlbum = {
    id: number;
    title: string;
    cover: string;
    releaseDate: string;
    duration: number;
    numberOfTracks: number;
    numberOfVolumes: number;
    copyright?: string;
    type: string;
    explicit: boolean;
    upc?: string;
    audioQuality: TidalAudioQuality;
    audioModes: TidalAudioMode[];
    artist: TidalArtist;
    artists: TidalArtist[];
};

type TidalPlaylist = {
    uuid: string;
    title: string;
    description?: string;
    duration: number;
    numberOfTracks: number;
    lastUpdated: string;
    created: string;
    type: string;
    publicPlaylist: boolean;
    url?: string;
    image?: string;
    squareImage?: string;
    creator?: TidalUser;
    popularity?: number;
};
```

---

## Quality Levels

Quality levels from `mediaMetadata.tags`:

| Tag              | Description                      |
| ---------------- | -------------------------------- |
| `LOSSLESS`       | CD quality (16-bit/44.1kHz FLAC) |
| `HIRES_LOSSLESS` | Hi-Res (up to 24-bit/192kHz)     |
| `MQA`            | Master Quality Authenticated     |
| `DOLBY_ATMOS`    | Dolby Atmos                      |

---

## URL Patterns

Supported Tidal URL formats:

- `https://listen.tidal.com/track/{id}`
- `https://tidal.com/browse/track/{id}`
- `https://listen.tidal.com/album/{id}`
- `https://tidal.com/browse/album/{id}`
- `https://listen.tidal.com/artist/{id}`
- `https://tidal.com/browse/artist/{id}`
- `https://listen.tidal.com/playlist/{uuid}`
- `https://tidal.com/browse/playlist/{uuid}`

Track/Album/Artist IDs are numeric. Playlist IDs are UUIDs.

---

## Album Art

Album art URL format:

```
https://resources.tidal.com/images/{uuid}/{size}.jpg
```

Available sizes: `160x160`, `320x320`, `640x640`, `1280x1280`

The cover UUID uses hyphens in API response but slashes in URLs:

- API: `ab12cd34-ef56-gh78-ij90-klmnopqrstuv`
- URL: `ab12cd34/ef56/gh78/ij90/klmnopqrstuv`

Use `getAlbumArtUrl(coverUuid, size)` for automatic conversion.

---

## Known Limitations

1. **No Public API**: Tidal doesn't have an official public API. Requires registered OAuth credentials.

2. **Country Code Required**: All requests need a `countryCode` parameter. Content availability varies by region.

3. **Metadata Only**: This provider focuses on metadata. Stream/download URLs require premium account access and are not implemented.

4. **No Bulk Endpoints**: Tidal doesn't support bulk fetching. `getByIds` fetches in parallel.

5. **Token Caching**: Access tokens are cached and refreshed automatically with a 5-minute buffer before expiration.
