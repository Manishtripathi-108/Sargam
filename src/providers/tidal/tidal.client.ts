import axios, { type AxiosError } from 'axios';
import { getBrowserHeaders } from '../../constants/user-agents.constants';
import { AppError } from '../../utils/error.utils';
import { getAccessToken, resetToken } from './tidal.auth';
import TIDAL_ROUTES from './tidal.routes';

type TidalErrorResponse = {
    status?: number;
    subStatus?: number;
    userMessage?: string;
    error?: string;
    error_description?: string;
};

export const getCountryCode = () => process.env.TIDAL_COUNTRY_CODE || 'US';

export const isTidalConfigured = () => true;

export const resetTidalClient = () => {
    resetToken();
};

export const tidalClient = axios.create({
    baseURL: TIDAL_ROUTES.BASE,
    headers: {
        Accept: 'application/json',
        origin: 'https://tidal.com',
        referer: 'https://tidal.com/',
    },
});

tidalClient.interceptors.request.use(async (config) => {
    const token = await getAccessToken();

    if (!token) {
        throw new AppError('[Tidal] Failed to obtain access token', 500);
    }

    const browserHeaders = getBrowserHeaders({ include: config.headers });

    for (const [key, value] of Object.entries(browserHeaders)) {
        if (value !== undefined) {
            config.headers.set(key, value);
        }
    }

    config.headers.set('Authorization', `Bearer ${token}`);

    const currentParams = (config.params as Record<string, unknown> | undefined) ?? {};
    config.params = {
        countryCode: getCountryCode(),
        ...currentParams,
    };

    return config;
});

tidalClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (error instanceof AppError) {
            throw error;
        }

        const axiosErr = error as AxiosError<TidalErrorResponse>;
        if (axiosErr.response) {
            const { status, data } = axiosErr.response;

            if (
                status === 401 ||
                (status === 400 &&
                    (data?.error === 'invalid_grant' ||
                        data?.error_description?.toLowerCase().includes('client credentials')))
            ) {
                resetToken();
                const reason =
                    data?.error_description ||
                    data?.userMessage ||
                    'Invalid client credentials or expired token';
                throw new AppError(
                    `[Tidal] Authentication failed: ${reason}. Please verify TIDAL_CLIENT_ID and TIDAL_CLIENT_SECRET in your .env file`,
                    401
                );
            }

            const message = data?.userMessage || data?.error_description || data?.error;

            switch (status) {
                case 403:
                    throw new AppError(message || '[Tidal] Access forbidden', 403);
                case 404:
                    throw new AppError(message || '[Tidal] Resource not found', 404);
                case 429:
                    throw new AppError(message || '[Tidal] Rate limit exceeded', 429);
                default:
                    throw new AppError(message || `[Tidal] API error: ${status}`, status);
            }
        }

        if (axiosErr.code === 'ECONNABORTED') {
            throw new AppError('[Tidal] Request timeout', 408);
        }

        throw new AppError(`[Tidal] Connection error: ${axiosErr.message}`, 500);
    }
);
