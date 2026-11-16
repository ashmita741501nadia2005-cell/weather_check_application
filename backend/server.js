
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

for (const v of ["MONGO_URI", "JWT_SECRET", "WEATHER_API_KEY"]) {
  if (!process.env[v]) {
    console.error(`Missing ${v} in backend/.env`);
    process.exit(1);
  }
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Weather API running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/weather", require("./routes/weather"));
app.use("/api/favorites", require("./routes/favorites"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
