import { db, type DbClient } from '../db';
import { isDev } from '../utils/environment.utils';
import 'dotenv/config';
import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        db: DbClient;
    }
}

type DbPluginOptions = FastifyPluginOptions & {
    connectTimeoutMs?: number;
    connectRetries?: number;
    connectRetryDelayMs?: number;
};

const DEFAULTS = {
    connectTimeoutMs: 10_000,
    connectRetries: 0,
    connectRetryDelayMs: 1000,
};

async function wait(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

const dbPlugin: FastifyPluginAsync<DbPluginOptions> = async (app, opts = {}) => {
    const cfg = { ...DEFAULTS, ...(opts as DbPluginOptions) };

    if (!process.env.DATABASE_URL) {
        app.log.error('DATABASE_URL is missing. Please set DATABASE_URL in .env');
        throw new Error('DATABASE_URL is missing');
    }

    // attach early so other plugins can reference app.db during bootstrap
    app.decorate('db', db);

    const connectWithRetries = async () => {
        let attempts = 0;
        while (true) {
            try {
                const timeout = new Promise((_, rej) =>
                    setTimeout(() => rej(new Error('prisma connect timeout')), cfg.connectTimeoutMs)
                );
                await Promise.race([db.connect(), timeout]);
                app.log.info('prisma connected');
                break;
            } catch (err: unknown) {
                attempts++;
                app.log.warn({ err, attempt: attempts }, 'prisma connection failed');

                if (attempts > cfg.connectRetries) {
                    app.log.error({ err }, 'prisma failed to connect after retries');
                    throw err;
                }

                await wait(cfg.connectRetryDelayMs);
            }
        }
    };

    await connectWithRetries();

    app.addHook('onClose', async () => {
        try {
            await db.close();
            app.log.info('prisma disconnected via onClose');
        } catch (err) {
            app.log.error({ err }, 'error disconnecting prisma on onClose');
        }
    });

    const handleSignal = async (signal: NodeJS.Signals) => {
        try {
            app.log.info({ signal }, 'shutdown signal received');
            await db.close();
            app.log.info('prisma disconnected via signal handler');
            process.exit(0);
        } catch (err) {
            app.log.error({ err }, 'error during shutdown disconnect');
            process.exit(1);
        }
    };

    if (!isDev) {
        process.once('SIGINT', () => void handleSignal('SIGINT'));
        process.once('SIGTERM', () => void handleSignal('SIGTERM'));
    }
};

export default fp(dbPlugin, {
    name: 'prisma-db-plugin',
});
