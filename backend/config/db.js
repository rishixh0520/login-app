const { Pool } = require("pg");

const dbConfig = {};

if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
  dbConfig.ssl = { rejectUnauthorized: false };
} else {
  if (process.env.DB_USER) dbConfig.user = process.env.DB_USER;
  if (process.env.DB_HOST) dbConfig.host = process.env.DB_HOST;
  if (process.env.DB_NAME) dbConfig.database = process.env.DB_NAME;
  if (process.env.DB_PORT) dbConfig.port = process.env.DB_PORT;
  if (process.env.DB_PASSWORD) dbConfig.password = process.env.DB_PASSWORD;
}

const pool = new Pool(dbConfig);

module.exports = pool;
