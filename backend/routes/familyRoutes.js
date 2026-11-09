const express = require("express");

const pool = require("../db");

const router = express.Router();

// Returns an alphabetized list of every family member.
router.get("/family-members", async (req, res) => {
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

// Returns relationship records in their creation order.
router.get("/family-relationships", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, member_id, related_member_id, relationship_type
      FROM family_relationships
      ORDER BY created_at
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch relationships:", error.message);
    res.status(500).json({ error: "Failed to fetch family relationships" });
  }
});

// Returns the complete dataset required to render the interactive tree.
router.get("/family-tree", async (req, res) => {
  try {
    const [members, relationships] = await Promise.all([
      pool.query("SELECT * FROM family_members ORDER BY first_name, last_name"),
      pool.query(`
        SELECT id, member_id, related_member_id, relationship_type
        FROM family_relationships
      `),
    ]);

    res.json({
      members: members.rows,
      relationships: relationships.rows,
    });
  } catch (error) {
    console.error("Failed to fetch family tree:", error.message);
    res.status(500).json({ error: "Failed to fetch family tree" });
  }
});

module.exports = router;
