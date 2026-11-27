import { getPlaylistById, getPlaylistByLink, getPlaylistSongs } from '../services/playlist.service';
import {
    idOrLinkWithProvider,
    idParam,
    optionalPaginationQuery,
    providerQuery,
} from '../validators/common.validators';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

const playlistsRoutes: FastifyPluginAsync = async (app) => {
    const api = app.withTypeProvider<ZodTypeProvider>();

    api.get(
        '/playlists',
        {
            schema: {
                querystring: idOrLinkWithProvider,
                tags: ['playlists'],
                summary: 'Retrieve playlist by id or link',
            },
        },
        async (req) => {
            const { id, link, provider } = req.query;
            return link ? getPlaylistByLink(link, { provider }) : getPlaylistById(id!, { provider });
        }
    );

    api.get(
        '/playlists/:id',
        {
            schema: {
                params: idParam,
                querystring: providerQuery,
                tags: ['playlists'],
                summary: 'Retrieve playlist by id',
            },
        },
        async (req) => getPlaylistById(req.params.id, { provider: req.query.provider })
    );

    api.get(
        '/playlists/:id/songs',
        {
            schema: {
                params: idParam,
                querystring: optionalPaginationQuery.extend(providerQuery.shape),
                tags: ['playlists'],
                summary: 'Retrieve playlist songs (returns all songs when limit is omitted)',
            },
        },
        async (req) =>
            getPlaylistSongs({
                id: req.params.id,
                limit: req.query.limit,
                offset: req.query.offset,
                opts: { provider: req.query.provider },
            })
    );
};

export default playlistsRoutes;
