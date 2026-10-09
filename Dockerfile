# One image for the whole shop system: the API, the background workers and
# the web app run from it with different commands (see docker-compose.yml).
FROM node:22-bookworm-slim

RUN npm install -g bun@1.3.6

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

# The web app reads these at build time, so they are baked into the image
ARG NEXT_PUBLIC_API_URL=http://localhost:3333
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_DOCS_URL=http://localhost:3333/reference
ARG NEXT_PUBLIC_LINKTREE_URL=http://localhost:3000
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
	NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
	NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL \
	NEXT_PUBLIC_LINKTREE_URL=$NEXT_PUBLIC_LINKTREE_URL \
	NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
	NEXT_TELEMETRY_DISABLED=1

RUN bun run --filter server build \
	&& bun run --filter workers build \
	&& bun run --filter web build

ENV NODE_ENV=production
