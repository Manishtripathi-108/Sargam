import { getAlbumById, getAlbumByLink, getAlbumSongs } from '../services/album.service';
import {
    idOrLinkWithProvider,
    idParam,
    optionalPaginationQuery,
    providerQuery,
} from '../validators/common.validators';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

const albumsRoutes: FastifyPluginAsync = async (app) => {
    const api = app.withTypeProvider<ZodTypeProvider>();

    api.get(
        '/albums',
        {
            schema: {
                querystring: idOrLinkWithProvider,
                tags: ['albums'],
                summary: 'Retrieve album by id or link',
            },
        },
        async (req) => {
            const { id, link, provider } = req.query;
            return link ? getAlbumByLink(link, { provider }) : getAlbumById(id!, { provider });
        }
    );

    api.get(
        '/albums/:id',
        {
            schema: {
                params: idParam,
                querystring: providerQuery,
                tags: ['albums'],
                summary: 'Retrieve album by id',
            },
        },
        async (req) => getAlbumById(req.params.id, { provider: req.query.provider })
    );

    api.get(
        '/albums/:id/songs',
        {
            schema: {
                params: idParam,
                querystring: optionalPaginationQuery.extend(providerQuery.shape),
                tags: ['albums'],
                summary: 'Retrieve album songs (returns all songs when limit is omitted)',
            },
        },
        async (req) =>
            getAlbumSongs({
                id: req.params.id,
                limit: req.query.limit,
                offset: req.query.offset,
                opts: { provider: req.query.provider },
            })
    );
};

export default albumsRoutes;
