const { Pool } = require("pg");

// Shares one SSL-enabled PostgreSQL connection pool across route modules.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
