import { getBrowserHeaders } from '../../constants/user-agents.constants';
import { getAppCredentials } from './qobuz.extractor';
import QOBUZ_ROUTES from './qobuz.routes';
import axios from 'axios';

export const qobuzClient = axios.create({
    baseURL: QOBUZ_ROUTES.BASE,
    headers: {
        Accept: 'application/json',
        origin: 'https://play.qobuz.com',
        referer: 'https://play.qobuz.com/',
    },
});

async function bootstrapClient(): Promise<void> {
    const credentials = await getAppCredentials();
    if (!credentials?.appId) return;

    const currentAppId = credentials.appId;

    qobuzClient.defaults.headers['x-app-id'] = currentAppId;
    qobuzClient.defaults.params = {
        ...qobuzClient.defaults.params,
        app_id: currentAppId,
    } as Record<string, string>;
}

void bootstrapClient();

qobuzClient.interceptors.request.use((config) => {
    const browserHeaders = getBrowserHeaders({ include: config.headers });

    for (const [key, value] of Object.entries(browserHeaders)) {
        if (value !== undefined) {
            config.headers.set(key, value);
        }
    }

    return config;
});
