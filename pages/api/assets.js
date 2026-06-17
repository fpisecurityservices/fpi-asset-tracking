import { getDb, rowToAsset, assetToRow } from "../../lib/db";

export default async function handler(req, res) {
  const sql = getDb();

  try {
    // GET — fetch all assets
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM assets ORDER BY id ASC`;
      return res.status(200).json(rows.map(rowToAsset));
    }

    // POST — create new asset
    if (req.method === "POST") {
      const r = assetToRow({ ...req.body, isCustom: true });
      const rows = await sql`
        INSERT INTO assets (
          id, title, notes, category, location, parent_location,
          location_address, location_contact, location_email, location_phone,
          status, loan_status, loanee, checked_out_by, checked_out_date,
          warranty_expires, vendor, date_purchased, purchase_cost, serial_number,
          manufacturer, model, type, processor, ram, hard_drive, make, tag,
          tag_expires, vin, vehicle_number, vehicle_year, lease_own,
          monthly_payment, payoff_date, bank, insurance_policy_num,
          insurance_policy_payment, phone_number, email_account, phone_password,
          email_password, purpose, bw_color, comments, is_custom, created_date
        ) VALUES (
          ${r.id}, ${r.title}, ${r.notes}, ${r.category}, ${r.location},
          ${r.parent_location}, ${r.location_address}, ${r.location_contact},
          ${r.location_email}, ${r.location_phone}, ${r.status}, ${r.loan_status},
          ${r.loanee}, ${r.checked_out_by}, ${r.checked_out_date},
          ${r.warranty_expires}, ${r.vendor}, ${r.date_purchased},
          ${r.purchase_cost}, ${r.serial_number}, ${r.manufacturer}, ${r.model},
          ${r.type}, ${r.processor}, ${r.ram}, ${r.hard_drive}, ${r.make},
          ${r.tag}, ${r.tag_expires}, ${r.vin}, ${r.vehicle_number},
          ${r.vehicle_year}, ${r.lease_own}, ${r.monthly_payment}, ${r.payoff_date},
          ${r.bank}, ${r.insurance_policy_num}, ${r.insurance_policy_payment},
          ${r.phone_number}, ${r.email_account}, ${r.phone_password},
          ${r.email_password}, ${r.purpose}, ${r.bw_color},
          ${r.comments}, TRUE, ${new Date().toLocaleString()}
        )
        RETURNING *
      `;
      return res.status(201).json(rowToAsset(rows[0]));
    }

    // PATCH — update an existing asset
    if (req.method === "PATCH") {
      const r = assetToRow(req.body);
      const rows = await sql`
        UPDATE assets SET
          title               = ${r.title},
          notes               = ${r.notes},
          category            = ${r.category},
          location            = ${r.location},
          parent_location     = ${r.parent_location},
          location_address    = ${r.location_address},
          location_contact    = ${r.location_contact},
          location_email      = ${r.location_email},
          location_phone      = ${r.location_phone},
          status              = ${r.status},
          loan_status         = ${r.loan_status},
          loanee              = ${r.loanee},
          checked_out_by      = ${r.checked_out_by},
          checked_out_date    = ${r.checked_out_date},
          warranty_expires    = ${r.warranty_expires},
          vendor              = ${r.vendor},
          date_purchased      = ${r.date_purchased},
          purchase_cost       = ${r.purchase_cost},
          serial_number       = ${r.serial_number},
          manufacturer        = ${r.manufacturer},
          model               = ${r.model},
          type                = ${r.type},
          processor           = ${r.processor},
          ram                 = ${r.ram},
          hard_drive          = ${r.hard_drive},
          make                = ${r.make},
          tag                 = ${r.tag},
          tag_expires         = ${r.tag_expires},
          vin                 = ${r.vin},
          vehicle_number      = ${r.vehicle_number},
          vehicle_year        = ${r.vehicle_year},
          lease_own           = ${r.lease_own},
          monthly_payment     = ${r.monthly_payment},
          payoff_date         = ${r.payoff_date},
          bank                = ${r.bank},
          insurance_policy_num       = ${r.insurance_policy_num},
          insurance_policy_payment   = ${r.insurance_policy_payment},
          phone_number        = ${r.phone_number},
          email_account       = ${r.email_account},
          phone_password      = ${r.phone_password},
          email_password      = ${r.email_password},
          purpose             = ${r.purpose},
          bw_color            = ${r.bw_color},
          comments            = ${r.comments},
          updated_at          = NOW()
        WHERE id = ${r.id}
        RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ error: "Asset not found" });
      return res.status(200).json(rowToAsset(rows[0]));
    }

    res.status(405).end();
  } catch (err) {
    console.error("Assets API error:", err);
    res.status(500).json({ error: err.message });
  }
}
