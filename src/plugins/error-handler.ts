import { isDev } from '../utils/environment.utils';
import { formatZodValidationErrors } from '../utils/validation.utils';
import { isAxiosError } from 'axios';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import http from 'http';

type HttpLikeError = {
    statusCode?: number;
    status?: number;
    message?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getMessage = (value: unknown, fallback: string) =>
    typeof value === 'string' && value.length > 0 ? value : fallback;

const registerErrorHandler = async (app: FastifyInstance) => {
    app.setErrorHandler(async (err: unknown, req: FastifyRequest, reply: FastifyReply) => {
        // ensure the success flag is false for any error
        reply.success = false;

        // if headers already sent, do nothing
        if (reply.sent) {
            req.log.warn({ url: req.url, method: req.method }, 'headers_already_sent');
            return;
        }

        // handle zod validation errors only
        if (hasZodFastifySchemaValidationErrors(err)) {
            try {
                const issues = formatZodValidationErrors(err.validation);

                req.log.info({ url: req.url, method: req.method, issues }, 'validation_error');

                return reply.status(400).send({
                    statusCode: 400,
                    error: 'Bad Request',
                    message: 'Request validation failed',
                    issues,
                    success: false,
                });
            } catch (zErr) {
                req.log.error({ err: zErr, origErr: err }, 'zod_format_failure');
            }
        }

        // handle axios errors
        if (isAxiosError(err)) {
            const statusCode = err.response?.status ?? 502;
            const statusMessage = http.STATUS_CODES[statusCode] ?? 'Bad Gateway';

            const responseData = isObject(err.response?.data) ? err.response.data : null;
            const message = getMessage(responseData?.message ?? err.message, statusMessage);

            req.log.error({ err, url: req.url, method: req.method }, 'axios_error');

            return reply.status(statusCode).send({
                statusCode,
                error: isDev ? `Axios Error: ${statusMessage}` : statusMessage,
                message,
                success: false,
            });
        }

        // generic error handling
        try {
            const httpErr: HttpLikeError | null = isObject(err) ? err : null;

            const statusCode =
                typeof httpErr?.statusCode === 'number'
                    ? httpErr.statusCode
                    : typeof httpErr?.status === 'number'
                      ? httpErr.status
                      : 500;

            const safeCode = statusCode || 500;
            const statusMessage = http.STATUS_CODES[safeCode] ?? 'Internal Server Error';

            const message = getMessage(httpErr?.message, statusMessage);

            if (safeCode >= 500) {
                req.log.error({ err, url: req.url, method: req.method }, 'unhandled_error');
            } else {
                req.log.info({ err, url: req.url, method: req.method }, 'http_error');
            }

            return reply.status(safeCode).send({
                statusCode: safeCode,
                error: statusMessage,
                message,
                success: false,
            });
        } catch (fatalErr) {
            req.log.error({ err: fatalErr, origErr: err }, 'fatal_error_handler_failure');

            return reply.status(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                success: false,
            });
        }
    });
};

export default registerErrorHandler;
