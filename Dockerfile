# Stage 1: Builder
# Use Docker BuildKit syntax
# syntax=docker/dockerfile:1.4
FROM node:lts-alpine AS builder
WORKDIR /app

# Install dependencies required for native modules on Alpine
RUN apk add --no-cache libc6-compat gcompat libgcc libstdc++

# Copy package files and prisma schema *before* installing dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Explicitly install native modules for the target platform (alpine linux arm64)
# This needs to happen *before* the main npm install
# Ensure the platform matches the FROM image architecture if it differs from your host
RUN npm install --include=optional --os=linux --libc=musl --cpu=arm64 sharp lightningcss @tailwindcss/oxide

# Install dependencies (this will also run prisma generate via postinstall)
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# Set NEXT_TELEMETRY_DISABLED to avoid extra network calls during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Runner
FROM node:lts-alpine AS runner
WORKDIR /app

# Install runtime dependencies required by native modules
RUN apk add --no-cache libc6-compat gcompat libgcc libstdc++

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Copy prisma schema and generated client needed for runtime
# The client should be generated in node_modules during the builder stage's npm install
COPY --from=builder --chown=node:node /app/prisma ./prisma/
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Copy the native modules built in the builder stage
# Important: Ensure node_modules are copied correctly
COPY --from=builder --chown=node:node /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=node:node /app/node_modules/lightningcss ./node_modules/lightningcss
COPY --from=builder --chown=node:node /app/node_modules/@tailwindcss/oxide ./node_modules/@tailwindcss/oxide

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
# Use the standalone server entry point
CMD ["node", "server.js"] 