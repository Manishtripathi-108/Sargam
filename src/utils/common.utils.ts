import { IMAGE_FALLBACKS } from '../constants/common.constants';
import type { ImageAsset } from '../types/core/image.model';

/**
 * Safely converts a given value to a number.
 * Returns 0 if the value is null, undefined, or cannot be converted.
 * @param value - The value to convert to a number.
 * @returns The converted number, or 0 if the conversion fails.
 */
export const safeParseNumber = (value?: string | number | null): number => Number(value ?? 0);

/**
 * Decodes a given string from HTML entities.
 * @param value - The string to decode from HTML entities.
 * @returns The decoded string, or null if the input is null or undefined.
 */
export const decodeHtmlEntities = (value?: string | null): string | null =>
    value ? value.replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null;

/**
 * Returns an ImageAsset with all quality levels set to the fallback audio cover image.
 * Used when no image is provided for an audio entity.
 * @returns An ImageAsset with low, medium, and high fields set to the fallback image.
 */
export const createFallbackImageAsset = (): ImageAsset => ({
    low: IMAGE_FALLBACKS.AUDIO_COVER,
    medium: IMAGE_FALLBACKS.AUDIO_COVER,
    high: IMAGE_FALLBACKS.AUDIO_COVER,
});
