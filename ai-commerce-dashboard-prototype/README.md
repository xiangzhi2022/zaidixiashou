# AI Commerce Ops

Monorepo engineering foundation for the AI Commerce Ops Dashboard.

The root `index.html`, `styles.css`, and `app.js` are the original static prototype and remain as reference material. Production work starts in the workspace apps and packages.

## Apps

- `apps/web`: React + Vite frontend shell.
- `apps/api`: NestJS backend API shell.
- `apps/worker`: BullMQ worker shell.

## Packages

- `packages/shared`: shared API types, enums, constants.
- `packages/connectors`: platform connector interfaces and mock connector.
- `packages/config`: shared TypeScript, ESLint, and Prettier config.

## Local Setup

```bash
corepack enable
pnpm install
docker compose -f docker/docker-compose.yml up -d postgres redis minio
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

## Useful Commands

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter worker dev
pnpm build
pnpm test
```

