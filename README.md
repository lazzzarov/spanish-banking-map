# Spain Banking Map

A static, bilingual (EN/ES) genealogy of Spanish banking consolidation: the 2010–2012 caja restructuring and the bank-level deals around it, through 2026.

This is a **curated consolidation genealogy**, not the Banco de España register and not a list of every surviving Spanish bank. Featured destination groups in the file: CaixaBank, Santander, BBVA, Sabadell, Unicaja, Ibercaja, Kutxabank, Abanca.

The dataset has **56 entities** and **50 events**. Those are the real counts. We do not force 55 / 48.

## What the data can and cannot say

- It supports **who absorbed whom**, by **mechanism** (SIP, merger, absorption, activity transfer, resolution, rebrand, minority stake, failed bid).
- A minority stake and a failed bid **never** change `current_group`. BPCE’s ~7% of Sabadell is not control. BBVA’s 2025 offer is a lapsed bid.
- It does **not** support market share, assets, deposits, or branch coverage.

Known gaps versus the official 2009–2021 Banco de España chart include Banco Pastor, CajaSur, Caja Jaén, Caja Castilla-La Mancha and Banco de Valencia.

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

## Data

- `data/banks.json` — canonical entities and events
- `data/sources.json` — source keys and URLs
- `data/regions.geojson` — simplified CCAA shapes (approximate headquarters, not branch maps)
- `data/raw/banks.tuples.json` — original tuple paste, kept so migration cannot drop a row

`current_group` is computed in the client from completed lineage events only. It is not stored in JSON.
