import type { QobuzAlbum } from './album.response';
import type { QobuzLabel, QobuzPaginatedList } from './common.types';

export type QobuzLabelFull = QobuzLabel & {
    description?: string;
    image?: {
        small: string;
        medium: string;
        large: string;
    };
};

export type QobuzLabelAlbumsResponse = {
    albums: QobuzPaginatedList<QobuzAlbum>;
};

export type QobuzLabelSearchResponse = {
    query: string;
    labels: QobuzPaginatedList<QobuzLabel>;
};
