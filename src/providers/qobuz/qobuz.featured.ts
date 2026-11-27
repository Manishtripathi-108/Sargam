import type {
    QobuzAlbumListType,
    QobuzFeaturedAlbumsResponse,
    QobuzFeaturedPlaylistsResponse,
    QobuzGenreInfo,
    QobuzGenreListResponse,
} from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

interface FeaturedOptions {
    limit?: number;
    offset?: number;
    genreId?: number;
}

export async function getFeaturedAlbums(
    type: QobuzAlbumListType = 'new-releases',
    options: FeaturedOptions = {}
): Promise<QobuzFeaturedAlbumsResponse> {
    const { limit = 50, offset = 0, genreId } = options;

    const params: Record<string, string | number> = { type, limit, offset };
    if (genreId) params.genre_id = genreId;

    const res = await qobuzClient.get<QobuzFeaturedAlbumsResponse>(QOBUZ_ROUTES.ALBUM.FEATURED, { params });
    return assertData(res.data, '[Qobuz] Failed to get featured albums');
}

export const getNewReleases = (options: FeaturedOptions = {}) => getFeaturedAlbums('new-releases', options);
export const getBestSellers = (options: FeaturedOptions = {}) => getFeaturedAlbums('best-sellers', options);
export const getPressAwards = (options: FeaturedOptions = {}) => getFeaturedAlbums('press-awards', options);
export const getEditorPicks = (options: FeaturedOptions = {}) => getFeaturedAlbums('editor-picks', options);
export const getMostStreamed = (options: FeaturedOptions = {}) => getFeaturedAlbums('most-streamed', options);
export const getIdealDiscography = (options: Omit<FeaturedOptions, 'genreId'> = {}) =>
    getFeaturedAlbums('ideal-discography', options);

export async function getFeaturedPlaylists(
    options: FeaturedOptions & { tags?: string[] } = {}
): Promise<QobuzFeaturedPlaylistsResponse> {
    const { limit = 50, offset = 0, genreId, tags } = options;

    const params: Record<string, string | number> = { limit, offset };
    if (genreId) params.genre_id = genreId;
    if (tags?.length) params.tags = tags.join(',');

    const res = await qobuzClient.get<QobuzFeaturedPlaylistsResponse>(QOBUZ_ROUTES.PLAYLIST.FEATURED, { params });
    return assertData(res.data, '[Qobuz] Failed to get featured playlists');
}

export async function getGenres(options: Omit<FeaturedOptions, 'genreId'> = {}): Promise<QobuzGenreListResponse> {
    const { limit = 100, offset = 0 } = options;

    const res = await qobuzClient.get<QobuzGenreListResponse>(QOBUZ_ROUTES.GENRE.LIST, {
        params: { limit, offset },
    });

    return assertData(res.data, '[Qobuz] Failed to get genres');
}

export async function getGenreById(genreId: number): Promise<QobuzGenreInfo> {
    const res = await qobuzClient.get<QobuzGenreInfo>(QOBUZ_ROUTES.GENRE.GET, {
        params: { genre_id: genreId },
    });

    return assertData(res.data, '[Qobuz] Genre not found');
}

export const getAlbumsByGenre = (
    genreId: number,
    type: QobuzAlbumListType = 'new-releases',
    options: Omit<FeaturedOptions, 'genreId'> = {}
) => getFeaturedAlbums(type, { ...options, genreId });

export async function getDiscoveryContent() {
    const [newReleases, bestSellers, editorPicks, featuredPlaylists, genres] = await Promise.all([
        getNewReleases({ limit: 10 }),
        getBestSellers({ limit: 10 }),
        getEditorPicks({ limit: 10 }),
        getFeaturedPlaylists({ limit: 10 }),
        getGenres({ limit: 20 }),
    ]);

    return {
        newReleases: newReleases.albums.items,
        bestSellers: bestSellers.albums.items,
        editorPicks: editorPicks.albums.items,
        featuredPlaylists: featuredPlaylists.playlists.items,
        genres: genres.genres.items,
    };
}
