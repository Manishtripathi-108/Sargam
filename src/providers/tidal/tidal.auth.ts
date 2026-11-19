import TIDAL_ROUTES from './tidal.routes';
import axios from 'axios';

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getConfig = () => {
    const clientId = process.env.TIDAL_CLIENT_ID!;
    const clientSecret = process.env.TIDAL_CLIENT_SECRET!;

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
}
