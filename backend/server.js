
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const cors = require("cors");
app.use(cors());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

app.get("/api/family-members", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM family_members
      ORDER BY first_name, last_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch family members:", error.message);
    res.status(500).json({ error: "Failed to fetch family members" });
  }
});

app.get("/api/family-relationships", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        member_id,
        related_member_id,
        relationship_type
      FROM family_relationships
      ORDER BY created_at
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch relationships:", error.message);
    res.status(500).json({
      error: "Failed to fetch family relationships"
    });
  }
});

app.get("/api/family-tree", async (req, res) => {
  try {
    const [members, relationships] = await Promise.all([
      pool.query("SELECT * FROM family_members ORDER BY first_name, last_name"),
      pool.query(`
        SELECT id, member_id, related_member_id, relationship_type
        FROM family_relationships
      `)
    ]);

    res.json({
      members: members.rows,
      relationships: relationships.rows
    });
  } catch (error) {
    console.error("Failed to fetch family tree:", error.message);
    res.status(500).json({ error: "Failed to fetch family tree" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

const pool = require("./db");

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.json({ status: "Connected", ...result.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Database connection failed" });
  }
});
