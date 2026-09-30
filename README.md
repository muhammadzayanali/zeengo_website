# aLo Russia · ZEEN — Customer website

Production-oriented **responsive React** app for the client prototype (v4.2.0).

## Run

```bash
cd Website_frontend
npm install
npm run dev
```

→ http://127.0.0.1:5174/

API bases in `.env`: `VITE_API_BASE_URL_LOCAL` (dev) and `VITE_API_BASE_URL_PRODUCTION` (build).

## What changed vs the HTML demo

| Before | After |
|--------|--------|
| Phone / iOS bezel on desktop | **Removed** — full-width website |
| Fake status bar / island | **Removed** |
| Single HTML SPA as `/` | React + Vite + Tailwind + Router |
| Local seed only | **`GET /api/v1/client/v2/*`** for home/places |

Prototype HTML kept for reference: `public/reference/alo-russia-v4.2.0.html`

## Phase 1 shipped

- AppShell: desktop header nav + mobile bottom tabs (Home / Stays / Things to do / Plan)
- Home (API), Places (+ detail), Stays/Acts hubs, Plan, Money (FX gap documented), Search, Train/Cars WhatsApp hubs
- Loading / empty / error states on API pages
- Jola tokens (forest / mint / ivory / IBM Plex)

## Docs

See **[AUDIT.md](./AUDIT.md)** for full gap analysis and phased plan.

## Build

```bash
npm run build
npm run preview
```
