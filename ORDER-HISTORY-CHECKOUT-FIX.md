# SOLEFORM order history and checkout fix

## What changed

- New checkout orders are written by FastAPI to `backend/data/orders.json` and are no longer saved to browser `localStorage` as the source of truth.
- Existing browser-only history under `soleform-order-history` is migrated into the backend JSON file when the storefront or admin loads. Import is deduplicated by order ID.
- Customer order history is loaded from the backend using the checkout email.
- Customers can clear the orders associated with their checkout email. This deletes those records from the shared backend history, so they disappear from Admin Orders too.
- Admin Orders has a **Clear All History** control protected by the admin password.
- Checkout's Place Order button is `type="button"` and calls the API directly after form validation. The form's capture handler also prevents native navigation, including Enter-key submissions.
- A successful order confirmation remains open for 8 seconds, unless the customer closes it manually with the X. The confirmation is rendered independently from the checkout screen.
- `Sneaker3D.jsx` does not reload or navigate the page. Its model-ready callback was stabilized. Development startup also unregisters an old local service worker to avoid stale cached app assets.

## Local setup

1. Create `backend/.env` by copying `backend/.env.example` and set a private `SOLEFORM_ADMIN_PASSWORD`.
2. Backend (from the project root, with your Python virtual environment activated):

   ```powershell
   pip install -r backend/requirements.txt
   python -m uvicorn backend.main:app --reload --port 8000
   ```

3. Frontend in a second terminal:

   ```powershell
   npm install
   npm run dev
   ```

4. Open the Vite URL shown in the terminal. The order file is `backend/data/orders.json`.

## Important demo note

The customer clear-history endpoint uses the checkout email to select records; it is a local demo feature, not account-grade identity verification. Do not expose this demo API publicly without adding authenticated customer accounts and authorization.
