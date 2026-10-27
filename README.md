# Spain Banking Map

A static, bilingual (EN/ES) genealogy of Spanish banking consolidation: the 2010–2012 caja restructuring and the bank-level deals around it, through 2026.

This is a **curated consolidation genealogy**, not the Banco de España register and not a list of every surviving Spanish bank. Featured destination groups: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank, Abanca. Cooperative groups such as Cajamar are out of scope.

The dataset has **101 entities** and **109 events** (`data/banks.json` version 0.3, as of 2026-10-27). Those are the real counts.

## What the data can and cannot say

- It supports **who absorbed whom**, by **mechanism** (SIP, merger, absorption, banking-business transfer, resolution, resolution sale, rebrand, acquisition, intervention, minority stake, failed bid, asset transfer, divestment).
- Only completed events that transfer control or banking-business continuity change `current_group`. A minority stake and a failed bid never do. BPCE’s ~7% of Sabadell is not control. BBVA’s 2025 offer is a lapsed bid. The 2026 TSB sale is an outbound divestment from Sabadell’s UK subsidiary.
- Legal status and banking-business continuity are stored apart. Intermediate vehicles (BFA, Banco CAM, Catalunya Banc, NCG Banco, Banco CEISS, and others) stay on the path.
- Caixa Ontinyent and Colonya–Caixa Pollença remain as independent traditional cajas.
- Headquarters on the map are historical origin points, not branch coverage.
- The `/stats` page shows sourced observations (cajas, branches, employment, FROB). Do not stitch compilers into one series, and do not compute concentration from node counts.

Rows still tagged `check` are shown as unverified. Verify them before citing.

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

## Site

- `/` — explorer: CCAA map, genealogy tree, timeline, deep links (`?entity=&year=&lang=`)
- `/stories` — guided EN/ES narratives
- `/stats` — selected official figures with definitions
- `/sources` — source keys and verification status
- `/about` — scope and lineage rules

## Data

- `data/banks.json` — canonical entities and events
- `data/sources.json` — source keys and URLs
- `data/historical_context.json` — dated context markers (laws, crises, policy)
- `data/stats.json` — selected official observations
- `data/regions.geojson` — simplified CCAA shapes (headquarters, not branch maps)
- `data/raw/banks.tuples.json` — original tuple paste

`current_group` is computed in the client from completed lineage events only. It is not stored in JSON.
