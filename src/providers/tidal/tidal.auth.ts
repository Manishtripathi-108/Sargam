import axios, { type AxiosError } from 'axios';
import { AppError } from '../../utils/error.utils';
import TIDAL_ROUTES from './tidal.routes';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// Default Tidal client credentials for public catalog access
const DEFAULT_CLIENT_ID = '7m7Ap0JC9j1cOM3n';
const DEFAULT_CLIENT_SECRET = 'vRAdA108tlvkJpTsGZS8rGZ7xTlbJ0qaZ2K9saEzsgY=';

const getConfig = () => {
    const clientId = process.env.TIDAL_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.TIDAL_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;

    return { clientId, clientSecret };
};

export function resetToken(): void {
    cachedToken = null;
}

export async function getAccessToken(): Promise<string> {
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
        return cachedToken.accessToken;
    }

    const { clientId, clientSecret } = getConfig();

    try {
        const response = await axios.post(TIDAL_ROUTES.AUTH, 'grant_type=client_credentials', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: clientId,
                password: clientSecret,
            },
        });

        const { access_token, expires_in } = response.data as {
            access_token: string;
            expires_in: number;
            token_type: string;
        };

        cachedToken = {
            accessToken: access_token,
            expiresAt: now + expires_in * 1000,
        };

        return access_token;
    } catch (err: unknown) {
        resetToken();
        const axiosErr = err as AxiosError<{
            error?: string;
            error_description?: string;
            userMessage?: string;
        }>;
        const details =
            axiosErr.response?.data?.error_description ||
            axiosErr.response?.data?.userMessage ||
            axiosErr.response?.data?.error ||
            axiosErr.message;

        throw new AppError(
            `[Tidal] Authentication failed: ${details}. Please verify TIDAL_CLIENT_ID and TIDAL_CLIENT_SECRET in your .env file`,
            401
        );
    }
}
