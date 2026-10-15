FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY --from=builder /app/dist ./dist
COPY server.js ./

ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "server.js"]
