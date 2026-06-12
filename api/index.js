const initDb = require('../backend/config/initDb');
const app = require('../backend/server');

// Initialize DB once (cached across warm invocations)
let dbReady = initDb().catch((err) => {
  console.error('DB init warning:', err.message);
});

module.exports = async (req, res) => {
  await dbReady;
  app(req, res);
};
