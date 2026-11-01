# Lectio website

The page for the Lectio semester planner on macOS and iOS: a landing page,
a support page with the questions people ask and the feedback form, and
their stylesheet. Static HTML, no build step.

## Published at

GitHub Pages serves `main` from the repo root:
<https://lectio-study-planner.github.io/lectio-webpage/>

| Page | Address | Used as |
|---|---|---|
| `index.html` | `…/lectio-webpage/` | Marketing URL in App Store Connect |
| `support.html` | `…/lectio-webpage/support.html` | Support URL in App Store Connect, and the app repo's README |
| `feedback.html` | `…/lectio-webpage/feedback.html` | Forwards to the support page's form |

If a page is renamed or the site moves, keep the old address answering, as
`feedback.html` does: Pages has no redirects, so it is a page that forwards
itself (`<meta http-equiv="refresh">`).

## Editing

- `index.html` is the landing page, `style.css` the styles of every page.
  Open a page in a browser to preview it; there is nothing to install.
- `support.html` holds the questions people ask most, the contact email (the
  one in the Impressum) and the feedback form. Each answer names the app's
  own menus and buttons (Profile ▸ Connect Moodle…, Export Semester…): when
  the app renames one or changes what it does, change the answer too. A
  question people keep asking gets an answer here.
- The form posts to the same endpoint and contract as the app's Profile ▸
  Send Feedback…, documented in
  [lectio-feedback](https://github.com/Lectio-Study-Planner/lectio-feedback),
  and the report becomes an issue in the private `lectio` repo. It sends the
  version as `? via website`. The function only answers browsers from this
  site's origin (`https://lectio-study-planner.github.io`), so the form fails
  from a local preview or if the site moves to another domain: add the new
  origin to `ALLOWED_ORIGINS` in the function first.
- `images/` holds the app screenshots the page shows, taken from the app
  app on sample data (four semesters, made-up friends). The Mac shots are the
  window itself at 1360×850 points, captured with its transparent corners
  (`screencapture -o -l <window id>`), so the page's drop shadow follows
  them; `mac-edit` is the Edit sheet cut out of such a window. iPhone and
  iPad shots are only scaled down, and the page draws their bezels. All are WebP (`cwebp -q 86`).
  In dark mode the hero and Progress section swap to the dark shots
  (`<picture>` with `prefers-color-scheme`).
- `images/og-preview.jpg` is the link preview chats and social sites show:
  1200 × 630, the shape they crop to. It is a small HTML card, the app icon,
  the hero's headline and "Lectio · Free for Mac, iPhone and iPad" on the
  left and `iphone-semester.webp` in the page's bezel on the right, rendered
  at 2× in a browser and scaled down to a JPEG (quality 88). Keep it under
  300 KB, which WhatsApp needs for a large preview. Apps cache a preview by
  the image's address, so a redrawn one gets a new file name, and the
  `og:image` tag in `index.html` follows it.
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
- The `apple-itunes-app` meta tag in `index.html` gives Safari on iPhone and
  iPad its Smart App Banner: Get, or Open where Lectio is installed. It names
  the listing's id, `6799411764`.
- `.nojekyll` makes Pages serve the files exactly as committed.
