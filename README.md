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
  app on sample data (four semesters, made-up friends). The Mac shots are the
  window itself at 1360×850 points, captured with its transparent corners
  (`screencapture -o -l <window id>`), so the page's drop shadow follows
  them; `mac-edit` is the Edit sheet cut out of such a window. iPhone and
  iPad shots are only scaled down, and the page draws their bezels. All are WebP (`cwebp -q 86`),
  plus `og-image.jpg` for link previews. In dark mode the hero and Progress
  section swap to the dark shots (`<picture>` with `prefers-color-scheme`).
- The icons (`icon-512.png`, `apple-touch-icon.png`, `favicon.png`) are the app
  icon scaled down with `sips -Z <size>`. Regenerate them if the app icon
  changes.
- The footer links to the Impressum and privacy policy in the public
  [lectio-legal-docs](https://github.com/Lectio-Study-Planner/lectio-legal-docs)
  repo. If those pages move, update the links here too.
- The hero and the closing section link to the App Store listing,
  <https://apps.apple.com/app/lectio-semester-planner/id6799411764>, which
  sends each visitor to their own country's store. It is one listing for Mac,
  iPhone and iPad. `images/app-store-badge.svg` is Apple's black "Download on
  the App Store" badge, unaltered, from the
  [App Store marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/).
  It is kept here rather than loaded from Apple, so the page still loads
  nothing from another site. Apple's rules for it: the black badge (the white
  one only where a layout has a single badge), never modified, recoloured or
  given a shadow, at least 40 px tall, and a quarter of its height kept clear
  around it.
- `.nojekyll` makes Pages serve the files exactly as committed.
