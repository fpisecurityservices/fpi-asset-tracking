import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  const sql = getDb();

  try {
    // GET — all locations
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM locations ORDER BY name ASC`;
      return res.status(200).json(rows.map(r => ({
        id: r.id, name: r.name, address: r.address || "",
        contact: r.contact || "", email: r.email || "", phone: r.phone || "",
      })));
    }

    // POST — create location
    if (req.method === "POST") {
      const { name, address, contact, email, phone } = req.body;
      const rows = await sql`
        INSERT INTO locations (name, address, contact, email, phone)
        VALUES (${name}, ${address||""}, ${contact||""}, ${email||""}, ${phone||""})
        RETURNING *
      `;
      const r = rows[0];
      return res.status(201).json({ id: r.id, name: r.name, address: r.address, contact: r.contact, email: r.email, phone: r.phone });
    }

    // PUT — update location
    if (req.method === "PUT") {
      const { id, name, address, contact, email, phone } = req.body;
      const rows = await sql`
        UPDATE locations SET name=${name}, address=${address||""}, contact=${contact||""}, email=${email||""}, phone=${phone||""}
        WHERE id=${id} RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      const r = rows[0];
      return res.status(200).json({ id: r.id, name: r.name, address: r.address, contact: r.contact, email: r.email, phone: r.phone });
    }

    // DELETE — remove location
    if (req.method === "DELETE") {
      const { id } = req.body;
      await sql`DELETE FROM locations WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error("Locations API error:", err);
    res.status(500).json({ error: err.message });
  }
}
