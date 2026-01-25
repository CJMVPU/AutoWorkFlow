# Copilot Instructions for AutoWorkFlow

## Project Overview
This is a TypeScript-based browser automation project using Playwright for end-to-end testing. The main automation codebase lives in the `ts-automation/` directory.

## Architecture
- **Test Framework**: Playwright Test (CommonJS module system)
- **Language**: TypeScript with Node.js types
- **Test Location**: All test specs go in `ts-automation/tests/`
- **Configuration**: `ts-automation/playwright.config.ts` - centralized test runner config

## Key Workflows

### Running Tests
```bash
cd ts-automation
npx playwright test                    # Run all tests
npx playwright test --ui              # UI mode for debugging
npx playwright test --headed          # See browser during test
npx playwright show-report            # View HTML report after run
```

### Test Development
- Tests run in parallel by default (`fullyParallel: true`)
- On CI: 1 worker, 2 retries, `test.only` fails build
- Locally: parallel workers, no retries
- Traces captured on first retry (`trace: 'on-first-retry'`)

## Testing Patterns

### Standard Test Structure (from example.spec.ts)
```typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Expected Title/);
});
```

### Browser Coverage
Three projects configured: `chromium`, `firefox`, `webkit`
- Each test runs against all three unless filtered with `--project`
- Mobile viewports and branded browsers (Edge, Chrome) are available but commented out

## Project Conventions
- **No custom test scripts**: Use `npx playwright` commands directly
- **CommonJS module system**: Uses `require`/`module.exports` (see `"type": "commonjs"` in package.json)
- **Test file naming**: `*.spec.ts` pattern in `tests/` directory
- **Async/await pattern**: All test functions are `async` with `await` for Playwright actions

## Configuration Details
- Test directory: `./tests` (relative to playwright.config.ts)
- Reporter: HTML (generates after test runs)
- No baseURL configured - use full URLs in `page.goto()`
- No environment file (dotenv) setup currently active
- No webServer configuration - tests target external URLs or require manual server start

## Important Files
- [ts-automation/playwright.config.ts](ts-automation/playwright.config.ts) - all test runner configuration
- [ts-automation/tests/example.spec.ts](ts-automation/tests/example.spec.ts) - reference test structure
- [ts-automation/package.json](ts-automation/package.json) - dependencies and module system config

## Development Tips
- Use Playwright's `getByRole` locators for accessibility-friendly selectors (see example.spec.ts)
- Keep tests focused and independent - they run in parallel
- Leverage Playwright's auto-waiting - no need for manual `waitFor` in most cases
- Use `test.only()` during development, but remove before commit (CI will catch it)
