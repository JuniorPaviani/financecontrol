#!/usr/bin/env bash
set -e

echo "=== FinanceControl Build ==="

# 1. Install backend deps
echo "[1/4] Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# 2. Install Node.js and frontend deps
echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install

# 3. Build frontend (set API URL for production)
echo "[3/4] Building frontend..."
export VITE_API_URL=/api
npm run build
cd ..

# 4. Copy frontend build to backend/static
echo "[4/4] Copying frontend to backend/static..."
rm -rf backend/static
cp -r frontend/dist backend/static

echo "=== Build complete ==="
