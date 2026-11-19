import type { Services } from '../services/types';
import type { DbClient } from '../db';
import 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        db: DbClient;
        services: Services;
    }
    interface FastifyReply {
        success: boolean;
    }
}
