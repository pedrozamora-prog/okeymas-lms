FROM node:22-alpine AS base
RUN npm install -g pnpm@11.1.2
WORKDIR /app

# Install dependencies using workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Copy full source and build
COPY . .
RUN cd apps/web && pnpm build

# Minimal production image using standalone output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=base /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
