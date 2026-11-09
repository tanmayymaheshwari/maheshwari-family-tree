const express = require("express");

const pool = require("../db");

const router = express.Router();

// Verifies that the API can reach its configured PostgreSQL database.
router.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.json({ status: "Connected", ...result.rows[0] });
  } catch (error) {
    console.error("Database connection test failed:", error.message);
    res.status(500).json({ status: "Database connection failed" });
  }
});

module.exports = router;
