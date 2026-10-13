# SOLEFORM --- Premium Sneaker Store

SOLEFORM is a premium sneaker storefront built with **React, Vite,
Tailwind CSS, Three.js / React Three Fiber, and FastAPI**. It includes a
product catalog, product details, cart and checkout, customer order
history, and a local admin dashboard for managing products and orders.

This repository is configured as a **local development project**. The
FastAPI backend stores product and order data in JSON files on the
machine running the backend. It is not a production-ready payment or
hosting setup.

## Features

### Customer storefront

-   Browse sneaker products and collections.
-   Search, filter, and sort products.
-   View product details, images, available UK sizes, and stock.
-   Add items to the cart and wishlist.
-   Place a demo order through the FastAPI backend.
-   View order history using the email address entered at checkout.
-   View order status and request deletion of order history for that
    email.
-   Interactive 3D sneaker viewer with drag-to-rotate controls and reset
    view.

### Admin dashboard

Open `/admin` in the local website. - Log in with the configured admin
password. - Add, edit, and delete products. - Upload product images. -
Configure product details, UK sizes, and stock. - View orders and update
their status. - Clear all orders from the admin order list.

### Storage

-   Product catalog: `backend/data/products.json`
-   Order history: `backend/data/orders.json`
-   Uploaded product images: `public/uploads/`
-   3D model: `public/models/sneaker.glb`

Order data is stored by the backend rather than relying only on browser
storage. Existing legacy browser order history may be imported when the
customer order-history feature runs.

## Tech stack

-   **Frontend:** React 18, Vite, Tailwind CSS v4
-   **3D:** Three.js, `@react-three/fiber`, `@react-three/drei`
-   **Icons:** Lucide React
-   **Backend:** Python, FastAPI, Uvicorn
-   **Persistence:** Local JSON files

## Requirements

Install these first:

-   Node.js 18 or newer (Node.js 20 LTS recommended)
-   Python 3.10 or newer
-   npm (included with Node.js)

Commands below are for **Windows PowerShell**.

## Project structure

``` text
soleform-store-next/
├── backend/
│   ├── data/
│   │   ├── products.json       # Product catalog
│   │   └── orders.json         # Order history (created/updated by API)
│   ├── main.py                 # FastAPI app and API endpoints
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Example backend environment settings, if present
├── public/
│   ├── models/
│   │   └── sneaker.glb         # 3D sneaker model
│   ├── images/                 # Storefront image assets
│   └── uploads/                # Images uploaded from Admin
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Store navigation
│   │   ├── ProductCard.jsx     # Product cards
│   │   └── Sneaker3D.jsx       # Interactive 3D sneaker viewer
│   ├── App.jsx                 # Main storefront, cart, checkout, history
│   ├── AdminApp.jsx            # Admin dashboard
│   ├── main.jsx                # Frontend entry point
│   ├── styles.css              # Storefront styling
│   └── admin.css               # Admin styling
├── index.html
├── package.json                # Frontend scripts and dependencies
├── package-lock.json
├── vite.config.js               # Vite config and development watcher
├── .gitignore
└── README.md
```

Some generated or optional files may not exist until the app has been
run or an image has been uploaded.

## Setup

### 1. Open the project folder

Open the folder that contains `package.json`, `vite.config.js`, `src/`,
and `backend/` in VS Code.

### 2. Install frontend dependencies

Open **Terminal 1** in the project root:

``` powershell
npm install
```

Keep this terminal in the project root.

### 3. Create and activate a Python virtual environment

In **Terminal 1**, from the project root:

``` powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can continue using `python -m pip`
commands from your selected Python interpreter, or use Command Prompt
activation with `.venv\Scripts\activate.bat`.

### 4. Install backend dependencies

Still from the **project root**, run:

``` powershell
python -m pip install -r backend/requirements.txt
```

The requirements file is inside `backend/`, so the command above
deliberately includes that folder in the path.

## Configure the admin password

The backend supports `SOLEFORM_ADMIN_PASSWORD`. Set a strong password
before using the admin dashboard.

In PowerShell, in the same terminal that will run the backend:

``` powershell
$env:SOLEFORM_ADMIN_PASSWORD = "replace-this-with-a-strong-password"
```

This setting applies only to that terminal session. If the project uses
`backend/.env`, create it from `backend/.env.example` if that example
exists, and put the password there. Never commit `.env` files or real
passwords to GitHub.

## Run the app --- use two terminals

Both terminals should start in the **project root**, the folder
containing `package.json`.

### Terminal 1 --- FastAPI backend

Activate the virtual environment if you have not already:

``` powershell
.\.venv\Scripts\Activate.ps1
```

Start the API:

``` powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Leave this terminal running. The backend API is available at:

