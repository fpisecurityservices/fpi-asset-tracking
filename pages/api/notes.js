import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  const sql = getDb();

  try {
    // GET — all notes, keyed by asset_id
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM notes ORDER BY created_at ASC`;
      const byAsset = {};
      for (const row of rows) {
        if (!byAsset[row.asset_id]) byAsset[row.asset_id] = [];
        byAsset[row.asset_id].push({ id: row.id, text: row.text, timestamp: row.timestamp });
      }
      return res.status(200).json(byAsset);
    }

    // POST — add note
    if (req.method === "POST") {
      const { assetId, text, timestamp } = req.body;
      const id = Date.now().toString();
      await sql`
        INSERT INTO notes (id, asset_id, text, timestamp)
        VALUES (${id}, ${assetId}, ${text}, ${timestamp})
      `;
      return res.status(201).json({ id, assetId, text, timestamp });
    }

    // DELETE — remove note
    if (req.method === "DELETE") {
      const { id } = req.body;
      await sql`DELETE FROM notes WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error("Notes API error:", err);
    res.status(500).json({ error: err.message });
  }
}
