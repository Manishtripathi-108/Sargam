# Sargam — Agent Instructions

> Music streaming aggregation API built with **Fastify 5 + TypeScript + Prisma + Zod**.
> Proxies Saavn, Gaana, Qobuz, and Tidal into a unified response format.

---

## Architecture — The Flow (never break this)

```
Request → Route → Service → Provider → External API
                                ↑
                          resolveProvider()
                          (src/utils/provider.utils.ts)
```

### Layer responsibilities

| Layer          | Directory               | Does                                                           | Does NOT                                     |
| -------------- | ----------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| **Routes**     | `src/routes/`           | Validate input (Zod schemas), extract params, call service     | Business logic, provider logic, direct HTTP  |
| **Services**   | `src/services/`         | Orchestrate providers via `resolveProvider()`, error wrapping  | HTTP calls, data mapping, route registration |
| **Providers**  | `src/providers/{name}/` | HTTP calls, response mapping, provider-specific logic          | Route registration, validation               |
| **Plugins**    | `src/plugins/`          | Cross-cutting concerns (DB, CORS, JWT, error handler, logging) | Business logic                               |
| **Types**      | `src/types/`            | Type definitions, response shapes                              | Runtime logic                                |
| **Validators** | `src/validators/`       | Zod schemas and type exports                                   | Anything else                                |
| **Utils**      | `src/utils/`            | Pure utility functions                                         | Side effects, business logic                 |

---

## Constraints — Rules that must NEVER be broken

### 1. Provider Pattern

- Every music provider lives in `src/providers/{name}/` with exactly this file structure:
    - `index.ts` — single aggregation export object
    - `{name}.client.ts` — Axios instance + interceptors
    - `{name}.routes.ts` — API endpoint constants (as `const` object)
    - `{name}.mapper.ts` — maps raw API response → core models
    - `{name}.search.ts`, `{name}.songs.ts`, `{name}.albums.ts`, `{name}.artists.ts`, `{name}.playlists.ts` — domain modules
- Provider objects **must** expose: `{ search, songs, albums, artists, playlists }` (minimum)
- Adding a provider = add to `providerEnum` in `src/validators/common.validators.ts` AND to `providerRegistry` in `src/utils/provider.utils.ts`

### 2. Unified Core Models

- All providers map to the same core types in `src/types/core/`:
    - `Song`, `SongBase`, `Album`, `AlbumBase`, `Artist`, `ArtistBase`, `Playlist`, `PlaylistBase`
    - `ImageAsset` (`{ low, medium, high }`)
    - `Paginated<T>` (`{ items, total, limit, offset, hasNext }`)
    - Search types: `GlobalSearchResult`, `SearchSong`, `SearchAlbum`, `SearchArtist`, `SearchPlaylist`
- **Never change core model shapes** without updating ALL provider mappers

### 3. Validation

- Use **Zod schemas** for all route input validation via `fastify-type-provider-zod`
- All validators live in `src/validators/common.validators.ts`
- Compose schemas using `.extend()` and `.shape` spread — don't duplicate
- Type exports derive from schemas: `z.infer<typeof schema>`

### 4. Error Handling

- Use `AppError` from `src/utils/error.utils.ts` for all thrown errors
- Use `wrapError()` in service catch blocks — it re-throws `AppError` and `AxiosError`, wraps others
- Use `assertData()` for null/empty checks
- The global error handler in `src/plugins/error-handler.ts` handles: Zod validation → Axios → generic
- **Never** swallow errors silently. Always log or re-throw

### 5. Response Envelope

- The `success` plugin automatically wraps all responses with `{ success: true/false, ...data }`
- **Never** manually add `success` to route return values — the plugin handles it
- Error responses follow: `{ statusCode, error, message, success: false }`

### 6. Type Safety

- `strict: true` in tsconfig — **never disable**
- `noImplicitAny: true` — **never disable**
- Use `type` imports (`import type { ... }`) — enforced by ESLint
- No `any` — `@typescript-eslint/no-explicit-any: error`
- Generated Prisma types go to `src/generated/prisma/` — **never edit generated files**

### 7. Module System

- ESM only (`"type": "module"` in package.json, `"module": "ESNext"` in tsconfig)
- **Never** use `require()` or CommonJS

### 8. Database

