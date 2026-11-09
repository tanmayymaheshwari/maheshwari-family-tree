const express = require("express");

const router = express.Router();

// Reports whether the HTTP service is available.
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

module.exports = router;
