# AWS to Vercel Migration - COMPLETED

**Archived**: 2025-06-15
**Duration**: ~4 hours
**Cost Savings**: $20.20/month (100% reduction)

## Summary

Successfully migrated staging environment from AWS EC2 to Vercel free tier:

### Achievements:

- ✅ Terminated EC2 instance (was costing $20.20/month)
- ✅ Deployed to Vercel free tier ($0/month)
- ✅ Fixed VERCEL_URL validation issues
- ✅ Fixed subdomain navigation for Vercel deployments
- ✅ Configured DNS via Cloudflare API
- ✅ Added wildcard support for \*.staging.lawlzer.com
- ✅ Verified all functionality working

### Key Learnings:

1. Vercel's VERCEL_URL doesn't include protocol
2. Subdomain navigation needs dynamic URL construction
3. Cloudflare API credentials stored in ~/.cfcli.yml
4. Wildcard DNS records can't use Cloudflare proxy
5. Modern Next.js apps need significant resources (why EC2 struggled)

### Final Configuration:

- Main site: lawlzer-website.vercel.app
- Staging domains: \*.staging.lawlzer.com
- All DNS managed via Cloudflare with CNAME to cname.vercel-dns.com

### Next Steps:

- Consider migrating production to Vercel
- Investigate root domain redirect loops if needed
- Monitor performance and usage on Vercel dashboard
