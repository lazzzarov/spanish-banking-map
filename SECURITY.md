# Security

## Reporting

If you find a security issue, open a private report on GitHub or email the repository owner. Do not file public issues for undisclosed vulnerabilities.

## Scope

This project is a **static site**: JSON data, Astro build output, and client-side React. There is no server, database, authentication, or user-upload path in the deployed app.

## Deployed site

Public static hosting (no login): **https://lazzzarov.github.io/spanish-banking-map/**

## Before publishing

- No `.env`, API keys, tokens, or credentials in the tree (last pre-publish grep: no matches in tracked source; dependency advisories tracked via `npm audit`).
- `data/` contains only curated public URLs and institution metadata.
- No scrapers, news ingest, or automated logo download in the repository (trademark risk and supply-chain surface).
- Bank logos use optional local files or generated monograms only.

## Dependencies

Run `npm audit` after `npm install` and update dependencies periodically. CI builds with `npm run build` and `npm test` on push.
