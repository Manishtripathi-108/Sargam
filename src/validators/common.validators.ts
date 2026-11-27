import { z } from 'zod';

/**
 * Non-empty string validation
 */
export const nonEmptyString = (msg = 'Required') => z.string(msg).min(1);

/**
 * Positive integer with configurable constraints
 */
export const positiveInt = (min = 1, max?: number) => {
    let schema = z.coerce.number().int().min(min);
    if (max !== undefined) {
        schema = schema.max(max);
    }
    return schema;
};

/**
 * Provider enum - saavn or gaana
 */
export const providerEnum = z.enum(['saavn', 'gaana', 'qobuz', 'tidal']);

/**
 * Search type enum
 */
export const searchTypeEnum = z.enum(['song', 'album', 'artist', 'playlist', 'all']);

/**
 * Sort order enum
 */
export const sortOrderEnum = z.enum(['asc', 'desc']);

/**
 * Sort by enum for artist content
 */
export const sortByEnum = z.enum(['popularity', 'alphabetical', 'latest']);

/**
 * Generic ID param schema factory
 * @param entity - The entity name for error message (e.g., 'Album', 'Song', 'Artist')
 */
export const idParam = z.object({ id: nonEmptyString('ID required') });

/**
 * Provider query parameter with default
 */
export const providerQuery = z.object({
    provider: providerEnum.default('saavn'),
});

/**
 * Pagination query parameters
 */
export const paginationQuery = z.object({
    limit: positiveInt(1, 100).default(10),
    offset: positiveInt(0).default(0),
});

/**
 * Sorting query parameters
 */
export const sortingQuery = z.object({
    sortBy: sortByEnum.default('popularity'),
    sortOrder: sortOrderEnum.default('desc'),
});

/**
 * Search query base (includes pagination and provider)
 */
export const searchQuery = z.object({
    q: nonEmptyString('Query required'),
    limit: positiveInt(1, 100).default(10),
    offset: positiveInt(0).default(0),
    provider: providerEnum.default('saavn'),
});

/**
 * Creates a schema that requires either id or link
 */
export const idOrLinkQuery = z
    .object({
        id: z.string().optional(),
        link: z.string().optional(),
        ids: z.string().optional(),
    })
    .refine((v) => v.id || v.link || v.ids, {
        message: 'Either id, link, or ids is required',
        path: ['id'],
    });

/**
 * Optional pagination query parameters (when limit is omitted, services return all items)
 */
export const optionalPaginationQuery = z.object({
    limit: positiveInt(1, 100).optional(),
    offset: positiveInt(0).default(0),
});

/**
 * Combined list query (pagination + sorting + provider)
 */
export const listQuery = z.object({
    ...optionalPaginationQuery.shape,
    ...sortingQuery.shape,
    ...providerQuery.shape,
});

/**
 * Songs query for album, playlist, artist songs
 */
export const songsListQuery = z.object({
    ...optionalPaginationQuery.shape,
    ...sortingQuery.shape,
    ...providerQuery.shape,
});

/**
 * ID or link query with provider
 */
export const idOrLinkWithProvider = idOrLinkQuery.safeExtend(providerQuery.shape);

/**
 * Suggestions query (limit only)
 */
export const suggestionsQuery = z.object({
    limit: positiveInt(1, 100).default(10),
});

/**
 * Global search query (includes type filter)
 */
export const globalSearchQuery = searchQuery.extend({
    type: searchTypeEnum.default('all'),
});

/* ------------------------------ Type Exports ------------------------------ */
export type Provider = z.infer<typeof providerEnum>;
export type SearchType = z.infer<typeof searchTypeEnum>;
export type SortOrder = z.infer<typeof sortOrderEnum>;
export type SortBy = z.infer<typeof sortByEnum>;
export type Pagination = z.infer<typeof paginationQuery>;
export type IdOrLink = z.infer<typeof idOrLinkQuery>;
