# Git Rebase Instructions

## Overview

The codebase has been cleaned up and is ready for rebasing. All AWS/EC2 deployment artifacts have been removed, and hardcoded domains have been replaced with environment variables.

## Current State

- Latest commit: `chore: clean up codebase - remove hardcoded domains and AWS deployment artifacts`
- Target commit to hide: `65f5136d6c50e0b3d5a86946e52d992eb6f22f29` (and all commits after it)
- Branch: staging

## Rebase Strategy

### Option 1: Interactive Rebase (Recommended)

```bash
# Start interactive rebase from the commit before the target
git rebase -i 65f5136d6c50e0b3d5a86946e52d992eb6f22f29^

# In the editor, you'll see all commits. Suggested actions:
# - Change "pick" to "drop" for commits with messages like "a", "fix thing"
# - Squash related commits together
# - Reword commit messages to be more descriptive
```

### Option 2: Soft Reset and Recommit

```bash
# Reset to the commit before the target, keeping all changes
git reset --soft 65f5136d6c50e0b3d5a86946e52d992eb6f22f29^

# Create new clean commits
git add src/
git commit -m "feat: implement dynamic domain configuration with env variables"

git add vercel.json docs/vercel-migration-checklist.md
git commit -m "feat: add Vercel deployment configuration"

git add -A
git commit -m "chore: remove AWS deployment artifacts"
```

## Suggested Clean Commit Structure

1. **feat: migrate to Vercel hosting platform**

   - Add vercel.json configuration
   - Add migration checklist documentation

2. **fix: implement dynamic domain configuration**

   - Replace hardcoded domains with env.mjs values
   - Fix VERCEL_URL validation in env.mjs

3. **fix: improve subdomain routing and navigation**

   - Fix staging subdomain recognition
   - Fix home link navigation from subdomains
   - Fix www to non-www redirects

4. **fix: enable cross-subdomain cookie sharing**
   - Update cookie domain logic for subdomains
   - Remove misleading "Changes are applied instantly" text

## Important Notes

- **Backup First**: Create a backup branch before rebasing

  ```bash
  git branch backup-before-rebase
  ```

- **Force Push Required**: After rebasing, you'll need to force push

  ```bash
  git push origin staging --force-with-lease
  ```

- **Coordinate with Team**: Inform team members before force pushing as it rewrites history

## Files Changed Summary

### Kept (with modifications):

- `src/components/Topbar.tsx` - Dynamic domain configuration
- `src/middleware.ts` & test - Subdomain routing fixes
- `src/lib/palette.ts` & test - Cookie domain logic
- `src/lib/utils.ts` - Domain utilities
- `src/env.mjs` - VERCEL_URL fix
- `vercel.json` - Deployment config
- `docs/vercel-migration-checklist.md` - Migration guide

### Removed:

- All `pulumi/` infrastructure code
- EC2 deployment scripts in `scripts/`
- GitHub Actions workflows for EC2
- Various deployment documentation files

## Next Steps

1. Review this plan
2. Create backup branch
3. Execute chosen rebase strategy
4. Force push to staging
5. Verify deployment still works on Vercel
