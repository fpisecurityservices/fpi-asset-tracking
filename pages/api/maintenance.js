import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  const sql = getDb();

  try {
    // GET — fetch maintenance records for an asset (or all if no assetId)
    if (req.method === "GET") {
      const { assetId } = req.query;
      const rows = assetId
        ? await sql`SELECT * FROM maintenance_records WHERE asset_id = ${assetId} ORDER BY service_date DESC, created_at DESC`
        : await sql`SELECT * FROM maintenance_records ORDER BY service_date DESC, created_at DESC`;
      return res.status(200).json(rows.map(rowToMaintenance));
    }

    // POST — create maintenance record
    if (req.method === "POST") {
      const { assetId, serviceDate, vendor, description, invoiceNumber, cost, mileage, location } = req.body;
      if (!assetId) return res.status(400).json({ error: "assetId required" });
      const rows = await sql`
        INSERT INTO maintenance_records (asset_id, service_date, vendor, description, invoice_number, cost, mileage, location)
        VALUES (${assetId}, ${serviceDate||""}, ${vendor||""}, ${description||""}, ${invoiceNumber||""}, ${cost||""}, ${mileage||""}, ${location||""})
        RETURNING *
      `;
      return res.status(201).json(rowToMaintenance(rows[0]));
    }

    // PATCH — update a maintenance record
    if (req.method === "PATCH") {
      const { id, serviceDate, vendor, description, invoiceNumber, cost, mileage, location } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });
      const rows = await sql`
        UPDATE maintenance_records SET
          service_date   = ${serviceDate||""},
          vendor         = ${vendor||""},
          description    = ${description||""},
          invoice_number = ${invoiceNumber||""},
          cost           = ${cost||""},
          mileage        = ${mileage||""},
          location       = ${location||""},
          updated_at     = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(rowToMaintenance(rows[0]));
    }

    // DELETE — remove a maintenance record
    if (req.method === "DELETE") {
      const { id } = req.body;
      await sql`DELETE FROM maintenance_records WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error("Maintenance API error:", err);
    res.status(500).json({ error: err.message });
  }
}

function rowToMaintenance(r) {
  return {
    id: r.id,
    assetId: r.asset_id,
    serviceDate: r.service_date || "",
    vendor: r.vendor || "",
    description: r.description || "",
    invoiceNumber: r.invoice_number || "",
    cost: r.cost || "",
    mileage: r.mileage || "",
    location: r.location || "",
    createdAt: r.created_at,
  };
}
