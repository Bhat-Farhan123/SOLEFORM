# SOLEFORM deployment readiness

## Local development
- Frontend: `npm install` then `npm run dev`
- Backend: `py -m pip install -r backend/requirements.txt` then `npm run api`
- Configure `backend/.env` using `backend/.env.example`; never commit `.env`.

## Included improvements
- Sneaker hero now displays a static image immediately while the lazily-loaded WebGL scene and GLB load.
- The GLB's embedded textures have been resized/re-encoded to reduce first-load download size; Drei keeps the model in memory and the service worker caches it after the first successful fetch in production.
- Cart state persists in the browser across refreshes.
- Checkout sends validated order data to FastAPI and persists demo orders to `backend/data/orders.json`.

## Important before public launch
This is still a local-file prototype, not a production commerce backend. `backend/data/products.json`, `backend/data/orders.json`, and `public/uploads/` require a persistent disk and backups. Many serverless hosts use ephemeral filesystems; on those platforms move product/order data and uploads to a managed database/object store. Add real admin session/token authentication, rate limiting, HTTPS, secure cookie/session handling, CSRF protection where applicable, image content sniffing, and deployment-specific CORS before public use. Checkout currently records a demo cash-on-delivery order and does not collect payment. Connect a payment provider and order notification/shipping workflow before accepting real orders.

## Hosting notes
- Build frontend: `npm run build`.
- Deploy frontend static output from `dist/`.
- Deploy FastAPI separately and set `VITE_API_BASE_URL` at frontend build time to the HTTPS backend URL. Update CORS allowlist to the actual storefront origin.
- Configure cache headers for `/models/sneaker.glb` and hashed static assets. The included service worker caches the model on the first successful fetch for subsequent visits.
