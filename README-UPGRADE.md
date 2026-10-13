# SOLEFORM upgrade notes

## Run locally

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `py -m pip install -r backend/requirements.txt`
3. Copy `backend/.env.example` to `backend/.env` and set a strong `SOLEFORM_ADMIN_PASSWORD`.
4. Start API in terminal 1: `npm run api`
5. Start Vite in terminal 2: `npm run dev`

## Changes in this update

- Removed the duplicate `Form Runner 01` catalog record while preserving its uploaded product photo on the canonical entry.
- Normalized the starter catalog to 29 unique product names; backend startup now fills in any missing starter entries by name rather than duplicating them.
- Added navigation for Suede, Everyday, and High-top collections, plus collection tabs for High-top and Limited edition.
- Improved collection product photography sizing, hover behavior, small-screen collection layouts, and mobile gallery thumbnails.
- Added a related-products area in the product details modal and clearer per-size stock/sold-out copy.
- Fixed the `.env.example` line endings and removed the insecure hardcoded admin-password fallback: the backend now requires a configured password.

## Notes

The catalog has unique product records, but the project currently contains a limited set of distinct sneaker photo assets. Some starter entries still point to existing local photos until individual images are uploaded for them through the admin dashboard. This is a local JSON/file-storage demo, not production-ready multi-user hosting; use persistent storage and a proper authentication/session design before public deployment.
