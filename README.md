# FPI Asset Tracker

Full-stack asset tracking system built with Next.js + Neon Postgres, deployed on Vercel.

---

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial FPI Asset Tracker"
git remote add origin https://github.com/YOUR_ORG/fpi-asset-tracker.git
git push -u origin main
```

### 2. Create Vercel Project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### 3. Connect Neon Postgres
1. In your Vercel project dashboard → **Storage** tab
2. Click **Connect Database** → **Neon** (or select your existing Neon DB)
3. Vercel will automatically add `DATABASE_URL` to your environment variables
4. **Redeploy** the project so the new env var takes effect

### 4. First Load
On first visit to your deployed URL, the app will:
- Automatically create the `assets`, `notes`, and `locations` tables
- Seed all 412 original FPI assets into the database
- This takes ~5-10 seconds on first load only

---

## 📁 Project Structure

```
fpi-asset-tracker/
├── pages/
│   ├── index.js              # Main React UI
│   └── api/
│       ├── init.js           # DB setup + seed (POST)
│       ├── assets.js         # Asset CRUD (GET/POST/PATCH)
│       ├── notes.js          # Notes CRUD (GET/POST/DELETE)
│       └── locations.js      # Locations CRUD (GET/POST/PUT/DELETE)
├── lib/
│   ├── db.js                 # DB connection + field mapping helpers
│   └── seedAssets.js         # 412 original assets (auto-generated)
├── package.json
└── next.config.js
```

---

## ✨ Features

- **412 assets** pre-loaded from the original FPI inventory
- **Add / Edit** any asset with full field support
- **Loan Out / Check In** assets to employees with timestamps
- **Notes** on any asset — timestamped, persistent
- **Locations Manager** — save reusable locations with address & contact info
- **Export Reports** — CSV downloads:
  - Full Inventory
  - Current filtered view
  - Checked Out Assets
  - Assets Needing Attention
  - Vehicles Report
  - Summary Report (counts by category & status)
  - Per-category exports

---

## 🗄️ Database Schema

```sql
-- All assets (original + custom added)
assets (id, title, category, location, status, loan_status, loanee, ...)

-- Timestamped notes per asset
notes (id, asset_id, text, timestamp, created_at)

-- Saved locations for autocomplete
locations (id, name, address, contact, email, phone)
```

---

## 🔧 Local Development

```bash
npm install
# Create .env.local with:
# DATABASE_URL=your_neon_connection_string
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)
