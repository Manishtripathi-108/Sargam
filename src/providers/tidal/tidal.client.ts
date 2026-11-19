import { getBrowserHeaders } from '../../constants/user-agents.constants';
import { AppError } from '../../utils/error.utils';
import { getAccessToken, resetToken } from './tidal.auth';
import TIDAL_ROUTES from './tidal.routes';
import axios, { type AxiosError } from 'axios';

type TidalErrorResponse = {
    status?: number;
    subStatus?: number;
    userMessage?: string;
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
    (error: AxiosError<TidalErrorResponse>) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                resetToken();
                throw new AppError('[Tidal] Authentication failed', 401);
            }

            switch (status) {
                case 403:
                    throw new AppError('[Tidal] Access forbidden', 403);
                case 404:
                    throw new AppError(data?.userMessage || '[Tidal] Resource not found', 404);
                case 429:
                    throw new AppError('[Tidal] Rate limit exceeded', 429);
                default:
                    throw new AppError(data?.userMessage || `[Tidal] API error: ${status}`, status);
            }
        }

        if (error.code === 'ECONNABORTED') {
            throw new AppError('[Tidal] Request timeout', 408);
        }

        throw new AppError(`[Tidal] Connection error: ${error.message}`, 500);
    }
);
