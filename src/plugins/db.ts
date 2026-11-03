import { PrismaClient } from '../generated/prisma/client';
import { isDev } from '../utils/environment.utils';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import type { FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
    interface FastifyInstance {
        db: PrismaClient;
    }
}

type DbPluginOptions = FastifyPluginOptions & {
    prismaOptions?: ConstructorParameters<typeof PrismaClient>[0];
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

/**
 * Avoid multiple PrismaClient instances during hot reload in dev
 */
declare global {
    var __prismaClient__: PrismaClient | undefined;
}

const createPrisma = (opts?: DbPluginOptions) => {
    // prefer explicit options if provided
    if (opts?.prismaOptions) {
        return new PrismaClient(opts.prismaOptions);
    }

    const conn = process.env.DATABASE_URL ?? '';
    const adapter = new PrismaPg({ connectionString: conn });

    // pass adapter to generated client
    return new PrismaClient({ adapter });
};

const dbPlugin: FastifyPluginAsync<DbPluginOptions> = async (app, opts = {}) => {
    const cfg = { ...DEFAULTS, ...(opts as DbPluginOptions) };

    // sanity check
    if (!process.env.DATABASE_URL) {
        app.log.error('DATABASE_URL is missing. Run npx prisma generate and set DATABASE_URL in .env');
        throw new Error('DATABASE_URL is missing');
    }

    const prisma = isDev && global.__prismaClient__ ? global.__prismaClient__ : createPrisma(opts as DbPluginOptions);

    if (isDev && !global.__prismaClient__) {
        global.__prismaClient__ = prisma;
    }

    // attach early so other plugins can reference app.db during bootstrap
    app.decorate('db', prisma);

    const connectWithRetries = async () => {
        let attempts = 0;
        while (true) {
            try {
                const timeout = new Promise((_, rej) =>
                    setTimeout(() => rej(new Error('prisma connect timeout')), cfg.connectTimeoutMs)
                );
                await Promise.race([prisma.$connect(), timeout]);
                app.log.info('prisma connected');
                break;
            } catch (err: unknown) {
                attempts++;
                if (err instanceof Error && err.name === 'PrismaClientInitializationError') {
                    app.log.error({ err }, 'PrismaClient initialization failed');
                    app.log.error('Run npx prisma generate and verify generated client path');
                    throw err;
                }

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
            await prisma.$disconnect();
            app.log.info('prisma disconnected via onClose');
        } catch (err) {
            app.log.error({ err }, 'error disconnecting prisma on onClose');
        }
    });

    // do not bind process signals in dev to remain friendly to nodemon and tsx
    const handleSignal = async (signal: NodeJS.Signals) => {
        try {
            app.log.info({ signal }, 'shutdown signal received');
            await prisma.$disconnect();
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
