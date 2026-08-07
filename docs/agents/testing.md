# Testing

The Playwright suite runs against three responsive targets:

- `chromium` for desktop browser behavior
- `tablet` at `768x1024`
- `mobile` using the Pixel 5 device profile

Run the full suite with `npm run test:e2e`. Run a focused responsive suite with commands such as
`npx playwright test e2e/job-card-responsive.spec.ts --project=tablet`.
