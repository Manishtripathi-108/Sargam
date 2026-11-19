import type { Paginated } from '../types/core/pagination.model';

/**
 * Normalizes pagination parameters to safe values.
 * Ensures limit is between 1 and 100, and offset is non-negative.
 * @param limit - The requested limit of items per page.
 * @param offset - The requested offset.
 * @returns Normalized pagination parameters with page, limit, and offset.
 * @example
 * normalizePagination(10, 0) => { page: 1, limit: 10, offset: 0 }
 * normalizePagination(200, -5) => { page: 1, limit: 100, offset: 0 }
 */
export const normalizePagination = (limit = 10, offset = 0) => {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeOffset = Math.max(0, offset);
    const page = Math.floor(safeOffset / safeLimit) + 1;
    return { page, limit: safeLimit, offset: safeOffset };
};

/**
 * Creates a Paginated response object from the given parameters.
 * @template T - The type of the items in the paginated response.
 * @param params - An object containing the items, total, offset, limit, and optional hasNext flag.
 * @param params.items - The items to be paginated.
 * @param params.total - The total number of items available.
 * @param params.offset - The offset of the current page.
 * @param params.limit - The limit of items per page. Defaults to the length of the items array.
 * @param params.hasNext - Optional flag indicating whether there are more items. Calculated if not provided.
 * @returns A Paginated object containing the items, total, offset, limit, and hasNext flag.
 * @example
 * createPaginatedResponse({
 *   items: [1, 2, 3],
 *   total: 10,
 *   offset: 0,
 *   limit: 3
 * }) => { total: 10, offset: 0, limit: 3, hasNext: true, items: [1, 2, 3] }
 */
export const createPaginatedResponse = <T>({
    items,
    total,
    offset,
    limit,
    hasNext,
}: {
    items: T[];
    total: number;
    offset: number;
    limit?: number;
    hasNext?: boolean;
}): Paginated<T> => {
    const size = items.length;
    const safeLimit = limit && limit > 0 ? limit : size;

    return {
        total,
        offset,
        limit: safeLimit,
        hasNext: hasNext ?? offset + size < total,
        items,
    };
};
