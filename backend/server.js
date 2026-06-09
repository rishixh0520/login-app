require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const cors = require("cors");
const path = require("path");
const initDb = require("./config/initDb");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const authRoutes = require("./routes/auth");
const assetsRoutes = require("./src/routes/assets.routes");
const notificationsRoutes = require("./src/routes/notifications.routes");
const advancedReportsRoutes = require("./src/routes/reports.routes");
const searchRoutes = require("./src/routes/search.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");

const app = express();

app.use(helmet());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use("/api/", apiLimiter);

app.use(cors());
app.use(express.json());

// Basic Swagger setup
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'LoginApp API',
    version: '1.0.0',
    description: 'API Documentation for the Employee Management System'
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Login User',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } }
            }
          }
        },
        responses: { '200': { description: 'Success' } }
      }
    }
  }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/departments", require("./routes/departments"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api", require("./routes/reports")); // Old dashboard stats

// Day 5 New Routes
app.use("/api/assets", assetsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/advanced-reports", advancedReportsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/attendance", attendanceRoutes);

// Centralized Error Handling Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Database before starting the server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to initialize database", { error: err });
    console.error("Failed to initialize database, starting server anyway...", err);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DB offline)`);
    });
  });

