# Spain Banking Map

A static, bilingual (EN/ES) genealogy of Spanish banking consolidation from 1920 to 2026.

This is a **curated consolidation genealogy**, not the Banco de España register and not a list of every Spanish bank. Featured destination groups: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank, Abanca.

Also on the map as **surviving heads only** (no invented family trees): Caixa Ontinyent, Colonya–Caixa Pollença, Cajamar, Grupo Caja Rural, Banca March, Caja Almendralejo, Banca Pueyo, Arquia Banca.

## What the data can and cannot say

- It supports **who absorbed whom**, by mechanism (SIP, merger, absorption, banking-business transfer, resolution, resolution sale, rebrand, acquisition, intervention, minority stake, failed bid, asset transfer, divestment).
- The explorer **layer** changes what you see: business continuity, ownership, assets, or historical context.
- Only completed events that transfer control or banking-business continuity change `current_group`. BPCE’s stake and BBVA’s 2025 bid never reparent Sabadell.
- Headquarters are historical origin points, not branch coverage.
- `/stats` keeps each figure with its compiler. Do not stitch series or compute concentration from node counts.

## Site

- `/` — explorer: autoplaying timeline, map with year arcs, bank-history panel, deep links (`?entity=&year=&lang=&guide=`)
- Stories open as a **guide** over the explorer (`/?guides=1` or `/?guide=bankia-seven-cajas`)
- `/stats` — selected official figures
- `/sources` and `/about`

Light theme is the default (Dalatea blue on paper). Dark remains a header toggle.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm test
npm run validate
npm run build
```

## Data

- `data/banks.json` — canonical entities and events
- `data/sources.json` — source keys and URLs
- `data/historical_context.json` — dated context markers
- `data/stats.json` — selected official observations
- `data/regions.geojson` — simplified CCAA shapes

`current_group` is computed in the client from completed lineage events only.
