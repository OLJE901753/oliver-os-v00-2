# Frontend Startup Guide

## Quick Start

To see the frontend in your browser, you need to start both the backend and frontend servers:

### Option 1: Start Everything at Once (Recommended)
```bash
cd oliver-os
pnpm dev:full
```

This will start:
- Backend API server on http://localhost:3000
- Frontend dev server on http://localhost:5173

The browser should automatically open to http://localhost:5173

### Option 2: Start Separately

**Terminal 1 - Backend:**
```bash
cd oliver-os
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd oliver-os/frontend
pnpm start
```

Then open http://localhost:5173 in your browser.

## Ports

- **Frontend:** http://localhost:5173 (Vite dev server)
- **Backend API:** http://localhost:3000 (Express server)
- **WebSocket:** ws://localhost:3000/ws/{client_id}

## API Proxy

The frontend is configured to proxy API requests:
- `/api/*` → `http://localhost:3000/api/*`
- `/ws/*` → `ws://localhost:3000/ws/*`

This means you can make requests to `/api/health` in your frontend code and it will automatically route to the backend.

## Troubleshooting

### Port Already in Use

If you get an error about port 3000 or 5173 being in use:

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Frontend Shows 404

Make sure:
1. Backend is running on port 3000
2. Frontend is running on port 5173 (NOT 3000)
3. You're accessing http://localhost:5173 (not 3000)

### Cannot Connect to Backend

Check:
1. Backend is running: http://localhost:3000/health should return JSON
2. No firewall blocking localhost connections
3. Vite proxy is configured correctly in `frontend/vite.config.ts`
