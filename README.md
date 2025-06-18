<!-- prettier-ignore -->
# Lawlzer Website

## 🚀 Deployment

This project is deployed on **Vercel** with automatic deployments:

- **Production**: Deploys from `main` branch → [lawlzer-website.vercel.app](https://lawlzer-website.vercel.app)
- **Staging**: Deploys from `staging` branch

### Deployment Features:

- ✅ Zero-downtime deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for PRs
- ✅ Environment variable management via Vercel dashboard
- ✅ Optimized configuration with security headers
- ✅ Automatic caching for static assets

### Deployment Configuration:

The deployment is configured via `vercel.json` which includes:

- API function timeout limits (10 seconds)
- Security headers (X-Frame-Options, CSP, etc.)
- Aggressive caching for static assets

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Local MongoDB Setup (Optional)

#### Option 1: Docker Compose (Recommended)

```bash
# Start MongoDB with replica set
docker compose up -d mongodb

# Stop MongoDB
docker compose down
```

#### Option 2: Docker Run

```bash
# Start MongoDB in Docker
docker run --name mongo-replica -p 27017:27017 -d mongo:latest mongod --replSet rs0 --bind_ip_all
docker exec -it mongo-replica mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

#### Option 3: MongoDB Atlas

Use a cloud MongoDB instance and update `DATABASE_URL` in `.env`

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run E2E tests
```

## 🔧 CI/CD

GitHub Actions runs on every PR and push to `main`/`staging`:

- ✅ Linting (ESLint + Prettier)
- ✅ Type checking (TypeScript)
- ✅ Unit tests (Vitest)
- ✅ E2E tests (Playwright)
- ✅ Build verification

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Prisma
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=mongodb://localhost:27017/lawlzer
NODE_ENV=development

# OAuth providers
AUTH_GOOGLE_SECRET=...
AUTH_DISCORD_SECRET=...
AUTH_GITHUB_SECRET=...

# Next.js public env vars
NEXT_PUBLIC_AUTH_GOOGLE_ID=...
NEXT_PUBLIC_AUTH_DISCORD_ID=...
NEXT_PUBLIC_AUTH_GITHUB_ID=...
```

For production, set these in the [Vercel dashboard](https://vercel.com/dashboard/project/settings/environment-variables).

## 📊 Performance

- Lighthouse scores:
  - Performance: 100
  - Accessibility: 95-100 (depending on color palette)
  - Best practices: 100
  - SEO: 100

## 🧪 Testing & Code Quality

- Comprehensive test suite with unit and E2E tests
- Pre-commit hooks with ESLint and Prettier
- Type-safe with TypeScript strict mode
- Automated CI/CD pipeline
