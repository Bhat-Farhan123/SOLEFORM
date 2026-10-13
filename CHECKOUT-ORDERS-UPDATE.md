# SOLEFORM checkout and order management update

## What's included
- Checkout submits with `preventDefault`, shows an in-page order-success dialog, and keeps the shopper in the app rather than navigating/reloading.
- On successful order creation, the order is saved to `localStorage` as `soleform-order-history` and the cart is cleared.
- An Order history link is available in the storefront footer and the success dialog. It displays saved order IDs, dates, items, sizes, quantities, totals, and statuses on this browser.
- Admin dashboard has an Orders view with customer/shipping details, line items, totals, and status changes.
- Backend exposes password-protected `GET /api/admin/orders` and `PATCH /api/admin/orders/{order_id}` endpoints.
- New orders have UTC `created_at` timestamps and start at `received` status.
- Catalog products use distinct image paths; additional catalog entries have separate colorway image assets rather than all pointing at the same source image.

## Run locally
From the project root:

```powershell
npm install
py -m pip install -r backend/requirements.txt
```

Ensure `backend/.env` exists and contains `SOLEFORM_ADMIN_PASSWORD`.

Terminal 1:

```powershell
npm run api
```

Terminal 2:

```powershell
npm run dev
```

## Important limits before public launch
- Checkout is still cash-on-delivery demo only; there is no payment gateway.
- Customer order history is browser-local (`localStorage`) and is not a secure cross-device customer account history. A production customer account/order lookup is needed.
- Orders/products/uploads are stored in local files. A deployed host must provide persistent disk or replace this with persistent storage/database/object storage.
- Colorway image assets are distinct catalog files derived from existing transparent product imagery; they improve image-path uniqueness and visual variety, but are not a substitute for professionally photographed, physically distinct shoe models.
