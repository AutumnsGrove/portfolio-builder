# Test Suite

## Current Coverage: 37 tests across 4 files

### Test Files

1. **`manifest-validation.test.ts`** (3 tests)
   - Validates example manifest against Zod schemas
   - Rejects invalid version numbers
   - Rejects invalid semantic sizes

2. **`block-schemas.test.ts`** (21 tests)
   - Individual validation for all 7 v1 block types
   - Tests valid data acceptance and invalid data rejection
   - Verifies discriminated union type safety

3. **`analytics.test.ts`** (5 tests)
   - Funnel event tracking
   - Agent metrics tracking
   - Event duplication checking
   - Graceful error handling

4. **`database-schema.test.ts`** (8 tests)
   - Verifies all 11 tables exist
   - Checks table names and columns
   - Type safety integration with manifest types

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test manifest-validation

# Watch mode (re-run on file changes)
pnpm test:watch

# Type checking (separate from unit tests)
pnpm check
```

## Testing Strategy for V1

### What We Test
✅ **Data validation** — Manifest schemas, block types, type safety  
✅ **Database integrity** — Schema structure, foreign keys, typed JSON columns  
✅ **Analytics tracking** — Event logging, metrics, error handling

### What We Don't Test Yet (Will add as we build)
- ⏳ AI tool handlers (when we build the AI system)
- ⏳ WorkOS auth flow (when we integrate auth)
- ⏳ API endpoints (when we build the Worker routes)
- ⏳ Editor state management (when we build the UI)

### Testing Philosophy
**Goal:** Catch breaking changes fast, not achieve 100% coverage.

**High-leverage tests:**
- Schema validation (prevents invalid data from entering the system)
- Database integrity (ensures data relationships work)
- Critical business logic (AI tools, funnel tracking)

**Low-priority tests:**
- UI components (visual regression, user interactions)
- API integration tests (would require spinning up Workers)
- End-to-end flows (reserved for manual QA during v1 validation)

## Adding New Tests

When adding a new feature, ask:
1. **Does it validate data?** → Add schema tests
2. **Does it write to the database?** → Add integration tests
3. **Is it critical business logic?** → Add unit tests
4. **Is it UI rendering?** → Skip for v1, test manually

Example:
```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/lib/my-feature';

describe('My Feature', () => {
  it('should do the thing', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## CI/CD Integration (Future)

When we set up CI/CD, tests will run on:
- Every commit to main
- Every pull request
- Pre-deploy checks

For now, run `pnpm test && pnpm check` before committing.
