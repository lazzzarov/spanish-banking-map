# Spain Banking Map

A static, bilingual (EN/ES) genealogy of Spanish banking consolidation from 1920 to 2026.

This is a **curated consolidation genealogy**, not the Banco de España register and not a list of every Spanish bank. Featured destination groups: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank, Abanca.

Also on the map as **surviving heads only** (no invented family trees): Caixa Ontinyent, Colonya–Caixa Pollença, Cajamar, Grupo Caja Rural, Banca March, Caja Almendralejo, Banca Pueyo, Arquia Banca.

## What the data can and cannot say

- It supports **who absorbed whom**, by mechanism (SIP, merger, absorption, banking-business transfer, resolution, resolution sale, rebrand, acquisition, intervention, minority stake, failed bid, asset transfer, divestment).
- The explorer **view** changes what you see: business continuity, ownership, assets, or historical context.
- Only completed events that transfer control or banking-business continuity change `current_group`. BPCE’s stake and BBVA’s 2025 bid never reparent Sabadell.
- Headquarters are historical origin points, not branch coverage.
- `/stats` keeps each figure with its compiler. Do not stitch series or compute concentration from node counts.

## Site

- `/` — intro, then map with year-accurate dots, left bank rail, history panel, stories strip (`?entity=&year=&lang=&guide=`)
- `/stats` — selected official figures with “why it matters” copy
- `/sources` and `/about`

Light theme is the default. Dark remains a header toggle.

## Run locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:4321/`). Production builds on GitHub Actions use `base: /spanish-banking-map` for [project Pages](https://lazzzarov.github.io/spanish-banking-map/); do not rely on old preview servers still running on other ports.

```bash
npm test
npm run validate
npm run build
npm run preview
```

Preview serves the production build from `dist/` (same static files you would host anywhere).

## Deploy (static hosting)

`npm run build` writes a **fully static** site to `dist/`. No Node.js is required on the server—only a static file host (GitHub Pages, Netlify, S3, etc.).

### GitHub Pages (this repo)

1. Push to `main` on GitHub.
2. In the repository **Settings → Pages**, set source to **GitHub Actions**.
3. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs tests, validates data, builds, and deploys.
4. Public URL (after first successful deploy): `https://lazzzarov.github.io/spanish-banking-map/`

To make the repository public (required for free Pages on personal accounts unless you use GitHub Pro):

```bash
gh repo edit lazzzarov/spanish-banking-map --visibility public --accept-visibility-change-consequences
```

See [SECURITY.md](SECURITY.md) before publishing.

## Data

- `data/banks.json` — canonical entities and events
- `data/sources.json` — source keys and URLs
- `data/historical_context.json` — dated context markers
- `data/stats.json` — selected official observations and series insights
- `data/regions.geojson` — simplified CCAA shapes

`current_group` is computed in the client from completed lineage events only.

## Trademarks

UI logos use optional files in `public/logos/{id}.svg` or generated monograms. Do not commit scraped trademark wordmarks without rights.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
