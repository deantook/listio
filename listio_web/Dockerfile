# ============================================================
# Stage 1: Base — 安装 pnpm
# ============================================================
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ============================================================
# Stage 2: builder — 构建 Next.js 应用
# ============================================================
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# 生成 Prisma Client 并复制到已知位置
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate && \
    mkdir -p /prisma-artifacts && \
    cp -r node_modules/.prisma /prisma-artifacts/ && \
    cp -r node_modules/prisma /prisma-artifacts/ && \
    cp -r node_modules/@prisma /prisma-artifacts/

# 构建 Next.js（standalone 模式）
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ============================================================
# Stage 3: runner — 生产运行镜像
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma schema
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 复制 Prisma 生成的客户端和 CLI（从 builder 中预置的 /prisma-artifacts）
COPY --from=builder --chown=nextjs:nodejs /prisma-artifacts/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /prisma-artifacts/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /prisma-artifacts/@prisma ./node_modules/@prisma

# 入口脚本
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
