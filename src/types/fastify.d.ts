import type { Services } from '../services/types';
import 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        services: Services;
    }
    interface FastifyReply {
        success: boolean;
    }
}
