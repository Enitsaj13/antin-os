# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV SIMPLE_GIT_HOOKS=0
ENV CI=1
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
ENV DATABASE_URL=postgresql://antin:placeholder@localhost:5432/antin_os?schema=public
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy --ignore-scripts /app
RUN cp -R apps/api/dist /app/dist \
  && mkdir -p /app/node_modules/.bin \
  && ln -s ../.pnpm/node_modules/.bin/prisma /app/node_modules/.bin/prisma
RUN cd /app && ./node_modules/.bin/prisma generate

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3001
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/src/main.js"]
