# Lectio website

The marketing page for the Lectio semester planner on macOS and iOS: one
static HTML page and a stylesheet, no build step.

## Published at

GitHub Pages serves `main` from the repo root:
<https://lectio-study-planner.github.io/lectio-webpage/>

## Editing

- `index.html` is the page, `style.css` its styles. Open `index.html` in a
  browser to preview; there is nothing to install.
- `feedback.html` is the feedback form. It posts to the same endpoint and
  contract as the app's Profile ▸ Send Feedback…, documented in
  [lectio-feedback](https://github.com/Lectio-Study-Planner/lectio-feedback),
  and the report becomes an issue in the `lectio` repo. It sends the version
  as `? via website`. The function only answers browsers from this site's
  origin (`https://lectio-study-planner.github.io`), so the form fails from a
  local preview or if the site moves to another domain: add the new origin to
  `ALLOWED_ORIGINS` in the function first.
- `images/` holds the app screenshots the page shows, taken from the app
  repo's `screenshots/` (git-ignored there). The Mac shots are the window cut
  out of its backdrop (2720×1700 at +80+30) with its corners made transparent,
  so the page's drop shadow follows them; iPhone and iPad shots are only
  scaled down, and the page draws their bezels. All are WebP (`cwebp -q 86`),
  plus `og-image.jpg` for link previews. In dark mode the hero and Progress
  section swap to the dark shots (`<picture>` with `prefers-color-scheme`).
- The icons (`icon-512.png`, `apple-touch-icon.png`, `favicon.png`) are the app
  icon scaled down with `sips -Z <size>`. Regenerate them if the app icon
  changes.
- The footer links to the Impressum and privacy policy in the public
  [lectio-legal-docs](https://github.com/Lectio-Study-Planner/lectio-legal-docs)
  repo. If those pages move, update the links here too.
- When the app is live, replace the "Coming soon to the App Store" badge with
  the official App Store badge linking to the app's listing.
- `.nojekyll` makes Pages serve the files exactly as committed.
