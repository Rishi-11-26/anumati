# Anumati — Faculty Leave Management System (FLMS)

This repository contains a Flask-based backend and a React frontend for managing faculty leave workflows.

## Project structure

- `app/` - backend API code, database models, and auth logic
- `frontend/` - React application source, public assets, and build output
- `run_server.py` - backend entrypoint for deployment
- `requirements.txt` - Python dependencies
- `init_db.py` - database initialization helper

This folder has been cleaned to use the React app as the frontend, removing older Flask template-based pages and helper scripts.

## Backend

The backend is implemented in `app/` using a small `Antigravity` wrapper around Flask, with SQLAlchemy for database access.

### Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Initialize the database

```powershell
python init_db.py
```

### Run backend locally

```powershell
set PORT=8000
set FLASK_DEBUG=1
python run_server.py
```

The backend now binds to `0.0.0.0` and honors the `PORT` environment variable for deployment.

## Frontend

The React frontend lives in `frontend/`. It uses relative `/api` paths for backend requests and a Vite dev proxy during local development.

### Install frontend dependencies

```powershell
cd frontend
npm install
```

### Run frontend in development mode

```powershell
npm run dev
```

This starts the Vite dev server and proxies `/api` requests to the backend at `http://127.0.0.1:8000`.

### Build frontend for production

```powershell
cd frontend
npm run build
```

The build output will be generated in `frontend/dist`.

### Serve the built React app with the backend

After building the frontend, run the backend and it will serve the React SPA directly from `frontend/dist`:

```powershell
python run_server.py
```

Then open `http://127.0.0.1:8000` in your browser.

## Deployment notes

- For local development, run the backend on `http://127.0.0.1:8000` and the frontend dev server with `npm run dev`.
- For deployment, build the frontend with `npm run build`, then start the backend with the built `frontend/dist` files available.
- The backend now serves the built React SPA from `frontend/dist`, so the app can be deployed as a single backend service.

## Notes

- Leave history older than the current academic year is automatically cleaned up by the backend.

- The React frontend now uses relative `/api` URLs, making it deploy-ready for same-origin hosting.
- The backend now reads the `PORT` environment variable and supports `FLASK_DEBUG` for development.
