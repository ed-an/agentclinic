FROM node:24.19.0-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/server apps/server
RUN npm run build --workspace @agentclinic/server

FROM build AS migration
USER node
CMD ["npm", "run", "db:migrate:deploy"]

FROM build AS production-deps
RUN npm prune --omit=dev

FROM node:24.19.0-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3001 DATABASE_URL=file:/data/agentclinic.db AGENTCLINIC_INSTANCE_COUNT=1 AGENTCLINIC_SQLITE_WRITER=single
WORKDIR /app
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/server/package.json ./apps/server/package.json
COPY --from=build --chown=node:node /app/apps/server/dist ./apps/server/dist
COPY --from=build --chown=node:node /app/apps/server/prisma ./apps/server/prisma
COPY --from=build --chown=node:node /app/apps/server/src/generated ./apps/server/src/generated
VOLUME ["/data"]
EXPOSE 3001
USER node
STOPSIGNAL SIGTERM
CMD ["node", "apps/server/dist/main.js"]
