# Vercel Migration Checklist

## Pre-Migration

- [ ] Backup current `.env` file
- [ ] Note current MongoDB connection string
- [ ] Screenshot current staging site for comparison
- [ ] Ensure git is up to date with staging branch

## Step 1: Terminate EC2 (Save $20.20/month)

```bash
python scripts/terminate-staging-ec2.py
```

This will:

- Terminate EC2 instance
- Release Elastic IP
- Clean up S3 artifacts

## Step 2: Install Vercel

```bash
npm i -g vercel
```

## Step 3: Deploy to Vercel

```bash
# From project root
vercel

# Answer prompts:
# - Link to existing project? No
# - What's your project name? lawlzer-website-staging
# - In which directory is your code? ./
# - Want to override settings? No
```

## Step 4: Set Environment Variables

Go to: https://vercel.com/dashboard/project/lawlzer-website-staging/settings/environment-variables

Add these variables for all environments:

```
NODE_ENV=production
DATABASE_URL=<your-mongodb-url>
MONGO_URI=<your-mongodb-url>

NEXT_PUBLIC_SCHEME=https
NEXT_PUBLIC_SECOND_LEVEL_DOMAIN=staging
NEXT_PUBLIC_TOP_LEVEL_DOMAIN=lawlzer.com
NEXT_PUBLIC_FRONTEND_PORT=443

NEXT_PUBLIC_AUTH_GOOGLE_ID=<your-google-id>
NEXT_PUBLIC_AUTH_DISCORD_ID=<your-discord-id>
NEXT_PUBLIC_AUTH_GITHUB_ID=<your-github-id>

AUTH_GOOGLE_SECRET=<your-google-secret>
AUTH_DISCORD_SECRET=<your-discord-secret>
AUTH_GITHUB_SECRET=<your-github-secret>
```

## Step 5: Deploy with Environment Variables

```bash
vercel --prod
```

## Step 6: Update DNS

In Cloudflare:

1. Delete A record pointing to old EC2 IP (18.205.183.127)
2. Add CNAME record:
   - Name: `staging`
   - Target: `<your-project>.vercel.app`
   - Proxy: Enabled (orange cloud)

## Step 7: Verify

- [ ] Site loads at https://staging.lawlzer.com
- [ ] Can log in with OAuth
- [ ] Database connection works
- [ ] API routes respond

## Step 8: Set Up Auto-Deploy

```bash
vercel git connect
```

This will auto-deploy on push to staging branch.

## Troubleshooting

### Database Connection Issues

- Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Vercel's IPs to allowlist

### Environment Variables Not Working

- Redeploy after adding env vars: `vercel --prod --force`

### OAuth Redirect Issues

- Update OAuth app settings with new Vercel URL
- Add `https://staging.lawlzer.com` to allowed redirects

## Rollback Plan

If something goes wrong:

```bash
cd pulumi && pulumi up -s staging
```

This recreates the EC2 infrastructure.

## Success Metrics

- ✅ Site accessible at staging.lawlzer.com
- ✅ $0/month hosting cost
- ✅ Faster load times (CDN)
- ✅ Auto-deploy on git push
