# EventGudang — PRD

## Original Problem Statement
Web-based, desktop-first inventory management app for event equipment (sound, lighting, rigging) and merchandise. Migration of an existing Expo mobile app to a browser app for office PCs. Stack: FastAPI + MongoDB backend, React (CRA/craco) + Tailwind + shadcn frontend. Indonesian UI. JWT auth (admin/staff). Sidebar layout.

## Architecture
- Backend: `/app/backend/server.py` (monolithic FastAPI, all routes under `/api`). MongoDB via MONGO_URL/DB_NAME. UUID string `id` fields, `_id` excluded from responses.
- Auth: JWT Bearer token (HS256, 7-day exp) stored in localStorage; sent as `Authorization: Bearer`. bcrypt hashing. Admin+staff seeded from ENV on startup (idempotent, re-hashes on password change). Demo data (warehouses/brands/categories/11 items) seeded once.
- Frontend: `src/App.js` router, `context/AuthContext.jsx`, `lib/api.js` (axios + interceptors), `components/Layout.jsx` (collapsible sidebar + header), pages under `src/pages/`.
- Design: Swiss/high-contrast light theme, brand blue #002FA7, Cabinet Grotesk + IBM Plex Sans/Mono, grid-border cards, sonner toasts top-right.

## User Personas
- **Admin** (indra.suhardiman@gmail.com): full access — items CRUD, master data, users, Excel export.
- **Staff** (staff@eventgudang.com): read inventory, create Surat Jalan & Penerimaan, process returns. No master data, no item CRUD, no export.

## Core Requirements (static)
JWT auth 2 roles · Dashboard KPIs · Inventory (filters/search/photo/export) · Surat Jalan (create/QR/PDF/return) · Penerimaan (existing+new item modes) · Master Data (warehouses/brands-with-color/categories/users) · Profile.

## Implemented (2026-06)
- [x] JWT login, role-based guards, ENV seeding — tested
- [x] Dashboard: 10 KPI cards + recent SJ + quick actions — tested
- [x] Inventory: table, brand-colored chips, warehouse/brand/category filters, search, add/edit/delete, base64 photo upload, xlsx export — tested
- [x] Item detail with stats + edit — tested
- [x] Surat Jalan: list (Aktif/Selesai tabs), create (warehouse+item picker, stock deduction, SJ-YYYYMM-#### number, qr_token), detail (on-screen QR SVG, Print PDF via window.print, by-token lookup, QR scan via BarcodeDetector + manual fallback) — tested
- [x] Return flow: Baik/Rusak/Hilang/Terpakai math + status out→partial→returned — tested
- [x] Penerimaan: list (N BARU badge), create (existing + new item modes), detail — tested
- [x] Master Data CRUD: warehouses, brands (11-color palette + hex + live preview, delete-guard), categories, users — tested
- [x] Profile with admin links + logout — tested

## Backlog / Remaining
- P1: Swap native date inputs for shadcn Calendar popover (design consistency).
- P2: Atomic counter for SJ/PBK numbering (avoid concurrency race).
- P2: Pagination on list endpoints for scale.
- P2: Split server.py into resource routers.
- P2: Deploy to permanent *.emergent.host URL.

## Next Tasks
Await user feedback; polish date pickers; deploy.
