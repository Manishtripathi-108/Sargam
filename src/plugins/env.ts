import envPlugin from '@fastify/env';
import type { FastifyPluginAsync } from 'fastify';

// Define the expected environment variables schema
const envSchema = {
    type: 'object',
    required: ['JWT_SECRET', 'CLIENT_URLS', 'DATABASE_URL', 'QOBUZ_APP_ID'],
    properties: {
        // App
        PORT: { type: 'number', default: 3000 },
        CLIENT_URLS: { type: 'string' },
        APP_NAME: { type: 'string', default: 'sargam' },
        APP_URL: { type: 'string', default: 'http://localhost:3000' },
        JWT_SECRET: { type: 'string' },

        // Database
        DATABASE_URL: { type: 'string' },

        // Spotify
        SPOTIFY_API_URL: { type: 'string', default: 'https://api.spotify.com/v1' },
        SPOTIFY_CLIENT_ID: { type: 'string' },
        SPOTIFY_CLIENT_SECRET: { type: 'string' },
        SPOTIFY_REDIRECT_URI: { type: 'string' },

        // Qobuz (required)
        QOBUZ_APP_ID: { type: 'string' },
        // Qobuz (optional)
        QOBUZ_APP_SECRET: { type: 'string' },
        QOBUZ_EMAIL: { type: 'string' },
        QOBUZ_PASSWORD: { type: 'string' },
        QOBUZ_USER_AUTH_TOKEN: { type: 'string' },
        QOBUZ_USER_ID: { type: 'string' },
    },
};

// Environment plugin to load and validate environment variables
const env: FastifyPluginAsync = async (app) => {
    await app.register(envPlugin, {
        schema: envSchema,
        dotenv: true,
    });
};

//* Note: What it does is to ensure that the required environment variables are present
//* and conform to the specified schema when the application starts.

export default env;
