FROM node:20-alpine
WORKDIR /workspace/apps/web
COPY apps/web/package.json apps/web/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install || true
COPY apps/web /workspace/apps/web
EXPOSE 3000
