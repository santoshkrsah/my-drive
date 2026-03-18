# My Drive — Complete Hostinger Deployment Guide

> **Current Status:** The application has already been built and configured on your local machine.
> All database credentials are set. You only need to follow the steps below to go live.

---

## What Has Already Been Done For You

| Task | Status | Location |
|------|--------|----------|
| React frontend built | Done | `backend/public/` |
| TypeScript backend compiled | Done | `backend/dist/` |
| Hostinger DB credentials set | Done | `backend/.env` |
| MySQL schema file created | Done | `sql/schema.sql` |

---

## What You Need Before Starting

- Hostinger **Premium or Business** plan (Basic plan does NOT support Node.js)
- Access to **hPanel** at [hpanel.hostinger.com](https://hpanel.hostinger.com)
- Your domain name pointed to Hostinger nameservers
- **FileZilla** (free FTP client) — download from [filezilla-project.org](https://filezilla-project.org)
  OR you can use the Hostinger File Manager directly (no extra software needed)
- About 30–60 minutes of your time

---

## Overview of Steps

```
Step 1 → Import database schema (phpMyAdmin)
Step 2 → Upload backend/ folder to Hostinger
Step 3 → Create Node.js app in hPanel
Step 4 → Create admin account (one-time seed)
Step 5 → Enable HTTPS / SSL
Step 6 → Test the live application
```

---

## Step 1 — Import the Database Schema

The database tables need to be created before the app can run.

### 1a. Open phpMyAdmin

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. In hPanel, click **Databases** in the left sidebar (or top menu)
3. Click **phpMyAdmin**
4. On the left panel inside phpMyAdmin, click on your database name:
   ```
   u638211070_lmx_md
   ```
   > If you don't see it, click the small arrow/triangle next to "Databases" to expand the list.

### 1b. Import the schema file

1. With the database selected (highlighted on the left), click the **Import** tab at the top
2. Click **Browse** (or "Choose File")
3. Navigate to your project folder on your local machine and select:
   ```
   sql/schema.sql
   ```
4. Leave all other options as default
5. Scroll down and click **Go** (or **Import**)
6. You should see a **green success message** like:
   ```
   Import has been successfully finished, 12 queries executed.
   ```
7. You will now see all 12 tables listed on the left side of phpMyAdmin:
   - users, files, folders, file_shares, file_versions
   - activity_logs, user_activities, public_links
   - folder_shares, notifications, tags, file_tags

> **If you see errors:** Make sure you selected the correct database (`u638211070_lmx_md`) before importing.
> Do NOT import into the wrong database.

---

## Step 2 — Upload the Backend Folder to Hostinger

You are uploading the entire `backend/` folder from your local machine to the Hostinger server.

### Option A: Using ZIP + File Manager (Recommended — Easiest)

This is the fastest method. Instead of uploading thousands of files one by one, you zip everything first.

#### 2a. Create a ZIP file on your local machine

**On Mac (Terminal):**
```bash
cd /Users/santosh.sah/repos/MD
zip -r backend-deploy.zip backend/
```

**On Windows (PowerShell):**
```powershell
cd C:\path\to\MD
Compress-Archive -Path backend\ -DestinationPath backend-deploy.zip
```

**OR** right-click the `backend` folder → "Compress" (Mac) or "Send to → Compressed (zipped) folder" (Windows)

#### 2b. Upload and extract the ZIP in hPanel

1. Log in to hPanel → click **File Manager** (under Files section)
2. Navigate to your domain folder. You will see a directory like:
   ```
   /home/u638211070/domains/yourdomain.com/public_html/
   ```
3. Inside `public_html/`, create a new folder called `app`:
   - Click **New Folder** button
   - Name it `app` (or any name you like, e.g. `mydrive`)
   - Click inside that folder to open it
4. Click **Upload** button
5. Select the `backend-deploy.zip` file from your local machine
6. Wait for the upload to complete (the zip file is large due to `node_modules` — be patient)
7. Once uploaded, right-click on `backend-deploy.zip` → click **Extract**
8. A dialog will appear asking where to extract:
   - Make sure the destination is the `app/` folder you just created (or leave empty to extract here)
   - Click **Extract**
9. Wait for extraction to finish
10. You should now see these folders inside `app/`:
    ```
    app/
    ├── dist/
    ├── public/
    ├── prisma/
    ├── node_modules/
    ├── uploads/
    ├── package.json
    └── .env
    ```
11. Delete the ZIP file after extraction (right-click → Delete)

> **Important:** The `.env` file must be present. In File Manager, make sure to show hidden files.
> Click **Settings** icon → enable **Show Hidden Files** to verify `.env` is there.

---

### Option B: Using FTP with FileZilla

Use this if the zip upload fails or you prefer FTP.

#### 2a. Get FTP credentials from hPanel

1. In hPanel → **Files** → **FTP Accounts**
2. Click **Create FTP Account**
3. Fill in:
   - FTP Username: e.g. `deploy`
   - Password: choose a strong password
   - Directory: your domain's `public_html/app` path
4. Click **Create**
5. Note down the FTP host, usually: `ftp.yourdomain.com` or the server IP

#### 2b. Connect with FileZilla

1. Open FileZilla
2. Click **File** → **Site Manager** → **New Site**
3. Fill in:
   - Host: `ftp.yourdomain.com`
   - Protocol: FTP - File Transfer Protocol
   - Encryption: Use explicit FTP over TLS if available
   - Logon Type: Normal
   - User: your FTP username
   - Password: your FTP password
4. Click **Connect**
5. On the **right panel** (server), navigate to: `/public_html/app/`
6. On the **left panel** (local), navigate to: `/Users/santosh.sah/repos/MD/backend/`
7. Select all files and folders in the local `backend/` directory
8. Right-click → **Upload**
9. Wait for all files to upload (this can take 10–20 minutes due to `node_modules/`)

---

## Step 3 — Create the Node.js Application in hPanel

This tells Hostinger how to run your application.

1. Log in to hPanel
2. Click **Advanced** in the sidebar → click **Node.js**
3. Click **Create Application** button
4. Fill in the configuration form:

   | Field | Value |
   |-------|-------|
   | Node.js version | `20.x` (choose the latest available) |
   | Application mode | `Production` |
   | Application root | `/home/u638211070/domains/yourdomain.com/public_html/app` |
   | Application URL | `yourdomain.com` (select your domain from dropdown) |
   | Application startup file | `dist/src/index.js` |

   > **Application root** is the path to where you uploaded the backend files in Step 2.
   > It should be the folder that CONTAINS `dist/`, `public/`, `package.json`, `.env`, etc.
   > You can find the exact path by looking at the URL in File Manager.

5. Click **Create**
6. Hostinger will assign a **port number** automatically (e.g. 3100). Your app reads this from `process.env.PORT` automatically — you do not need to set it manually.
7. The app status will show as **Stopped** initially — that is normal. Do NOT start it yet.

---

## Step 4 — Create the Admin Account (One-Time Setup)

The database is empty. You need to run the seed script once to create the initial administrator account.

### Via hPanel Node.js Terminal

1. In hPanel → **Node.js** → find your app → click **Terminal** (or "Run command")
2. Type the following command and press Enter:
   ```bash
   npm run seed
   ```
3. You should see output like:
   ```
   Admin user created:
     Username: admin
     Password: admin123
     Email: admin@mydrive.com
   ```

### Via SSH (Alternative)

If hPanel terminal is not available, use SSH:

1. In hPanel → **Advanced** → **SSH Access** → enable SSH
2. Note your SSH host, port, username
3. Open your local Terminal and connect:
   ```bash
   ssh u638211070@yourdomain.com -p 65002
   ```
   *(Port is usually 22 or 65002 — check hPanel SSH settings)*
4. Navigate to your app folder:
   ```bash
   cd ~/domains/yourdomain.com/public_html/app
   ```
5. Run the seed command:
   ```bash
   npm run seed
   ```

> **Default Admin Credentials:**
> - Username: `admin`
> - Password: `admin123`
> - Email: `admin@mydrive.com`
>
> **IMPORTANT: Change the admin password immediately after your first login.**
> Go to Profile → Change Password after logging in.

---

## Step 5 — Start the Application

1. In hPanel → **Node.js** → find your application
2. Click the **Start** button (green play button)
3. The status should change from **Stopped** to **Running**
4. Wait about 10–15 seconds for the app to fully start

### Verify the app is running

Open your browser and visit:
```
https://yourdomain.com/api/health
```

You should see a JSON response like:
```json
{ "status": "ok" }
```

If that works, visit your main site:
```
https://yourdomain.com
```

You should see the **My Drive login page**.

---

## Step 6 — Enable HTTPS / SSL (Free with Hostinger)

Your app should run over HTTPS, not plain HTTP. Hostinger provides a free SSL certificate.

1. In hPanel → **SSL** → **SSL/TLS**
2. Find your domain in the list
3. Next to your domain, click **Install** under the **Free SSL** column
4. Hostinger will issue a Let's Encrypt certificate automatically (takes 5–10 minutes)
5. Once installed, click **Force HTTPS** to redirect all HTTP traffic to HTTPS

After this, `http://yourdomain.com` will automatically redirect to `https://yourdomain.com`.

---

## Step 7 — Test the Application End-to-End

Run through this checklist to confirm everything works:

### Basic tests
- [ ] Visit `https://yourdomain.com` — login page loads
- [ ] Log in with `admin` / `admin123`
- [ ] The dashboard loads after login
- [ ] Change admin password (Profile → Change Password)

### Upload test
- [ ] Click upload button
- [ ] Upload a small file (e.g. a photo or PDF)
- [ ] File appears in the dashboard after upload
- [ ] File can be downloaded back

### User management test
- [ ] Go to Admin Panel → User Management
- [ ] Create a new regular user
- [ ] Log out, log in as the new user
- [ ] Upload a file as the regular user

### Sharing test
- [ ] Share a file with another user
- [ ] Log in as that user and verify the shared file is visible

---

## How to Update the Application in the Future

When you make code changes, follow these steps:

### Step 1 — On your LOCAL machine, rebuild:
```bash
# From the project root  (/Users/santosh.sah/repos/MD)
bash deploy-build.sh
```
This will:
- Rebuild the React frontend
- Recompile the TypeScript backend
- Copy fresh frontend into `backend/public/`
- Re-copy `.env.production` to `.env`

### Step 2 — Re-upload only the changed folders:
- If you changed **frontend code** → re-upload `backend/public/` folder
- If you changed **backend code** → re-upload `backend/dist/` folder
- If you changed **both** → re-upload both

> No need to re-upload `node_modules/` unless you added new packages to `package.json`.

### Step 3 — Restart the Node.js app:
- hPanel → Node.js → click **Restart**

---

## Changing Database Credentials in the Future

All credentials are stored in one place:

```
backend/.env.production  (line 22)
```

Open that file and edit the `DATABASE_URL` line:
```env
DATABASE_URL="mysql://NEW_USERNAME:NEW_PASSWORD@127.0.0.1:3306/NEW_DATABASE"
```

> **Password encoding rule:** If your password contains special characters, encode them:
> - `@` → `%40`
> - `#` → `%23`
> - `$` → `%24`
> - `&` → `%26`
> - ` ` (space) → `%20`

After editing, run `bash deploy-build.sh` again (it will copy the updated `.env.production` → `.env`), then re-upload `backend/.env` to the server and restart the app.

---

## Current Credentials Reference

| Setting | Value |
|---------|-------|
| DB Host | `127.0.0.1` |
| DB Port | `3306` |
| DB Name | `u638211070_lmx_md` |
| DB User | `u638211070_lmx_md` |
| DB Password | `Te@5219981998` |
| App startup file | `dist/src/index.js` |
| Default admin user | `admin` |
| Default admin pass | `admin123` |

---

## Troubleshooting

### App shows "502 Bad Gateway" or won't load

**Cause:** Node.js app is not running or crashed on startup.

**Fix:**
1. hPanel → Node.js → check the status
2. If Stopped, click Start
3. If it keeps stopping, check the **Error Log** (button next to your app)
4. Common log errors and fixes:

   | Error in log | Fix |
   |---|---|
   | `Cannot connect to database` | Verify `DATABASE_URL` in `.env` has correct credentials |
   | `Cannot find module 'xxx'` | `node_modules` is missing — upload it or run `npm install` via SSH |
   | `dist/src/index.js not found` | Re-run the build with `bash deploy-build.sh`, re-upload `dist/` |
   | `EADDRINUSE` port in use | Restart the app in hPanel — the port will reassign |

---

### Login page shows but login fails / "Database error"

**Cause:** Database tables not created or wrong credentials.

**Fix:**
1. Open phpMyAdmin → check if tables exist in `u638211070_lmx_md`
2. If tables are missing → re-import `sql/schema.sql`
3. If tables exist → check `backend/.env` line 22 for correct `DATABASE_URL`

---

### Files upload but don't show / "uploads" error

**Cause:** The `uploads/` directory doesn't exist or isn't writable on the server.

**Fix:**
1. In hPanel File Manager → navigate to your app folder
2. Check if `uploads/` folder exists
3. If missing, create it (New Folder → name it `uploads`)
4. Right-click `uploads/` → **Permissions** → set to `755`

---

### React page shows blank / 404 on page refresh

**Cause:** The React app uses client-side routing. When you refresh on `/dashboard`, the server tries to find a file at that path — it doesn't exist.

**Fix:** This is handled automatically by Express when `NODE_ENV=production` is set.
Verify `NODE_ENV=production` is in your `.env` file on the server.

---

### "Cannot find module '@prisma/client'" error

**Cause:** Prisma client wasn't generated after upload.

**Fix:** Via SSH or hPanel terminal:
```bash
cd ~/domains/yourdomain.com/public_html/app
npx prisma generate
```
Then restart the Node.js app.

---

### App is very slow / timing out

**Cause:** Shared hosting has limited RAM. The `node_modules` deduplication or background jobs may be heavy.

**Fix:**
1. hPanel → Node.js → Restart your app
2. Check if another process is consuming resources (hPanel → Resource Usage)
3. If consistently slow, consider upgrading to a VPS plan

---

## Server Directory Structure (on Hostinger)

After successful deployment, your server should look like this:

```
~/domains/yourdomain.com/public_html/app/
│
├── dist/                        ← Compiled backend JavaScript
│   ├── src/
│   │   ├── index.js             ← App entry point (startup file)
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── prisma/
│       └── seed.js
│
├── public/                      ← React frontend (served as static files)
│   ├── index.html
│   ├── drive.svg
│   └── assets/
│       ├── index-xxxxx.css
│       └── index-xxxxx.js
│
├── prisma/
│   ├── schema.prisma            ← Database schema definition
│   └── seed.ts                  ← Seed script source
│
├── node_modules/                ← All backend dependencies
│
├── uploads/                     ← User uploaded files (created at runtime)
│
├── package.json
├── package-lock.json
├── .env                         ← Production environment variables (pre-filled)
└── .npmrc
```

---

## Security Checklist (Do Before Going Live)

- [ ] SSL/HTTPS is enabled and forced in hPanel
- [ ] Admin password has been changed from `admin123`
- [ ] `.env` file is NOT accessible via browser URL (it's inside the app folder, not web root — this is safe by default on Hostinger)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` use the pre-generated 128-character random strings (already done)
- [ ] `NODE_ENV=production` is set in `.env` (already done)
- [ ] `uploads/` directory permissions are set to `755`

---

## Quick Reference — hPanel Navigation

| You want to... | Go to... |
|---|---|
| See database / run phpMyAdmin | hPanel → Databases → phpMyAdmin |
| Upload files | hPanel → Files → File Manager |
| Create/start/stop Node.js app | hPanel → Advanced → Node.js |
| Enable SSL certificate | hPanel → SSL → SSL/TLS |
| Connect via SSH | hPanel → Advanced → SSH Access |
| Create FTP account | hPanel → Files → FTP Accounts |
| View error logs | hPanel → Node.js → (your app) → Error Log |
| Check disk/RAM usage | hPanel → Websites → Resource Usage |

---

*This guide was prepared for the current build state of My Drive. If you re-run `bash deploy-build.sh` in the future, repeat from Step 2 (re-upload) onwards.*


What the guide covers (in order)
Section	Details
Current status table	Shows what's already done — build, credentials, SQL file
Step 1 — Import DB	Exact click-by-click steps in phpMyAdmin, what success looks like, what to do on error
Step 2 — Upload files	Two options: ZIP via File Manager (recommended) + FileZilla FTP, with exact paths
Step 3 — Create Node.js app	Exact values to fill in each hPanel field
Step 4 — Create admin account	How to run npm run seed via hPanel terminal or SSH
Step 5 — Start + verify	How to start the app and test it's live
Step 6 — Enable SSL	Free Let's Encrypt setup + force HTTPS
Step 7 — End-to-end test	Checkbox list covering login, upload, user management, sharing
How to update later :	Rebuild with the script, which folders to re-upload, when
Changing credentials	: Exactly which file and line to edit, special char encoding rules
Credentials reference table: 	All your credentials in one place
Troubleshooting	6 specific problems with exact causes + fixes
Server directory structure	What the server should look like after deployment
Security checklist	6 items to check before going public
hPanel navigation table	Quick lookup of where everything is in hPanel
