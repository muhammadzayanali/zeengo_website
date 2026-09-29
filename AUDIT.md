# aLo Russia · ZEEN — Implementation audit

Source of truth: client HTML prototype `public/alo-russia.html` (v4.2.0).  
Date: 2026-09-28.

---

## 1. Existing frontend structure

| App | Role |
|-----|------|
| `/frontend` | ZeenOps **admin** + thin `/client` trip portal (staff JWT / ZN login). Do **not** break. |
| `/Website_frontend` | Customer website target. Today: Vite wrapper; `/` still serves the HTML demo (includes phone frame). |

**Workspace note:** `.cursor/rules/zeenops-global.mdc` says UI only in `/frontend`. Customer site stays in `Website_frontend` per product request; rule should be amended later to allow a public marketing app.

---

## 2. Client HTML prototype structure

- SPA inside `#zzios` → `#zzview`, bottom tabs `#zztab`.
- **Tabs:** Home · Stays · Things to do · Plan (Deals tab CSS-hidden).
- **~46 baked shells** + **~47 live routes** (hotel/room/pay/trip/fx/train/cars/food/places/…).
- **Local seed DB** in prototype (hotels, rooms, experiences, FX, trains, …).
- **Visual system (Jola):** forest `#12372A`, emerald `#1F6B4F`, mint `#DDEDE5`, ivory `#FAF9F5`, champagne `#C7A96B`, IBM Plex Sans Arabic.

---

## 3. Current matching pages/components

| Prototype | Today |
|-----------|--------|
| Full aLo UX | Only inside `alo-russia.html` |
| React screens | None (placeholder `/react`) |
| Admin | Unrelated Ops UI in `/frontend` |
| Client portal v1 | `/frontend` `/client/*` — trip after ZN login, not marketing site |

---

## 4. Missing pages/components (to build)

Responsive React: AppShell (desktop header + mobile bottom nav), Home, Stays, Activities, Plan/Trip, Money/FX, Places, Food, Trains, Cars, Search, Place detail, Hotel/room flows, booking/request, loading/empty/error states. Shared: Search, Chips, Cards, Buttons, Forms.

---

## 5. Existing APIs to reuse

| API | Auth | Use |
|-----|------|-----|
| `GET /api/v1/client/v2/home` | Public | Home rails/chips |
| `GET /api/v1/client/v2/places` | Public | Around / places |
| `GET /api/v1/client/v2/places/:id` | Public | Place detail |
| `GET /api/v1/client/v2/destinations` | Public | Destinations |
| `GET /api/v1/client/v2/trip` | Public | Sample trip template |
| `POST /api/v1/auth/client/*` | Public | Register / ZN login |
| `GET /api/v1/client/*` | Client JWT | Post-booking portal |

---

## 6. Missing APIs

| Need | Status |
|------|--------|
| Public package list/detail | Missing (packages need client JWT) |
| Public hotel/vendor catalog | Missing (vendors staff-only) |
| Room types / availability | No model |
| FX / CBR rates | No API (prototype uses live CBR client-side) |
| Lead / WhatsApp inquiry endpoint | Missing (can keep `wa.me` like prototype) |
| CMS CRUD for Discovery* | Seed only |

---

## 7. Database entities to reuse

`DiscoveryPlace`, `DiscoveryChip`, `DiscoveryDestination`, `DiscoveryTripDay/Stop`, `Package`, `Vendor` (+ types hotel/restaurant/activity/guide/driver), `Booking`/`Client` for authenticated trip — **no new parallel DB**.

---

## 8. Data mismatch

Prototype ships **rich local seed** (118 acts, hotel rooms, FX, trains). PostgreSQL has **Discovery\*** for marketing and **Vendor/Package** for ops — shapes differ. Map UI to Discovery + document where prototype-only data needs public Vendor/Package APIs or curated Discovery content.

---

## 9. Responsive problems (current)

- Desktop = phone frame (`#zzstage` / `#zzdev` / `--sc`).
- Fake status bar / island / home indicator.
- Padding-top ~54px for fake status bar.
- No real multi-column desktop layout.

---

## 10. Phone-frame to remove

`#zzstage`, `#zzframe`, `#zzdev`, `.zzisland`, `#zzsb`, `.zzhb`, `#zzcap`, `fit()` / `--sc`, desktop letterbox backgrounds. **Keep** product UI concepts (tabs, cards, chips, search) — not the bezel.

---

## 11. Recommended plan

| Phase | Scope |
|-------|--------|
| **1** | React app root (no HTML demo as `/`). Theme + AppShell. Routes. Home ← `client/v2/home`. |
| **2** | Places / around / detail ← `client/v2`. Stays & Acts UI with Discovery/Vendor mapping. |
| **3** | Plan/trip ← `client/v2/trip` + local trip bag. Money/FX (CBR client until API). |
| **4** | Trains/cars/request → WhatsApp handoff (parity). Public package API if needed. |
| **5** | Polish: a11y, empty/error, TS/build, remove demo HTML from prod entry. |

**Guardrail:** No changes to `/frontend` Ops modules or staff APIs unless adding small **public** read endpoints under `client/v2` or `packages`.
