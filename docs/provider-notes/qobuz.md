# Qobuz Provider Documentation

> **Provider**: Qobuz  
> **Type**: High-resolution music streaming service  
> **Base URL**: `https://www.qobuz.com/api.json/0.2`  
> **Authentication**: App ID required; user auth optional for personalized features

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
    - [Labels Module](#labels-module)
    - [Search Module](#search-module)
    - [Featured Module](#featured-module)
    - [Auth Module](#auth-module)
- [API Endpoints](#api-endpoints)
- [Types Reference](#types-reference)
- [Quality Codes](#quality-codes)
- [URL Patterns](#url-patterns)
- [App Credential Extraction](#app-credential-extraction)
- [Stream URL Generation](#stream-url-generation)
- [External Fallback Services](#external-fallback-services)
- [Feature Comparison](#feature-comparison)
- [Notes & Considerations](#notes--considerations)

---

## Overview

The Qobuz provider implements a comprehensive interface to Qobuz's music streaming API, supporting:

- **Metadata retrieval** for tracks, albums, artists, playlists, and labels
- **Search functionality** across all content types
- **Stream URL generation** with native API + fallback support (uses user auth token when available for full streams)
- **User authentication** for full stream access (not previews)
- **Featured/editorial content** (new releases, best sellers, editor picks)
- **Automatic app credential extraction** from Qobuz bundle.js

---

## File Structure

```
src/providers/qobuz/
├── qobuz.provider.ts      # Main provider export (aggregates all modules)
├── qobuz.client.ts        # Axios client configuration with interceptors
├── qobuz.routes.ts        # API endpoint constants and quality codes
├── qobuz.auth.ts          # Authentication, signature generation, session management
├── qobuz.extractor.ts     # App credential extraction from Qobuz bundle.js
├── qobuz.songs.ts         # Track operations (get, stream URLs, previews)
├── qobuz.albums.ts        # Album operations (get, tracks, suggestions)
├── qobuz.artists.ts       # Artist operations (get, page, top tracks, albums)
├── qobuz.playlists.ts     # Playlist operations (get, tracks)
├── qobuz.labels.ts        # Label operations (get, albums, search)
├── qobuz.search.ts        # Search across all content types
└── qobuz.featured.ts      # Editorial/featured content

src/types/qobuz/
├── index.ts               # Type exports
├── common.types.ts        # Base types (pagination, quality, images, etc.)
├── auth.types.ts          # Authentication types (credentials, user, login)
├── song.response.ts       # Track response types
├── album.response.ts      # Album response types
├── artist.response.ts     # Artist response types
├── playlist.response.ts   # Playlist response types
├── label.types.ts         # Label response types
├── search.response.ts     # Search response types
└── featured.types.ts      # Featured/editorial content types
```

---

## Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# BASIC CONFIGURATION (Metadata access - no auth required)
# ═══════════════════════════════════════════════════════════════════════════════

QOBUZ_APP_ID=798273057           # Optional: Uses default if not set
QOBUZ_APP_SECRET=<secret>        # Required for full stream URLs (auto-extracted if not set)

# ═══════════════════════════════════════════════════════════════════════════════
# USER AUTHENTICATION (Required for favorites, playlists, purchases)
# ═══════════════════════════════════════════════════════════════════════════════

# Option 1: Email/Password login
QOBUZ_EMAIL=user@example.com     # Login email
QOBUZ_PASSWORD=yourpassword      # Login password (will be MD5 hashed)

# Option 2: Pre-existing token
QOBUZ_USER_AUTH_TOKEN=<token>    # Alternative to email/password
QOBUZ_USER_ID=<user_id>          # Required with auth token
```

---

## Provider Architecture

### Main Provider Export

```typescript
// src/providers/qobuz/qobuz.provider.ts
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
```

### HTTP Client Configuration

```typescript
// src/providers/qobuz/qobuz.client.ts
const DEFAULT_APP_ID = process.env.QOBUZ_APP_ID || '798273057';

export const qobuzClient = axios.create({
    baseURL: 'https://www.qobuz.com/api.json/0.2',
    headers: {
        Accept: 'application/json',
        origin: 'https://play.qobuz.com',
        referer: 'https://play.qobuz.com/',
        'x-app-id': DEFAULT_APP_ID,
    },
    params: {
        app_id: DEFAULT_APP_ID,
    },
});

// Initialize with extracted credentials
export async function initializeClient(): Promise<void>;
```

---

## API Reference

### Songs Module

**File**: `qobuz.songs.ts`

| Function        | Parameters                                | Returns                         | Description                                  |
| --------------- | ----------------------------------------- | ------------------------------- | -------------------------------------------- |
| `getById`       | `track_id: string`                        | `Promise<QobuzTrack>`           | Get track by ID                              |
| `getByLink`     | `link: string`                            | `Promise<QobuzTrack>`           | Get track by Qobuz URL                       |
| `getFileUrl`    | `trackId: string, quality?: QobuzQuality` | `Promise<QobuzFileUrlResponse>` | Get native stream URL (requires app secret)  |
| `getPreviewUrl` | `trackId: string, quality?: QobuzQuality` | `Promise<PreviewResponse>`      | Get 30-second preview URL (no auth required) |
| `getStreamUrl`  | `trackId: string, quality?: QobuzQuality` | `Promise<StreamResult>`         | Get stream URL with fallback chain           |

**Usage Examples:**

```typescript
import { QobuzProvider } from '@/providers/qobuz';

// Get track by ID
const track = await QobuzProvider.songs.getById('12345678');
console.log(track.title, track.performer.name);

// Get track by URL
const track = await QobuzProvider.songs.getByLink('https://play.qobuz.com/track/12345678');

// Get stream URL (automatic fallback)
const stream = await QobuzProvider.songs.getStreamUrl('12345678', '27'); // Hi-Res
console.log(stream.url, stream.source); // source: 'qobuz_native' | 'primary' | 'fallback_1' etc.

// Get native file URL
const fileUrl = await QobuzProvider.songs.getFileUrl('12345678', '6'); // CD Quality
console.log(fileUrl.url, fileUrl.sampling_rate, fileUrl.bits_depth);

// Get preview (no auth required)
const preview = await QobuzProvider.songs.getPreviewUrl('12345678');
console.log(preview.url, preview.duration, preview.isPreview);
```

---

### Albums Module

**File**: `qobuz.albums.ts`

| Function             | Parameters              | Returns                                  | Description            |
| -------------------- | ----------------------- | ---------------------------------------- | ---------------------- |
| `getById`            | `album_id: string`      | `Promise<QobuzAlbum>`                    | Get album by ID        |
| `getByLink`          | `link: string`          | `Promise<QobuzAlbum>`                    | Get album by Qobuz URL |
| `getTracks`          | `{ id, limit, offset }` | `Promise<PaginatedResponse<QobuzTrack>>` | Get album tracks       |
| `getSuggestedAlbums` | `{ id, limit, offset }` | `Promise<PaginatedResponse<QobuzAlbum>>` | Get similar albums     |

**Usage Examples:**

```typescript
// Get album details
const album = await QobuzProvider.albums.getById('abc123xyz');
console.log(album.title, album.artist.name, album.tracks_count);

// Get album tracks with pagination
const tracks = await QobuzProvider.albums.getTracks({
    id: 'abc123xyz',
    limit: 50,
    offset: 0,
});
console.log(tracks.items, tracks.total, tracks.hasNext);

// Get suggested similar albums
const suggestions = await QobuzProvider.albums.getSuggestedAlbums({
    id: 'abc123xyz',
    limit: 10,
    offset: 0,
});
```

---

### Artists Module

**File**: `qobuz.artists.ts`

| Function       | Parameters                            | Returns                                        | Description                  |
| -------------- | ------------------------------------- | ---------------------------------------------- | ---------------------------- |
| `getById`      | `id: string`                          | `Promise<QobuzArtist>`                         | Get basic artist info        |
| `getByLink`    | `link: string`                        | `Promise<QobuzArtist>`                         | Get artist by URL            |
| `getPage`      | `id: string`                          | `Promise<QobuzArtistPage>`                     | Get full artist page         |
| `getTopTracks` | `{ id, limit, offset }`               | `Promise<PaginatedResponse<QobuzTopTrack>>`    | Get artist's top tracks      |
| `getAlbums`    | `{ id, limit, offset, releaseType? }` | `Promise<PaginatedResponse<QobuzReleaseItem>>` | Get artist's albums/releases |

**Usage Examples:**

```typescript
// Get artist info
const artist = await QobuzProvider.artists.getById('123456');
console.log(artist.name, artist.albums_count);

// Get full artist page (includes top tracks, releases, biography)
const artistPage = await QobuzProvider.artists.getPage('123456');
console.log(artistPage.top_tracks, artistPage.releases, artistPage.biography);

// Get top tracks
const topTracks = await QobuzProvider.artists.getTopTracks({
    id: '123456',
    limit: 10,
    offset: 0,
});

// Get albums by release type
const albums = await QobuzProvider.artists.getAlbums({
    id: '123456',
    limit: 20,
    offset: 0,
    releaseType: 'album', // 'album' | 'single' | 'ep' | 'live' | 'compilation'
});
```

---

### Playlists Module

**File**: `qobuz.playlists.ts`

| Function    | Parameters              | Returns                                  | Description         |
| ----------- | ----------------------- | ---------------------------------------- | ------------------- |
| `getById`   | `id: string`            | `Promise<QobuzPlaylist>`                 | Get playlist by ID  |
| `getByLink` | `link: string`          | `Promise<QobuzPlaylist>`                 | Get playlist by URL |
| `getTracks` | `{ id, limit, offset }` | `Promise<PaginatedResponse<QobuzTrack>>` | Get playlist tracks |

**Usage Examples:**

```typescript
// Get playlist
const playlist = await QobuzProvider.playlists.getById('1234567');
console.log(playlist.name, playlist.owner.name, playlist.tracks_count);

// Get playlist tracks
const tracks = await QobuzProvider.playlists.getTracks({
    id: '1234567',
    limit: 100,
    offset: 0,
});
```

---

### Labels Module

**File**: `qobuz.labels.ts`

| Function       | Parameters                                       | Returns                             | Description                |
| -------------- | ------------------------------------------------ | ----------------------------------- | -------------------------- |
| `getById`      | `labelId: string`                                | `Promise<QobuzLabelFull>`           | Get label info             |
| `getByLink`    | `link: string`                                   | `Promise<QobuzLabelFull>`           | Get label by URL           |
| `getAlbums`    | `labelId: string, { limit?, offset?, sort? }`    | `Promise<QobuzLabelAlbumsResponse>` | Get albums by label        |
| `getAllAlbums` | `labelId: string, maxAlbums?: number`            | `Promise<QobuzAlbum[]>`             | Get all albums (paginated) |
| `search`       | `query: string, limit?: number, offset?: number` | `Promise<QobuzLabelSearchResponse>` | Search labels              |

**Sort Options**: `'release_date'` | `'relevance'` | `'title'`

**Usage Examples:**

```typescript
// Get label info
const label = await QobuzProvider.labels.getById('12345');
console.log(label.name, label.albums_count);

// Get label albums sorted by release date
const albums = await QobuzProvider.labels.getAlbums('12345', {
    limit: 50,
    offset: 0,
    sort: 'release_date',
});

// Get all albums (handles pagination automatically)
const allAlbums = await QobuzProvider.labels.getAllAlbums('12345', 500);

// Search labels
const results = await QobuzProvider.labels.search('Warner');
```

---

### Search Module

**File**: `qobuz.search.ts`

| Function    | Parameters                 | Returns                                        | Description      |
| ----------- | -------------------------- | ---------------------------------------------- | ---------------- |
| `all`       | `{ query, limit, offset }` | `Promise<QobuzCatalogSearchResponse>`          | Search all types |
| `songs`     | `{ query, limit, offset }` | `Promise<PaginatedResponse<QobuzSearchTrack>>` | Search tracks    |
| `albums`    | `{ query, limit, offset }` | `Promise<PaginatedResponse<QobuzAlbum>>`       | Search albums    |
| `artists`   | `{ query, limit, offset }` | `Promise<PaginatedResponse<QobuzArtist>>`      | Search artists   |
| `playlists` | `{ query, limit, offset }` | `Promise<PaginatedResponse<QobuzPlaylist>>`    | Search playlists |

**Usage Examples:**

```typescript
// Combined catalog search
const results = await QobuzProvider.search.all({
    query: 'Pink Floyd',
    limit: 10,
    offset: 0,
});
console.log(results.tracks, results.albums, results.artists);

// Search specific types
const tracks = await QobuzProvider.search.songs({
    query: 'Comfortably Numb',
    limit: 25,
    offset: 0,
});

const albums = await QobuzProvider.search.albums({
    query: 'The Wall',
    limit: 10,
    offset: 0,
});

const artists = await QobuzProvider.search.artists({
    query: 'Pink Floyd',
    limit: 5,
    offset: 0,
});
```

---

### Featured Module

**File**: `qobuz.featured.ts`

| Function               | Parameters                           | Returns                                   | Description                  |
| ---------------------- | ------------------------------------ | ----------------------------------------- | ---------------------------- |
| `getFeaturedAlbums`    | `type: QobuzAlbumListType, options?` | `Promise<QobuzFeaturedAlbumsResponse>`    | Get featured albums by type  |
| `getNewReleases`       | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | New releases                 |
| `getBestSellers`       | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | Best selling albums          |
| `getPressAwards`       | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | Press award winners          |
| `getEditorPicks`       | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | Editor's picks               |
| `getMostStreamed`      | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | Most streamed albums         |
| `getIdealDiscography`  | `options?: FeaturedOptions`          | `Promise<QobuzFeaturedAlbumsResponse>`    | Qobuz ideal discography      |
| `getFeaturedPlaylists` | `options?: FeaturedPlaylistOptions`  | `Promise<QobuzFeaturedPlaylistsResponse>` | Featured playlists           |
| `getGenres`            | `options?: FeaturedOptions`          | `Promise<QobuzGenreListResponse>`         | List all genres              |
| `getGenreById`         | `genreId: number`                    | `Promise<QobuzGenreInfo>`                 | Get genre details            |
| `getAlbumsByGenre`     | `genreId: number, type?, options?`   | `Promise<QobuzFeaturedAlbumsResponse>`    | Get albums filtered by genre |
| `getDiscoveryContent`  | none                                 | `Promise<DiscoveryContent>`               | Combined homepage content    |

**Album List Types**: `'new-releases'` | `'new-releases-full'` | `'press-awards'` | `'best-sellers'` | `'editor-picks'` | `'most-streamed'` | `'most-featured'` | `'ideal-discography'` | `'recent-releases'`

**Usage Examples:**

```typescript
// New releases
const newReleases = await QobuzProvider.featured.getNewReleases({ limit: 20 });

// Best sellers
const bestSellers = await QobuzProvider.featured.getBestSellers({ limit: 20 });

// Editor's picks
const editorPicks = await QobuzProvider.featured.getEditorPicks();

// Most streamed
const mostStreamed = await QobuzProvider.featured.getMostStreamed();

// Ideal discography
const idealDisc = await QobuzProvider.featured.getIdealDiscography();

// Featured playlists with tags
const playlists = await QobuzProvider.featured.getFeaturedPlaylists({
    limit: 20,
    tags: ['jazz', 'chill'],
});

// Albums by genre
const jazzReleases = await QobuzProvider.featured.getAlbumsByGenre(10, 'new-releases', { limit: 50 });

// Get all genres
const genres = await QobuzProvider.featured.getGenres();

// Discovery content (combined)
const discovery = await QobuzProvider.featured.getDiscoveryContent();
console.log(discovery.newReleases, discovery.bestSellers, discovery.editorPicks);
```

---

### Auth Module

**File**: `qobuz.auth.ts`

| Function                   | Parameters                                             | Returns                                | Description                            |
| -------------------------- | ------------------------------------------------------ | -------------------------------------- | -------------------------------------- |
| `login`                    | `credentials: QobuzUserCredentials`                    | `Promise<QobuzLoginResponse>`          | Login with email/password              |
| `logout`                   | none                                                   | `void`                                 | Clear session                          |
| `initFromEnv`              | none                                                   | `Promise<boolean>`                     | Initialize from env variables          |
| `isAuthenticated`          | none                                                   | `boolean`                              | Check auth status                      |
| `getUserSession`           | none                                                   | `UserSession`                          | Get current session info               |
| `getUserAuthToken`         | none                                                   | `string \| null`                       | Get auth token                         |
| `getAuthHeaders`           | none                                                   | `Record<string, string>`               | Get headers for authenticated requests |
| `getCurrentUser`           | none                                                   | `Promise<QobuzUser>`                   | Get current user info                  |
| `generateRequestSignature` | `trackId: string, formatId: string, timestamp: number` | `Promise<string>`                      | Generate MD5 signature for stream URL  |
| `extractAppCredentials`    | none                                                   | `Promise<QobuzAppCredentials \| null>` | Extract from bundle.js                 |
| `getAppCredentials`        | none                                                   | `Promise<QobuzAppCredentials \| null>` | Get cached or extract credentials      |

**Usage Examples:**

```typescript
// Login with email/password
const loginResponse = await QobuzProvider.auth.login({
    email: 'user@example.com',
    password: 'yourpassword',
});
console.log('Logged in as:', loginResponse.user.display_name);

// Check authentication
if (QobuzProvider.auth.isAuthenticated()) {
    const session = QobuzProvider.auth.getUserSession();
    console.log(session.displayName, session.subscription);
}

// Initialize from environment variables
const success = await QobuzProvider.auth.initFromEnv();

// Get current user
const user = await QobuzProvider.auth.getCurrentUser();

// Logout
QobuzProvider.auth.logout();

// Extract app credentials
const credentials = await QobuzProvider.auth.extractAppCredentials();
if (credentials) {
    console.log('App ID:', credentials.appId);
    console.log('App Secret:', credentials.appSecret);
}
```

---

## API Endpoints

### Routes Configuration

**File**: `qobuz.routes.ts`

```typescript
const QOBUZ_ROUTES = {
    BASE: 'https://www.qobuz.com/api.json/0.2',

    <!-- ----------------------------------------------------------------------- -->
    <!--                                 TRACKS                                  -->
    <!-- ----------------------------------------------------------------------- -->
    TRACK: {
        GET: '/track/get', // ?track_id={id}
        SEARCH: '/track/search', // ?query={q}&limit={n}&offset={o}
        FILE_URL: '/track/getFileUrl', // ?track_id={id}&format_id={quality}&intent=stream&request_ts={ts}&request_sig={sig}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                 ALBUMS                                  -->
    <!-- ----------------------------------------------------------------------- -->
    ALBUM: {
        GET: '/album/get', // ?album_id={id}
        SEARCH: '/album/search', // ?query={q}&limit={n}&offset={o}
        SUGGEST: '/album/suggest', // ?album_id={id}
        FEATURED: '/album/getFeatured', // ?type={type}&limit={n}&offset={o}&genre_id={genre}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                 ARTISTS                                 -->
    <!-- ----------------------------------------------------------------------- -->
    ARTIST: {
        GET: '/artist/get', // ?artist_id={id}
        SEARCH: '/artist/search', // ?query={q}&limit={n}&offset={o}
        PAGE: '/artist/page', // ?artist_id={id} (full artist page with top tracks, releases)
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                PLAYLISTS                                -->
    <!-- ----------------------------------------------------------------------- -->
    PLAYLIST: {
        GET: '/playlist/get', // ?playlist_id={id}
        SEARCH: '/playlist/search', // ?query={q}&limit={n}&offset={o}
        FEATURED: '/playlist/getFeatured', // ?limit={n}&offset={o}&tags={tags}
        USER_PLAYLISTS: '/playlist/getUserPlaylists', // ?user_id={id}
        CREATE: '/playlist/create', // ?name={n}&description={d}&is_public={bool}
        DELETE: '/playlist/delete', // ?playlist_id={id}
        UPDATE: '/playlist/update', // ?playlist_id={id}&name={n}&...
        ADD_TRACKS: '/playlist/addTracks', // ?playlist_id={id}&track_ids={ids}
        REMOVE_TRACKS: '/playlist/deleteTracks', // ?playlist_id={id}&playlist_track_ids={ids}
        SUBSCRIBE: '/playlist/subscribe', // ?playlist_id={id}
        UNSUBSCRIBE: '/playlist/unsubscribe', // ?playlist_id={id}
    },

   <!-- ----------------------------------------------------------------------- -->
   <!--                                 LABELS                                  -->
   <!-- ----------------------------------------------------------------------- -->
    LABEL: {
        GET: '/label/get', // ?label_id={id}
        SEARCH: '/label/search', // ?query={q}&limit={n}&offset={o}
        ALBUMS: '/label/list', // ?label_id={id}&limit={n}&offset={o}&sort={sort}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                 SEARCH                                  -->
    <!-- ----------------------------------------------------------------------- -->
    SEARCH: {
        CATALOG: '/catalog/search', // ?query={q}&limit={n}&offset={o} (combined search)
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                               USER & AUTH                               -->
    <!-- ----------------------------------------------------------------------- -->
    USER: {
        LOGIN: '/user/login', // ?email={e}&password={md5_hash}
        GET: '/user/get', // ?user_id={id} (+ X-User-Auth-Token header)
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                FAVORITES                                -->
    <!-- ----------------------------------------------------------------------- -->
    FAVORITE: {
        GET_TRACKS: '/favorite/getUserFavorites', // ?user_id={id}&limit={n}&offset={o}
        GET_ALBUMS: '/favorite/getUserFavorites',
        GET_ARTISTS: '/favorite/getUserFavorites',
        GET_ALL: '/favorite/getUserFavorites',
        ADD: '/favorite/create', // ?track_ids={ids} OR ?album_ids={ids} OR ?artist_ids={ids}
        REMOVE: '/favorite/delete', // ?track_ids={ids} OR ?album_ids={ids} OR ?artist_ids={ids}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                PURCHASES                                -->
    <!-- ----------------------------------------------------------------------- -->
    PURCHASE: {
        GET_ALL: '/purchase/getUserPurchases', // ?user_id={id}&limit={n}&offset={o}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                                 GENRES                                  -->
    <!-- ----------------------------------------------------------------------- -->
    GENRE: {
        LIST: '/genre/list', // ?limit={n}&offset={o}
        GET: '/genre/get', // ?genre_id={id}
    },

    <!-- ----------------------------------------------------------------------- -->
    <!--                              QUALITY CODES                              -->
    <!-- ----------------------------------------------------------------------- -->
    QUALITY: {
        MP3_320: '5', // MP3 320kbps
        FLAC_16: '6', // FLAC 16-bit/44.1kHz (CD Quality)
        FLAC_24_96: '7', // FLAC 24-bit up to 96kHz
        FLAC_24_192: '27', // FLAC 24-bit up to 192kHz (Hi-Res)
    },
} as const;
```

---

## Types Reference

### Core Types

```typescript
// Quality type
type QobuzQuality = '5' | '6' | '7' | '27';

// Paginated list
type QobuzPaginatedList<T> = {
    items: T[];
    offset: number;
    limit: number;
    total: number;
};

// Image sizes
type QobuzImage = {
    small: string; // ~50px
    thumbnail: string; // ~100px
    large: string; // ~300-600px
};

type QobuzArtistImage = {
    small: string;
    medium: string;
    large: string;
    extralarge: string;
    mega: string;
};
```

### Authentication Types

```typescript
type QobuzUserCredentials = {
    email: string;
    password: string;
};

type QobuzAppCredentials = {
    appId: string;
    appSecret: string;
};

type QobuzLoginResponse = {
    user_auth_token: string;
    user: QobuzUser;
};

type QobuzUser = {
    id: number;
    publicId: string;
    email: string;
    display_name: string;
    country_code: string;
    credential?: QobuzUserCredential;
    subscription?: {
        offer: string;
        end_date: string;
        is_canceled: boolean;
    };
};
```

### Track Response Types

```typescript
type QobuzTrack = {
    id: number;
    title: string;
    version?: string;
    duration: number;
    track_number: number;
    media_number: number;
    isrc: string;
    maximum_bit_depth: number;
    maximum_sampling_rate: number;
    hires: boolean;
    hires_streamable: boolean;
    performer: QobuzPerformer;
    composer: QobuzPerformer;
    album: QobuzTrackAlbum;
    audio_info: QobuzAudioInfo;
    // Rights
    streamable: boolean;
    purchasable: boolean;
    downloadable: boolean;
    previewable: boolean;
};

type QobuzFileUrlResponse = {
    file_type: string; // 'preview' | 'full'
    track_id: number;
    format_id: number;
    duration: number; // 30 for preview, full duration otherwise
    url: string;
    mime_type: string; // 'audio/flac' | 'audio/mpeg'
    sampling_rate: number; // 44.1, 96, 192, etc.
    bits_depth: number; // 16 or 24
    n_channels: number; // Usually 2
    restrictions?: QobuzRestriction[];
};
```

---

## Quality Codes

| Code | Format | Bit Depth | Sample Rate   | Description      |
| ---- | ------ | --------- | ------------- | ---------------- |
| `5`  | MP3    | -         | 320 kbps      | Lossy compressed |
| `6`  | FLAC   | 16-bit    | 44.1 kHz      | CD Quality       |
| `7`  | FLAC   | 24-bit    | up to 96 kHz  | High Resolution  |
| `27` | FLAC   | 24-bit    | up to 192 kHz | Hi-Res (Max)     |

**Usage:**

```typescript
import QOBUZ_ROUTES from './qobuz.routes';

// Use constants
const quality = QOBUZ_ROUTES.QUALITY.FLAC_24_192; // '27'

// Or directly
await QobuzProvider.songs.getStreamUrl('12345', '27');
```

---

## URL Patterns

Qobuz uses two URL formats:

### Main Website (www.qobuz.com)

| Type     | Pattern                                                  |
| -------- | -------------------------------------------------------- |
| Track    | `https://www.qobuz.com/{locale}/track/{id}`              |
| Album    | `https://www.qobuz.com/{locale}/album/{slug}/{album_id}` |
| Artist   | `https://www.qobuz.com/{locale}/interpreter/{name}/{id}` |
| Playlist | `https://www.qobuz.com/{locale}/playlist/{id}`           |
| Label    | `https://www.qobuz.com/{locale}/label/{name}/{id}`       |

### Play Website (play.qobuz.com)

| Type     | Pattern                                   |
| -------- | ----------------------------------------- |
| Track    | `https://play.qobuz.com/track/{id}`       |
| Album    | `https://play.qobuz.com/album/{album_id}` |
| Artist   | `https://play.qobuz.com/artist/{id}`      |
| Playlist | `https://play.qobuz.com/playlist/{id}`    |

**Locale Codes**: `us-en`, `gb-en`, `fr-fr`, `de-de`, `es-es`, `it-it`, `nl-nl`, etc.

---

## App Credential Extraction

**File**: `qobuz.extractor.ts`

The provider can automatically extract app credentials from Qobuz's bundle.js when not provided via environment variables.

### Extraction Process

1. **Fetch login page**: `https://play.qobuz.com/login`
2. **Extract bundle URL** using regex:
    ```typescript
    const BUNDLE_URL_REGEX = /<script src="(\/resources\/\d+\.\d+\.\d+-[a-z]\d{3}\/bundle\.js)"><\/script>/;
    ```
3. **Fetch bundle.js** from extracted URL
4. **Extract app ID**:
    ```typescript
    const APP_ID_REGEX = /production:\{api:\{appId:"(?<appId>\d{9})",appSecret:"(\w{32})/;
    ```
5. **Extract seed/timezone pairs**:
    ```typescript
    const SEED_TIMEZONE_REGEX = /[a-z]\.initialSeed\("(?<seed>[\w=]+)",window\.utimezone\.(?<timezone>[a-z]+)\)/g;
    ```
6. **Decode and validate** each potential secret against the API
7. **Cache valid credentials** for future use

### Code Example

```typescript
import { extractAppCredentials, getAppCredentials, clearCredentialsCache } from './qobuz.extractor';

// Extract fresh credentials
const credentials = await extractAppCredentials();
// Returns: { appId: '798273057', appSecret: '...' } or null

// Get cached or extract new
const creds = await getAppCredentials();

// Force refresh (useful for testing)
clearCredentialsCache();
const freshCreds = await extractAppCredentials();
```

---

## Stream URL Generation

### Signature Generation

Stream URLs require an MD5 signature:

```typescript
// Signature format
const rawSignature = `trackgetFileUrlformat_id${formatId}intentstreamtrack_id${trackId}${timestamp}${secret}`;
const signature = crypto.createHash('md5').update(rawSignature).digest('hex');
```

### Stream URL Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   getStreamUrl(trackId, quality)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Get Credentials │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ Has appSecret?                │
              └─────────┬───────────┬─────────┘
                    Yes │           │ No
                        ▼           │
          ┌─────────────────────┐   │
          │ Try Native API      │   │
          │ /track/getFileUrl   │   │
          └─────────────────────┘   │
                    │               │
          ┌─────────┴─────────┐     │
          │ Success?          │     │
          └─────────┬───┬─────┘     │
               Yes  │   │ No        │
                    │   └───────────┼─────────┐
                    ▼               │         │
            ┌─────────────┐         │         │
            │ Return URL  │         │         │
            │ (native)    │         │         │
            └─────────────┘         │         │
                                    ▼         │
                          ┌─────────────────┐ │
                          │ Try Fallback 1  │ │
                          │ dab.yeet.su     │◄┘
                          └─────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │ Success?          │
                          └───────┬─────┬─────┘
                              Yes │     │ No
                                  │     ▼
                                  │ ┌─────────────────┐
                                  │ │ Try Fallback 2  │
                                  │ │ dabmusic.xyz    │
                                  │ └─────────────────┘
                                  │         │
                                  │         ▼
                                  │ ┌─────────────────┐
                                  │ │ Try Fallback 3  │
                                  │ │ qobuz.squid.wtf │
                                  │ └─────────────────┘
                                  │         │
                                  ▼         ▼
                          ┌─────────────┐ ┌─────────────┐
                          │ Return URL  │ │ Throw Error │
                          │ (fallback)  │ │ (all failed)│
                          └─────────────┘ └─────────────┘
```

## Feature Comparison

| Feature                  | SpotiFLAC/spotimeow | streamrip/Qo-DL | **Sargam**              |
| ------------------------ | ------------------- | --------------- | ----------------------- |
| Track by ID              | ❌                  | ✅              | ✅                      |
| Track by ISRC            | ✅ (via search)     | ✅              | ✅                      |
| Track search             | ✅                  | ✅              | ✅                      |
| Album by ID              | ❌                  | ✅              | ✅                      |
| Album tracks             | ❌                  | ✅              | ✅                      |
| Album search             | ❌                  | ✅              | ✅                      |
| Album suggestions        | ❌                  | ❌              | ✅                      |
| Artist by ID             | ❌                  | ✅              | ✅                      |
| Artist page (full)       | ❌                  | ❌              | ✅                      |
| Artist albums            | ❌                  | ✅              | ✅                      |
| Artist top tracks        | ❌                  | ❌              | ✅                      |
| Artist search            | ❌                  | ✅              | ✅                      |
| Playlist by ID           | ❌                  | ✅              | ✅                      |
| Playlist tracks          | ❌                  | ✅              | ✅                      |
| Playlist search          | ❌                  | ✅              | ✅                      |
| Catalog search (all)     | ❌                  | ✅              | ✅                      |
| **Labels**               | ❌                  | ❌              | ✅                      |
| Label albums             | ❌                  | ❌              | ✅                      |
| Label search             | ❌                  | ❌              | ✅                      |
| Stream URLs              | ✅ (external)       | ✅ (native)     | ✅ (native + fallbacks) |
| Preview URLs             | ❌                  | ❌              | ✅ (30-second samples)  |
| Quality selection        | ✅                  | ✅              | ✅                      |
| **User Auth**            | ❌                  | ✅              | ✅ (for full streams)   |
| **Featured Content**     | ❌                  | ❌              | ✅                      |
| **Genres**               | ❌                  | ❌              | ✅                      |
| **Discovery Content**    | ❌                  | ❌              | ✅                      |
| **App Credential Spoof** | ❌                  | ✅              | ✅                      |
| Auto-credential Extract  | ❌                  | ✅              | ✅                      |

---

## Notes & Considerations

### Public API Access

- Qobuz's metadata API is publicly accessible with just an `app_id`
- No OAuth or user credentials needed for searching/browsing
- Rate limiting is minimal but should be respected

### Hi-Res Audio

- Qobuz specializes in high-resolution audio
- Track responses include `hires`, `maximum_bit_depth`, and `maximum_sampling_rate` fields
- Hi-res streaming requires appropriate subscription level

### ID Formats

- **Track IDs**: Numeric (e.g., `12345678`)
- **Album IDs**: Alphanumeric strings (e.g., `0886445327045`)
- **Artist IDs**: Numeric (e.g., `123456`)
- **Playlist IDs**: Numeric (e.g., `1234567`)

### Nested Data

- Album endpoints include nested tracks
- Artist page endpoint includes top tracks, releases, and biography
- This reduces the need for multiple API calls

### Stream URL Restrictions

Without valid app secret and user authentication, the API returns 30-second previews with restrictions:

| Restriction Code                       | Description                    |
| -------------------------------------- | ------------------------------ |
| `UserUncredentialed`                   | Not logged in                  |
| `FormatRestrictedByFormatAvailability` | Quality not available          |
| `TrackRestrictedByPurchaseCredentials` | Requires purchase/subscription |

### Password Hashing

User passwords are MD5 hashed before sending to the API:

```typescript
const passwordHash = crypto.createHash('md5').update(password).digest('hex');
```

### Error Handling

All module functions use `assertData()` for consistent error handling:

```typescript
const data = assertData(res.data, 'Error message', optionalValidator);
```

---

## Quick Reference

### Import

```typescript
import { QobuzProvider } from '@/providers/qobuz';
```

### Module Access

```typescript
QobuzProvider.songs; // Track operations
QobuzProvider.albums; // Album operations
QobuzProvider.artists; // Artist operations
QobuzProvider.playlists; // Playlist operations
QobuzProvider.labels; // Label operations
QobuzProvider.search; // Search operations
QobuzProvider.featured; // Featured/editorial content
QobuzProvider.auth; // Authentication (for full stream access)
```

### Quality Constants

```typescript
import QOBUZ_ROUTES from '@/providers/qobuz/qobuz.routes';

QOBUZ_ROUTES.QUALITY.MP3_320; // '5'
QOBUZ_ROUTES.QUALITY.FLAC_16; // '6'
QOBUZ_ROUTES.QUALITY.FLAC_24_96; // '7'
QOBUZ_ROUTES.QUALITY.FLAC_24_192; // '27'
```
