# Repository Learnings & Patterns

This document contains repo-specific patterns, conventions, and lessons learned that apply beyond individual tasks.
Update this file when you discover patterns that will be useful for future work in this repository.

## 🏗️ Architecture & Structure

### Project Organization

<!-- Document the project's file structure patterns -->

- Subdomain structure: `src/app/subdomains/[subdomain]/` contains feature-specific code
- API routes: `src/app/api/[feature]/[endpoint]/route.ts` for Next.js 13+ App Router
- Components organized by feature within each subdomain
- Shared utilities in `src/utils/` and subdomain-specific utils in subdomain folders

### Module Patterns

<!-- Common patterns for organizing code modules -->

- Use barrel exports (index.ts) for component folders to simplify imports
- Prefer single-file modules over folder-based modules for TypeScript compatibility
- Client components must have 'use client' directive at the top

### Dependencies & Imports

<!-- Import conventions, common utilities, shared modules -->

- Always check `@lawlzer/utils` package first before creating new utilities
- React Query for data fetching, avoid manual state management for server data
- Use type imports where possible: `import type { ... }`

## 📝 Coding Conventions

### Naming Conventions

<!-- Variable naming, file naming, component naming patterns -->

- Components: PascalCase (e.g., RecipeCard.tsx)
- Hooks: camelCase with 'use' prefix (e.g., useCookingData)
- API routes: kebab-case folders with route.ts file
- Type/Interface: PascalCase with descriptive names

### Code Style Patterns

<!-- Recurring patterns specific to this codebase -->

- Strict ESLint rules enforced - no implicit truthy checks
- Always use explicit null/undefined checks: `value !== null && value !== undefined`
- Use nullish coalescing (`??`) instead of logical OR (`||`) for defaults
- Wrap promise-returning functions with `void` in event handlers

### Common Utilities

<!-- Frequently used utilities and their proper usage -->

- `cn()` function from utils for className merging
- Toast notifications via `useToast()` hook
- Error boundaries for robust error handling
- Centralized icon system in `src/components/Icons.tsx`

## 🔧 Build & Development

### Build Process Quirks

<!-- Special considerations for building the project -->

- Next.js 15 requires `Promise<{ params }>` for dynamic route params
- Clear .next cache when module resolution issues occur
- Use `npm run lint:eslint:commit` to check ESLint before committing
- Prettier config must be in root directory as `.prettierrc.mjs` (can re-export from .config/)

### Development Workflow

<!-- Specific workflows that work well for this project -->

- Use MCP server (`npx -y playwright-mcp`) to verify UI/UX changes
- Run at `http://localhost:3000/subdomains/cooking` for testing
- Guest mode should work without database connection

### Environment Setup

<!-- Special environment requirements or setup steps -->

- MongoDB required for full functionality but app should work in guest mode
- Environment variables in `.env` file (not committed)
- Use `.test.env` for test environment configuration

## ⚠️ Common Pitfalls

### Things That Break

<!-- Known issues and how to avoid them -->

- Infinite loops in React: Avoid callbacks as useEffect dependencies
- AbortSignal issues in tests: Use custom test helper instead of next-test-api-route-handler
- Module resolution: TypeScript may not recognize folder-based modules, use single files
- TypeScript unsafe returns: When API returns wrapped data (e.g., `{ days: [] }`), ensure service layer types match

### Performance Considerations

<!-- Performance bottlenecks and optimizations -->

- Memoize expensive computations with useMemo
- Use React.memo for component optimization with custom comparison
- Code split large components with dynamic imports
- Virtual scrolling for large lists

### Edge Cases

<!-- Recurring edge cases to watch for -->

- Always provide default empty arrays for props that will be mapped
- Handle undefined/null in React Query data with fallbacks
- Guest mode data persistence across page refreshes
- Race conditions in data migration flows

## 🧪 Testing Patterns

### Test Structure

<!-- How tests are organized in this project -->

- Unit tests: `tests/unit/[feature].test.ts`
- Integration tests: `tests/integration/[api-route].test.ts`
- E2E tests: `tests/e2e/[user-journey].spec.ts`
- Use Vitest for unit/integration, Playwright for E2E

### Mocking Strategies

<!-- Common mocking patterns that work -->

- Mock Next.js auth with `vi.mock('next-auth/next')`
- Use custom API route test helper to avoid AbortSignal issues
- Mock external dependencies at module level

### Test Data

<!-- Patterns for test data setup -->

- Use factories for consistent test data creation
- Guest data stored in localStorage/cookies
- Clear storage between tests to avoid contamination

## 🚀 Deployment & Configuration

### Configuration Patterns

<!-- How configuration is managed -->

- Environment-specific configs via Next.js env system
- Feature flags through environment variables
- API endpoints configured via service layers

### Deployment Gotchas

<!-- Things to remember during deployment -->

- Build output is standalone mode
- Ensure all environment variables are set
- Database migrations must run before deployment

## 📚 Domain Knowledge

### Business Logic Patterns

<!-- Recurring business logic patterns -->

- Recipe nutrition calculation includes nested recipes
- Guest data migrates to user account on login
- Daily tracking tied to date, not timestamp
- Cooking mode scales all ingredients proportionally

### Data Flow

<!-- How data typically flows through the system -->

- React Query for server state → Context for UI state
- Guest data: localStorage → API migration → database
- Real-time updates through query invalidation

### API Patterns

<!-- Common API patterns and conventions -->

- RESTful routes with standard HTTP methods
- Consistent error response format: `{ error: string }`
- Auth check at start of each protected route
- Return appropriate status codes (401, 404, 500)

## 🔍 Debugging Tips

### Common Issues & Solutions

<!-- Frequently encountered issues and their solutions -->

- "Cannot update component while rendering": Move state updates out of render
- "Maximum update depth exceeded": Check for circular dependencies in useEffect
- Module not found: Clear .next cache and restart dev server

### Useful Debug Commands

<!-- Commands that help with debugging -->

- `npm run lint:eslint:commit` - Check all ESLint errors
- `npm run build` - Catch type errors not shown in dev
- `Get-Process | Where-Object { $_.ProcessName -like "*node*" }` - Find stuck processes

### Log Locations

<!-- Where to find useful logs -->

- Build errors: Terminal output from `npm run build`
- Runtime errors: Browser console
- API errors: Network tab in browser DevTools
- Server logs: Terminal running `npm run dev`

## 📋 Checklist Reminders

### Before Making Changes

<!-- Things to always check before modifying code -->

- [ ] Check if utility exists in @lawlzer/utils
- [ ] Review existing patterns in similar components
- [ ] Consider guest mode implications
- [ ] Plan for proper error handling

### After Making Changes

<!-- Things to verify after modifications -->

- [ ] Run `npm run lint:eslint:commit` - must have 0 errors
- [ ] Run `npm run build` - must complete successfully
- [ ] Test in guest mode (no database)
- [ ] Verify via MCP server if UI changes
- [ ] Update tests for new functionality
- [ ] Check for accessibility (keyboard nav, screen readers)

---

**Remember**: Only add learnings that are specific to THIS repository and will be useful for future tasks.
General programming knowledge doesn't belong here.
