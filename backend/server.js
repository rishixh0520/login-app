require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const cors = require("cors");
const fs = require("fs");
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
const analyticsRoutes = require("./src/routes/analytics.routes");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:5173", "https://*.onrender.com"]
    }
  }
}));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use("/api/", apiLimiter);

// CORS – open for all origins in development, restricted in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // No origin = same-origin or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

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
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/analytics", analyticsRoutes);

const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Centralized Error Handling Middleware (must be after routes)
app.use(errorHandler);

// Only start listening when run directly (not when imported by Vercel serverless)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      logger.error("Failed to initialize database", { error: err });
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} (DB offline)`);
      });
    });
}

module.exports = app;