-   API base: `http://127.0.0.1:8000`
-   Health check: `http://127.0.0.1:8000/api/health`
-   Interactive API docs: `http://127.0.0.1:8000/docs`

### Terminal 2 --- React/Vite frontend

Open a second terminal in VS Code. Make sure its current directory is
the project root, then run:

``` powershell
npm run dev
```

Open the local URL printed by Vite. This project commonly uses:

-   Storefront: `http://localhost:3000`
-   Admin dashboard: `http://localhost:3000/admin`

If Vite prints a different port because port 3000 is already in use, use
the URL shown in the terminal.

## Useful commands

Run these from the project root.

``` powershell
# Start the frontend
npm run dev

# Build the frontend for production checks
npm run build

# Preview a production build
npm run preview

# Start the backend (same as the API script)
npm run api

# Start the backend explicitly
python -m uvicorn backend.main:app --reload --port 8000
```

Stop a running server with `Ctrl + C` in its terminal.

## How the website works

1.  The browser loads the React storefront from Vite.
2.  The frontend requests the product catalog from the FastAPI API.
3.  FastAPI reads and writes catalog and order data in the backend JSON
    files.
4.  When a customer places an order, the frontend sends a request to
    `POST /api/orders`.
5.  The backend validates the order, calculates the order total using
    server-side product data, updates stock, and saves the order.
6.  The storefront and Admin dashboard can read order records from the
    backend, so they share the same local order data.
7.  The 3D viewer loads `/models/sneaker.glb` from the local
    `public/models/` directory. The scene uses local lights and does not
    require the remote studio HDR environment.

## API endpoint overview

The backend currently includes routes for: - `GET /api/health` --- API
health check - `GET /api/products` --- list products -
`POST /api/orders` --- create an order -
`POST /api/orders/import-history` --- import legacy customer order
history - `GET /api/orders/history?email=...` --- retrieve orders for a
customer email - `DELETE /api/orders/history?email=...` --- delete
orders associated with a customer email - `POST /api/orders/lookup` ---
look up an order - `GET /api/admin/orders` --- list orders for Admin -
`DELETE /api/admin/orders` --- clear all orders (requires admin
authorization) - `PATCH /api/admin/orders/{order_id}` --- update an
order status (requires admin authorization) - `/api/admin/products...`
--- admin product management routes - `/api/admin/upload` --- upload
product images

See `http://127.0.0.1:8000/docs` while the backend is running for the
exact schemas and responses.

## Important notes and limitations

-   **Local storage only:** JSON files are stored on the computer
    running FastAPI. If the backend is deployed to an ephemeral host,
    data may be lost on redeploy unless persistent storage is
    configured.
-   **No real payment processing:** checkout is a demo order flow; it
    does not charge cards or process a payment gateway.
-   **Security:** do not expose the local API directly to the public
    internet. Before production, implement proper authentication,
    authorization, HTTPS, validation, rate limiting, and backups.
-   **Order history deletion:** customer-side history clearing is based
    on the email supplied by the customer in this local demo. This is
    not strong identity verification and must be replaced with
    authenticated customer accounts before production.
-   **Customer data:** do not commit real customer orders or secrets.
    Keep `backend/.env`, virtual environments, `node_modules`, build
    output, and private order data out of Git.
-   **3D assets:** `public/models/sneaker.glb` must exist for the 3D
    model to load.

## Before pushing to GitHub

Review staged files carefully:

``` powershell
git status
git add .
git status
```

Make sure `.env` files, passwords, `node_modules/`, `.venv/`, build
output, and private customer order records are not staged. Then commit
and push your changes.

------------------------------------------------------------------------

**SOLEFORM --- OWN YOUR GROUND.**
What you can do from now on
Whenever you make changes to SOLEFORM and want to save them on GitHub, run:
git add .
git commit -m "Describe your changes"
git push
