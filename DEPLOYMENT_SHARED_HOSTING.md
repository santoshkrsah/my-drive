# Deploying My Drive on Hostinger Shared Hosting

This guide covers deploying the My Drive application on **Hostinger Shared Hosting** (Premium or Business plan) which includes Node.js support via hPanel.

---

## Prerequisites

- Hostinger Premium or Business shared hosting plan (required for Node.js support)
- Access to hPanel (Hostinger's control panel)
- A domain name pointed to your hosting
- Node.js 18+ available in hPanel
- MySQL database (included with shared hosting)
- FTP client (e.g., FileZilla) or SSH access

---

## Architecture Overview

In production, a **single Node.js process** (Express) serves everything:

```
Browser → Express (port assigned by Hostinger)
              ├── /api/*        → Backend API routes
              └── /*            → React frontend (static files from public/)
```

The React build output is placed in `backend/public/` so Express can serve it.

---

## Step 1 — Set Up MySQL Database

1. Log in to **hPanel** → go to **Databases** → **MySQL Databases**
2. Create a new database (e.g., `u123456789_mydrive`)
3. Create a database user and set a strong password
4. Assign the user to the database with **All Privileges**
5. Note down:
   - Database host: usually `127.0.0.1` or `localhost`
   - Database name
   - Database username
   - Database password

---

## Step 2 — Build the Application Locally

Run these commands on your local machine before uploading.

### 2a. Build the React frontend

```bash
cd frontend
npm install
npm run build
```

This creates a `frontend/dist/` directory.

### 2b. Copy frontend build into backend

```bash
# From the project root
cp -r frontend/dist/* backend/public/
```

> If the `backend/public/` directory does not exist, create it first:
> ```bash
> mkdir -p backend/public
> ```

### 2c. Compile the TypeScript backend

```bash
cd backend
npm install
npx tsc
```

This creates a `backend/dist/` directory with compiled JavaScript.

### 2d. Verify the structure

After building, confirm you have:

```
backend/
├── dist/           ← compiled backend JS
│   └── index.js   ← entry point
├── public/         ← React build files
│   ├── index.html
│   └── assets/
├── node_modules/
├── package.json
└── prisma/
    └── schema.prisma
```

---

## Step 3 — Create the `.env` File

Create a file at `backend/.env` with the following content (fill in your actual values):

```env
NODE_ENV=production
PORT=3000

DATABASE_URL="mysql://DB_USERNAME:DB_PASSWORD@127.0.0.1:3306/DB_NAME"

JWT_SECRET=your_very_long_random_secret_key_here
JWT_REFRESH_SECRET=another_very_long_random_secret_key_here

FRONTEND_URL=https://yourdomain.com

UPLOAD_DIR=uploads
MAX_FILE_SIZE=104857600
MAX_STORAGE_PER_USER=5368709120
```

**Important notes:**
- Replace `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` with your MySQL credentials from Step 1
- Generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (e.g., 64-character random strings)
- Set `FRONTEND_URL` to your actual domain
- `PORT` will be overridden by Hostinger — see Step 5

---

## Step 4 — Upload Files to Hostinger

### Option A: Using File Manager (hPanel)

1. Log in to **hPanel** → **Files** → **File Manager**
2. Navigate to your domain's directory (e.g., `public_html/` or a subdirectory)
3. Create a folder named `mydrive` (or use the root)
4. Upload the entire `backend/` folder contents (including `dist/`, `public/`, `node_modules/`, `prisma/`, `.env`, `package.json`)

> **Tip:** Compress the backend folder into a `.zip` first, upload it, then extract it in File Manager. This is much faster than uploading thousands of files individually.

```bash
# On your local machine
cd backend
zip -r ../backend-deploy.zip . --exclude "*.ts" --exclude "src/*"
```

### Option B: Using FTP (FileZilla)

1. In hPanel → **Files** → **FTP Accounts**, create an FTP account
2. Connect with FileZilla using the FTP credentials
3. Upload the `backend/` directory to your desired path on the server

### Option C: Using SSH (if available)

```bash
# Connect via SSH
ssh u123456789@yourdomain.com

# Navigate to your desired directory
cd ~/domains/yourdomain.com/public_html

# Clone your repository or upload via SCP
```

---

## Step 5 — Set Up Node.js App in hPanel

1. Log in to **hPanel** → **Advanced** → **Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 18.x or 20.x (latest available)
   - **Application mode:** Production
   - **Application root:** The path to your `backend` folder (e.g., `public_html/mydrive`)
   - **Application URL:** Your domain or subdomain
   - **Application startup file:** `dist/src/index.js`
4. Click **Create**
5. Note the **port number** assigned by Hostinger (shown in the app details)

> Hostinger assigns a port automatically. Your Express app reads `process.env.PORT` so it will use the correct port.

---

## Step 6 — Set Environment Variables in hPanel

In the Node.js app settings in hPanel, you can set environment variables through the UI:

1. In your Node.js app settings, find the **Environment Variables** section
2. Add each variable from your `.env` file
3. Key variables to add:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `mysql://...`
   - `JWT_SECRET` = `your_secret`
   - `JWT_REFRESH_SECRET` = `your_refresh_secret`

Alternatively, the app will read from the `.env` file you uploaded in Step 3 if `dotenv` is configured.

---

## Step 7 — Run Database Migrations

You need to run Prisma migrations to set up the database tables.

### Via SSH

```bash
# Connect to your server via SSH
ssh u123456789@yourdomain.com

# Navigate to your backend directory
cd ~/domains/yourdomain.com/public_html/mydrive

# Run Prisma migrations
NODE_ENV=production npx prisma migrate deploy

# (Optional) Seed initial data if you have a seed script
# npx prisma db seed
```

### Via hPanel Node.js Console

In hPanel → Node.js → your app → click **Run NPM command** or use the terminal:

```bash
npx prisma migrate deploy
```

---

## Step 8 — Start the Application

1. In hPanel → **Node.js** → find your app
2. Click **Start** or **Restart**
3. The app should now be running

To verify: visit `https://yourdomain.com/api/health` — you should see:
```json
{"status":"ok","timestamp":"..."}
```

---

## Step 9 — Ensure Uploads Directory Exists

The app stores uploaded files in an `uploads/` directory. Make sure it exists:

```bash
# Via SSH
mkdir -p ~/domains/yourdomain.com/public_html/mydrive/uploads
chmod 755 ~/domains/yourdomain.com/public_html/mydrive/uploads
```

Or create it via hPanel File Manager.

---

## Updating the Application

When you make changes, follow these steps:

```bash
# 1. Build frontend (local machine)
cd frontend && npm run build

# 2. Copy to backend/public (local machine)
cp -r frontend/dist/* backend/public/

# 3. Compile backend TypeScript (local machine)
cd backend && npx tsc

# 4. Upload changed files to the server
# (Re-upload the dist/ and public/ directories)

# 5. Restart the Node.js app in hPanel
```

---

## Troubleshooting

### App won't start

- Check the error log in hPanel → Node.js → **Error Log**
- Verify `dist/index.js` exists (TypeScript was compiled)
- Confirm `DATABASE_URL` is correct and MySQL credentials are valid

### Database connection errors

```bash
# Test the connection string format
mysql -h 127.0.0.1 -u DB_USERNAME -p DB_NAME
```

- Ensure the database user has privileges on the database
- Use `127.0.0.1` instead of `localhost` for the host in `DATABASE_URL`

### Files not uploading

- Check that the `uploads/` directory exists and is writable
- Verify `UPLOAD_DIR` in `.env` points to the correct path
- Check disk quota in hPanel

### React app shows blank page or 404 on refresh

- Verify `backend/public/index.html` exists
- Check that `NODE_ENV=production` is set — this enables the catch-all route in Express
- Restart the Node.js app after any changes

### "Cannot find module" errors

- Ensure `node_modules` are uploaded or run `npm install --production` on the server via SSH:
  ```bash
  cd ~/domains/yourdomain.com/public_html/mydrive
  npm install --production
  ```

---

## Directory Structure on Server

```
public_html/mydrive/          ← your app root
├── dist/                     ← compiled backend (from npx tsc)
│   ├── index.js
│   ├── controllers/
│   ├── services/
│   └── ...
├── public/                   ← React build (from npm run build)
│   ├── index.html
│   └── assets/
├── node_modules/             ← backend dependencies
├── prisma/
│   └── schema.prisma
├── uploads/                  ← user-uploaded files
├── package.json
├── .env                      ← environment variables
└── .npmrc                    ← (optional)
```

---

## Security Checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are long (64+ chars) random strings
- [ ] `.env` file is not publicly accessible (it's inside the app directory, not web root)
- [ ] Database user has only the minimum required permissions
- [ ] `NODE_ENV=production` is set
- [ ] SSL/HTTPS is enabled for your domain in hPanel → **SSL** → **Let's Encrypt**
- [ ] `uploads/` directory is not publicly accessible via direct URL (Express serves files through the API, not statically)




## Additional 
Deployment Steps (from scratch)
Step 1 — Run the build on your local machine:

chmod +x deploy-build.sh
./deploy-build.sh

Step 2 — Import the database schema:

Hostinger hPanel → Databases → phpMyAdmin
Select database: u638211070_lmx_md
Import tab → choose sql/schema.sql → Go
Step 3 — Upload backend/ folder to Hostinger:

Use hPanel File Manager or FTP
Upload the entire backend/ folder contents
Step 4 — Configure Node.js app in hPanel:

hPanel → Node.js → Create Application
Startup file: dist/src/index.js
Start the app
Step 5 — Seed the admin account (SSH terminal):
npm run seed

Login: admin / admin123
Change password immediately after first login

What was done
Build completed (all 6 steps):

React frontend compiled → backend/public/ (index.html + assets/)
TypeScript backend compiled → backend/dist/ (entry: dist/src/index.js)
.env.production auto-copied to backend/.env with your Hostinger credentials
Deleted unnecessary files:

backend/frontend/ — 3 stray duplicate source files that had no business being inside the backend
All .DS_Store macOS metadata files across the project

Final structure to upload to Hostinger
Upload the entire backend/ folder to your Hostinger domain root:
backend/
├── dist/src/index.js   ← startup file for hPanel
├── public/             ← React frontend (served automatically)
├── prisma/             ← schema + seed
├── node_modules/       ← all dependencies
├── package.json
└── .env                ← Hostinger credentials (already set)

Remaining steps on Hostinger side
1. Import the database — phpMyAdmin → select u638211070_lmx_md → Import → choose: sql/schema.sql
2. Upload backend/ folder via hPanel File Manager or FTP
3. Set up Node.js app in hPanel:

Application root: where you uploaded backend/
Startup file: dist/src/index.js
4. Create admin account — run once via SSH in the uploaded folder:
npm run seed
Login with admin / admin123 and change password immediately