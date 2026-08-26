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
COPY packages/api-client/package.json packages/api-client/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY packages/shared packages/shared
COPY packages/api-client packages/api-client
COPY apps/web apps/web
RUN pnpm --filter web build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
ENV WEB_API_BASE_URL=http://localhost:3001
COPY --from=build --chown=101:101 /repo/apps/web/dist /usr/share/nginx/html
COPY --chown=101:101 apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 --chmod=755 apps/web/docker-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
