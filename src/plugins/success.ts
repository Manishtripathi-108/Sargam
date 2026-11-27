import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const successPlugin: FastifyPluginAsync = async (app) => {
    // runtime decorator. keep type augmentation in your types file.
    app.decorateReply('success', true);

    // reset default for each incoming request
    app.addHook('onRequest', (req, reply, done) => {
        reply.success = true;
        done();
    });

    // transform the payload just before serialization
    app.addHook('preSerialization', async (req, reply, payload) => {
        try {
            // treat 2xx as success unless someone changed reply.success
            const success = reply.statusCode >= 200 && reply.statusCode < 300 ? !!reply.success : false;

            // helper to detect streams and buffers
            const isBuffer = Buffer.isBuffer(payload);
            const isStream =
                payload !== null &&
                typeof payload === 'object' &&
                'pipe' in payload &&
                typeof (payload as { pipe?: unknown }).pipe === 'function';
            const isPlainObject =
                payload !== null && typeof payload === 'object' && !Array.isArray(payload) && !isBuffer && !isStream;

            // If payload is a plain object merge top-level keys.
            // We take care to ignore any success field from the payload.
            if (isPlainObject) {
                const { success: _ignored, ...rest } = payload as Record<string, unknown>;
                return { success, ...rest };
            }

            // Arrays, buffers, streams, strings, numbers, null, etc
            return { success, data: payload };
        } catch (err) {
            // never throw from hooks. log and return a minimal safe shape
            app.log.debug({ err, url: req.url, method: req.method }, 'success-plugin:wrap-failed');
            return { success: false, data: payload };
        }
    });
};

export default fp(successPlugin);
