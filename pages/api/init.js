import { getDb } from "../../lib/db";
import { SEED_ASSETS } from "../../lib/seedAssets";
import { SEED_LOCATIONS } from "../../lib/seedLocations";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const sql = getDb();

    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(30) PRIMARY KEY,
        title TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        category TEXT DEFAULT '',
        location TEXT DEFAULT '',
        parent_location TEXT DEFAULT '',
        location_address TEXT DEFAULT '',
        location_contact TEXT DEFAULT '',
        location_email TEXT DEFAULT '',
        location_phone TEXT DEFAULT '',
        status TEXT DEFAULT '',
        loan_status TEXT DEFAULT 'in',
        loanee TEXT DEFAULT '',
        checked_out_by TEXT DEFAULT '',
        checked_out_date TEXT DEFAULT '',
        last_scanned_user TEXT DEFAULT '',
        created_date TEXT DEFAULT '',
        warranty_expires TEXT DEFAULT '',
        vendor TEXT DEFAULT '',
        date_purchased TEXT DEFAULT '',
        purchase_cost TEXT DEFAULT '',
        serial_number TEXT DEFAULT '',
        manufacturer TEXT DEFAULT '',
        model TEXT DEFAULT '',
        type TEXT DEFAULT '',
        processor TEXT DEFAULT '',
        ram TEXT DEFAULT '',
        hard_drive TEXT DEFAULT '',
        make TEXT DEFAULT '',
        tag TEXT DEFAULT '',
        tag_expires TEXT DEFAULT '',
        vin TEXT DEFAULT '',
        vehicle_number TEXT DEFAULT '',
        vehicle_year TEXT DEFAULT '',
        lease_own TEXT DEFAULT '',
        monthly_payment TEXT DEFAULT '',
        payoff_date TEXT DEFAULT '',
        bank TEXT DEFAULT '',
        insurance_policy_num TEXT DEFAULT '',
        insurance_policy_payment TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        email_account TEXT DEFAULT '',
        phone_password TEXT DEFAULT '',
        email_password TEXT DEFAULT '',
        purpose TEXT DEFAULT '',
        bw_color TEXT DEFAULT '',
        comments TEXT DEFAULT '',
        is_custom BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        asset_id VARCHAR(30) REFERENCES assets(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        timestamp TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        contact TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Deduplicate first, then add unique constraint
    await sql`
      DELETE FROM locations
      WHERE id NOT IN (
        SELECT MIN(id) FROM locations GROUP BY name
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'locations_name_unique'
        ) THEN
          ALTER TABLE locations ADD CONSTRAINT locations_name_unique UNIQUE (name);
        END IF;
      END $$
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id SERIAL PRIMARY KEY,
        asset_id VARCHAR(30) REFERENCES assets(id) ON DELETE CASCADE,
        service_date TEXT DEFAULT '',
        vendor TEXT DEFAULT '',
        description TEXT DEFAULT '',
        invoice_number TEXT DEFAULT '',
        cost TEXT DEFAULT '',
        mileage TEXT DEFAULT '',
        location TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Add new columns if they don't exist yet (migration for existing databases)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='phone_password') THEN
          ALTER TABLE assets ADD COLUMN phone_password TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='email_password') THEN
          ALTER TABLE assets ADD COLUMN email_password TEXT DEFAULT '';
        END IF;
      END $$
    `;

    // Seed assets only if table is empty
    const countResult = await sql`SELECT COUNT(*) as count FROM assets`;
    const count = parseInt(countResult[0].count);

    if (count === 0) {
      // Batch insert in chunks of 50 to avoid query size limits
      const CHUNK = 50;
      for (let i = 0; i < SEED_ASSETS.length; i += CHUNK) {
        const chunk = SEED_ASSETS.slice(i, i + CHUNK);
        // Build values via json_populate_recordset for reliability
        const jsonData = JSON.stringify(chunk);
        await sql`
          INSERT INTO assets (
            id, title, notes, category, location, parent_location,
            location_address, location_contact, location_email, location_phone,
            status, loan_status, loanee, checked_out_by, checked_out_date,
            last_scanned_user, created_date, warranty_expires, vendor,
            date_purchased, purchase_cost, serial_number, manufacturer, model,
            type, processor, ram, hard_drive, make, tag, tag_expires, vin,
            vehicle_number, vehicle_year, lease_own, monthly_payment, payoff_date,
            bank, insurance_policy_num, insurance_policy_payment, phone_number,
            email_account, purpose, bw_color, comments, is_custom
          )
          SELECT
            id, title, notes, category, location, parent_location,
            location_address, location_contact, location_email, location_phone,
            status, loan_status, loanee, checked_out_by, checked_out_date,
            last_scanned_user, created_date, warranty_expires, vendor,
            date_purchased, purchase_cost, serial_number, manufacturer, model,
            type, processor, ram, hard_drive, make, tag, tag_expires, vin,
            vehicle_number, vehicle_year, lease_own, monthly_payment, payoff_date,
            bank, insurance_policy_num, insurance_policy_payment, phone_number,
            email_account, purpose, bw_color, comments,
            COALESCE(is_custom, false)
          FROM json_populate_recordset(NULL::assets, ${jsonData}::json)
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }

    // Seed locations — skips any name that already exists
    for (const loc of SEED_LOCATIONS) {
      await sql`
        INSERT INTO locations (name, address, contact, email, phone)
        VALUES (${loc.name}, ${loc.address||""}, ${loc.contact||""}, ${loc.email||""}, ${loc.phone||""})
        ON CONFLICT (name) DO NOTHING
      `;
    }

    res.status(200).json({ ok: true, seeded: count === 0, assetCount: count === 0 ? SEED_ASSETS.length : count });
  } catch (err) {
    console.error("Init error:", err);
    res.status(500).json({ error: err.message });
  }
}
