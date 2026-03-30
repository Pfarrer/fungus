FROM node:22 AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/game/package.json packages/game/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

RUN npm ci

COPY packages/game/ packages/game/
COPY packages/client/ packages/client/
COPY packages/server/ packages/server/

RUN npm run build

RUN npm prune --omit=dev

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/packages/game/dist packages/game/dist
COPY --from=builder /app/packages/game/package.json packages/game/package.json
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/server/package.json packages/server/package.json
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json

EXPOSE 3001

ENTRYPOINT ["node", "packages/server/dist/main.js"]
