
require("dotenv").config();

const app = require("./app");
const PORT = process.env.PORT || 5000;

// Starts the HTTP server after routes and middleware are configured.
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
