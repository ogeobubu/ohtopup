# Responsive layout verification

The public site, customer account, and admin workspace share `client/src/styles/customer-responsive.css`. Keep its import after `App` in `main.tsx` so responsive rules follow the admin component styles.

Layout conventions:

- Use flexible widths with maximum widths for cards inside account panels.
- Keep settings and service tabs on one readable, horizontally scrollable row. Do not hide page overflow to mask layout problems.
- Stack secondary admin navigation below 1280px; the main admin sidebar already consumes 224px on desktop.
- Use `ot-responsive-dialog` on custom fixed dialog overlays to bound and scroll their immediate panel. Shared `Modal` already provides its own scrolling and keyboard handling.
- Keep `vh` fallbacks before `dvh` declarations for viewport-sized dialogs.
- Use CSS breakpoints for content that must respond to resizing instead of reading `window.innerWidth` during render.

Verification viewports (CSS pixels): 320×568, 390×844, 667×375, 768×1024, 1024×768, and 1440×900.

Browser checks use Chrome, Playwright Firefox, and Playwright WebKit with mock API responses. Routes checked include the landing page, login, registration, dashboard, settings, support, utilities, wallet, admin login, admin dashboard, and admin settings. Check for document-level horizontal overflow and JavaScript errors, and exercise admin navigation dismissal and resizing. Payment modal checks cover its bounds, scrolling, Escape dismissal, and focus restoration.

These checks cover layout with fixture data, not live payment/provider behavior. Physical Android/iOS checks should also cover the software keyboard, browser toolbar expansion, pinch zoom, portrait/landscape rotation, and payment-provider popups. WebKit automation is engine coverage, not a test of the Safari application on a physical iPhone.

Run the production build with `npm run build --prefix client`.
