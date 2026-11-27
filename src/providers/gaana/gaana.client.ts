import { getBrowserHeaders } from '../../constants/user-agents.constants';
import GAANA_ROUTES from './gaana.routes';
import axios from 'axios';

export const gaanaClient = axios.create({
    baseURL: GAANA_ROUTES.BASE,
    headers: {
        Origin: 'https://gaana.com',
        Referer: 'https://gaana.com/',
        Connection: 'keep-alive',
        Host: 'gaana.com',
    },
    params: {
        country: 'IN',
    },
});

gaanaClient.interceptors.request.use((config) => {
    const browserHeaders = getBrowserHeaders({ include: config.headers });

    for (const [key, value] of Object.entries(browserHeaders)) {
        if (value !== undefined) {
            config.headers.set(key, value);
        }
    }

    return config;
});