- Prisma with PostgreSQL via `@prisma/adapter-pg`
- Generated client output: `src/generated/prisma/`
- Prisma config: `prisma.config.ts`, schema: `prisma/schema.prisma`
- DB plugin handles singleton PrismaClient, connection retries, graceful shutdown
- Access via `app.db` (decorated by db plugin)

### 9. Authentication

- JWT via `@fastify/jwt` — secret from `JWT_SECRET` env var
- Token expiry: 15 minutes (sign config)

### 10. Secrets & Decryption

- `src/utils/decrypt.utils.ts` handles Gaana AES-128-CBC and Saavn DES-ECB decryption
- **Never** log decryption keys, secrets, or tokens
- **Never** commit `.env` — only `.env.example`

### 11. Logging

- Fastify uses **Pino** natively
- Dev: `pino-pretty` with colorized output, level from `LOG_LEVEL` env (default `debug`)
- Prod: structured JSON logs, level from `LOG_LEVEL` env (default `info`)
- Use `req.log` inside route handlers, `app.log` in plugins
- Log levels: `fatal` > `error` > `warn` > `info` > `debug` > `trace`

### 12. Testing

- **Bruno** for API testing (collection in `bruno/` directory)
- No unit test framework configured — use Bruno collections for endpoint validation
- Environments: `local` (localhost:3000), `production`

---

## Code Style

- **Prettier**: 4-space indent, single quotes, trailing commas (es5), 120 char width, LF line endings
- **ESLint**: strict TypeScript checking (`strictTypeChecked` rules), type-imports enforced
- **Naming**: files use `kebab-case` with dot-delimited suffixes (e.g., `search.routes.ts`, `saavn.mapper.ts`)
- **Imports**: sorted by `@trivago/prettier-plugin-sort-imports`

---

## Adding a New Feature — Checklist

### New Provider

1. Create `src/providers/{name}/` with all required files
2. Add provider-specific types in `src/types/{name}/`
3. Add to `providerEnum` in validators
4. Add to `providerRegistry` in `provider.utils.ts`
5. Add env vars to `.env.example` and env plugin schema
6. Add Bruno test requests in `bruno/{name}/`
7. Add docs in `docs/provider-notes/{name}.md`

### New Route

1. Create route file in `src/routes/` using Zod schema validation
2. Create/update service in `src/services/`
3. Register in `src/routes/index.ts`
4. Add Bruno requests
5. Use `app.withTypeProvider<ZodTypeProvider>()` in every route file

### New Utility

1. Add to `src/utils/` with `{name}.utils.ts` naming
2. Pure functions only — no side effects
3. Add JSDoc with `@example`

---

## Environment Variables (Required)

| Variable       | Purpose                        |
| -------------- | ------------------------------ |
| `PORT`         | Server port (default 3000)     |
| `DATABASE_URL` | PostgreSQL connection string   |
| `JWT_SECRET`   | JWT signing secret             |
| `CLIENT_URLS`  | CORS origins (comma-separated) |
| `QOBUZ_APP_ID` | Qobuz API app ID               |

---

## Commands

| Command               | Purpose                      |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start dev server (tsx watch) |
| `npm run build`       | TypeScript compile           |
| `npm start`           | Run compiled JS              |
| `npm run db:generate` | Regenerate Prisma client     |
| `npm run db:mig:dev`  | Create migration             |
| `npm run db:studio`   | Open Prisma Studio           |
| `npm run lint`        | ESLint check                 |
| `npm run format`      | Prettier format              |

---

## Performance Guidelines

- Axios clients use interceptors for auth headers — don't duplicate
- PrismaClient is singleton in dev (global cache prevents hot-reload leaks)
- Pagination is normalized via `normalizePagination()` — always use it
- Image URLs are upgraded to HTTPS via `upgradeToHttps()` — always use it
- User agents are randomized per request — already handled by client interceptors

---

## What NOT to do

- ❌ Don't add business logic to routes — delegate to services
- ❌ Don't call external APIs from services — delegate to providers
- ❌ Don't create new Axios instances outside provider clients
- ❌ Don't use `console.log` — use Fastify's Pino logger (`app.log` / `req.log`)
- ❌ Don't add `success` field manually — the plugin handles it
- ❌ Don't modify generated Prisma files
- ❌ Don't use CommonJS (`require`, `module.exports`)
- ❌ Don't skip Zod validation on routes
- ❌ Don't commit `.env` or log secrets
- ❌ Don't create circular imports between layers
