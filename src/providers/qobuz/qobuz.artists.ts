import type { QobuzArtist, QobuzArtistPage, QobuzReleaseItem, QobuzTopTrack } from '../../types/qobuz';
import { assertData } from '../../utils/error.utils';
import { createPaginatedResponse, normalizePagination } from '../../utils/pagination.utils';
import { extractId } from '../../utils/url.utils';
import { qobuzClient } from './qobuz.client';
import QOBUZ_ROUTES from './qobuz.routes';

export async function getById(id: string) {
    const res = await qobuzClient.get<QobuzArtist>(QOBUZ_ROUTES.ARTIST.GET, {
        params: { artist_id: id },
    });

    return assertData(res.data, '[Qobuz] Artist not found');
}

export async function getByLink(link: string) {
    const id = extractId(link, 'qobuz', 'artist');

    return getById(id);
}

export async function getPage(id: string) {
    const res = await qobuzClient.get<QobuzArtistPage>(QOBUZ_ROUTES.ARTIST.PAGE, {
        params: { artist_id: id },
    });

    return assertData(res.data, '[Qobuz] Artist page not found');
}

export async function getTopTracks({
    id,
    limit,
    offset,
}: {
    id: string;
    limit: number;
    offset: number;
}): Promise<ReturnType<typeof createPaginatedResponse<QobuzTopTrack>>> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const artistPage = await getPage(id);

    const topTracks = artistPage.top_tracks ?? [];
    const total = topTracks.length;

    // Apply pagination to top tracks
    const paginatedTracks = topTracks.slice(safeOffset, safeOffset + safeLimit);

    return createPaginatedResponse({
        items: paginatedTracks,
        total,
        offset: safeOffset,
        limit: safeLimit,
    });
}

export const getSongs = getTopTracks;

export async function getAlbums({
    id,
    limit,
    offset,
    releaseType,
}: {
    id: string;
    limit: number;
    offset: number;
    releaseType?: string;
}): Promise<ReturnType<typeof createPaginatedResponse<QobuzReleaseItem>>> {
    const { limit: safeLimit, offset: safeOffset } = normalizePagination(limit, offset);

    const artistPage = await getPage(id);

    // Flatten all releases or filter by type
    let allReleases: QobuzReleaseItem[] = [];

    for (const release of artistPage.releases) {
        if (!releaseType || release.type === releaseType) {
            allReleases = allReleases.concat(release.items);
        }
    }

    const total = allReleases.length;

    // Apply pagination
    const paginatedReleases = allReleases.slice(safeOffset, safeOffset + safeLimit);

    return createPaginatedResponse({
        items: paginatedReleases,
        total,
        offset: safeOffset,
        limit: safeLimit,
    });
}
