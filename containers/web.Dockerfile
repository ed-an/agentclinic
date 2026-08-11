FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/web apps/web
ARG AGENTCLINIC_API_URL
ENV AGENTCLINIC_API_URL=$AGENTCLINIC_API_URL
RUN test -n "$AGENTCLINIC_API_URL" && npm run build --workspace @agentclinic/web

FROM node:24.19.0-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/web ./apps/web
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["npm", "run", "start", "--workspace", "@agentclinic/web"]
