# Testing

The Playwright suite runs against three responsive targets:

- `chromium` for desktop browser behavior
- `tablet` at `768x1024`
- `mobile` using the Pixel 5 device profile

Run the full suite with `npm run test:e2e`. Run a focused responsive suite with commands such as
`npx playwright test e2e/job-card-responsive.spec.ts --project=tablet`.

Interview Round layout checks also run in the focused `webkit-layout` and
`iphone-layout` projects. Install WebKit with `npx playwright install webkit`, then run:

```sh
npx playwright test e2e/interview-round-layout.spec.ts --project=chromium --project=webkit-layout --project=iphone-layout --no-deps
```

These checks render the real edit dialog with mocked auth and persistence, so they
need no test account. The iOS sizing cases model the native date/time content-box
override because Linux WebKit does not run the iOS native control theme. They do
not verify the native picker or replace checks on a real iPhone or iPad.
