require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const initDb = require("./config/initDb");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/departments", require("./routes/departments"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api", require("./routes/reports"));

const PORT = process.env.PORT || 5000;

// Initialize Database before starting the server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database, starting server anyway...", err);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DB offline)`);
    });
  });

