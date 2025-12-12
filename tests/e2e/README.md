# Playwright E2E Testing

## Folder Structure
```
tests/e2e/
├── .auth/              # Saved auth state (gitignored)
├── test-data.ts        # Test data and constants
├── auth.setup.ts       # Login setup (runs first)
├── auth.spec.ts        # Authentication tests
├── dashboard.spec.ts   # Dashboard tests
├── tds-form.spec.ts    # Form submission tests
├── ssr-directory.spec.ts # SSR Directory tests
└── tds-tool.spec.ts    # TDS Tool calculator tests
```

## Quick Start

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run all tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# Run specific test file
npx playwright test auth.spec.ts

# Debug mode (step through)
npx playwright test --debug

# View HTML report
npx playwright show-report
```

## Environment Variables

Create `.env.test` (add to .gitignore!):
```
TEST_ADMIN_EMAIL=your-admin@test.com
TEST_ADMIN_PASSWORD=your-password
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

For CI/CD, add these as GitHub Secrets.
