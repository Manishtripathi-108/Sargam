import { getRandomUserAgent } from '../../constants/user-agents.constants';
import SAAVN_ROUTES from './saavn.routes';
import axios from 'axios';

export const saavnClient = axios.create({
    baseURL: SAAVN_ROUTES.BASE,
    headers: {
        'Content-Type': 'application/json',
        cookie: 'gdpr_acceptance=true; DL=english',
    },
});

saavnClient.interceptors.request.use((config) => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    config.params = {
        ...config.params,
        _format: 'json',
        _marker: '0',
        api_version: 4,
        cc: 'IN',
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        ctx: config.params?.ctx ?? 'web6dot0',
    };

    config.headers.setUserAgent(getRandomUserAgent());
    return config;
});
