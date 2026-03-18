#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-build.sh  —  My Drive local build script for Hostinger shared hosting
#
# Run this on your LOCAL machine every time you want to build for production.
# After running, upload the backend/ folder to Hostinger via FTP or File Manager.
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately on any error

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
PUBLIC_DIR="$BACKEND_DIR/public"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           My Drive — Production Build Script             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Install frontend dependencies ─────────────────────────────────────
echo "▶ [1/6] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install
echo "   ✓ Done"

# ── Step 2: Build React frontend ──────────────────────────────────────────────
echo ""
echo "▶ [2/6] Building React frontend..."
npm run build
echo "   ✓ Done"

# ── Step 3: Copy frontend build to backend/public/ ────────────────────────────
echo ""
echo "▶ [3/6] Copying frontend build → backend/public/ ..."
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"
cp -r "$FRONTEND_DIR/dist/." "$PUBLIC_DIR/"
echo "   ✓ Done  ($(ls "$PUBLIC_DIR" | wc -l | tr -d ' ') items copied)"

# ── Step 4: Install backend dependencies ──────────────────────────────────────
echo ""
echo "▶ [4/6] Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install
echo "   ✓ Done"

# ── Step 5: Compile TypeScript backend ────────────────────────────────────────
echo ""
echo "▶ [5/6] Compiling TypeScript backend..."
npm run build
echo "   ✓ Done"

# ── Step 6: Copy .env.production → .env (ready for Hostinger) ─────────────────
echo ""
echo "▶ [6/6] Preparing production .env file..."
cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env"
echo "   ✓ Done  (.env.production copied to .env)"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   BUILD COMPLETE  ✓                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  ── STEP 1: Import the database schema ──────────────────────"
echo "  In Hostinger hPanel → phpMyAdmin → database: u638211070_lmx_md"
echo "  Import this file: $ROOT_DIR/sql/schema.sql"
echo ""
echo "  ── STEP 2: Upload backend/ folder to Hostinger ─────────────"
echo "  Upload via FTP or hPanel File Manager:"
echo "  → $BACKEND_DIR"
echo ""
echo "  Files to upload:"
echo "    ├── dist/          (compiled backend)"
echo "    ├── public/        (React frontend)"
echo "    ├── prisma/        (schema + seed)"
echo "    ├── node_modules/  (dependencies)"
echo "    ├── package.json"
echo "    └── .env           (pre-filled with Hostinger credentials)"
echo ""
echo "  ── STEP 3: Configure Node.js app in hPanel ─────────────────"
echo "  Startup file: dist/src/index.js"
echo ""
echo "  ── STEP 4: Seed the admin account ──────────────────────────"
echo "  Run in Hostinger SSH terminal (inside the uploaded folder):"
echo "  → npm run seed"
echo "  Default login: admin / admin123  (change after first login!)"
echo ""
