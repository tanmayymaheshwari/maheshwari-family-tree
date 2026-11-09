const express = require("express");

const corsMiddleware = require("./middleware/corsMiddleware");
const databaseRoutes = require("./routes/databaseRoutes");
const familyRoutes = require("./routes/familyRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

// Parses JSON request bodies before route handlers use them.
app.use(express.json());

// Lets the separately hosted frontend call the backend API.
app.use(corsMiddleware);

// Registers the health, database, and family-tree API endpoints.
app.use(healthRoutes);
app.use(databaseRoutes);
app.use("/api", familyRoutes);

module.exports = app;
