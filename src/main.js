require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const config = require('../config.json');
const { generateResponse } = require('./gptService');
const { sendMessage } = require('./whatsapp');
const logger = require('./logger');
const { getConfig, updateConfig, toggleBot } = require('./runtimeConfig');
const basicAuth = require('express-basic-auth');

const app = express();

// Add in-memory stats
const stats = { simulateCount: 0, webhookCount: 0, totalResponseTime: 0, simulateRequests: 0 };

// Admin credentials (set via ENV)
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'password';
const auth = basicAuth({ users: { [adminUser]: adminPassword }, challenge: true });

// Admin API: get bot status and toggle on/off
app.get('/admin/config', (req, res) => {
  const { botEnabled } = getConfig();
  res.json({ botEnabled });
});
// New: stats endpoint
app.get('/admin/stats', auth, (req, res) => {
  const avgResponseTime = stats.simulateRequests
    ? stats.totalResponseTime / stats.simulateRequests
    : 0;
  res.json({
    totalSimulations: stats.simulateCount,
    totalWebhooks: stats.webhookCount,
    averageResponseTime: Number(avgResponseTime.toFixed(2))
  });
});
app.post('/admin/toggle', (req, res) => {
  const { botEnabled } = toggleBot();
  res.json({ botEnabled });
});

// Serve protected Admin Dashboard
app.get('/admin.html', auth, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/admin.html'));
});
// Protect admin API routes
app.use('/admin', auth);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve unified dashboard (protected) at root
app.get('/', auth, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/dashboard.html'));
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Check if bot is enabled
function ensureBotEnabled(res, next) {
  if (!getConfig().botEnabled) {
    return res.status(503).send('Bot is currently disabled');
  }
  next();
}

// Simulation endpoint for local testing (bypasses Twilio integration)
app.post('/simulate', ensureBotEnabled, async (req, res) => {
  stats.simulateCount++;
  const startTime = Date.now();
  const from = req.body.from;
  const message = req.body.body;
  try {
    const reply = await generateResponse(from, message);
    const duration = Date.now() - startTime;
    stats.totalResponseTime += duration;
    stats.simulateRequests++;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Simulation error' });
  }
});

// Rate limiter per phone number
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || config.rateLimitWindowMs),
  max: Number(process.env.RATE_LIMIT_MAX || config.rateLimitMax),
  keyGenerator: (req) => req.body.From,
  handler: (req, res) => res.status(429).send('Too Many Requests')
});

app.post('/webhook', ensureBotEnabled, limiter, async (req, res) => {
  stats.webhookCount++;
  const from = req.body.From;
  const body = req.body.Body;
  logger.info({ from, body });

  try {
    const reply = await generateResponse(from, body);
    await sendMessage(from, reply);
    logger.info({ from, reply });
    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
});

// Only listen when running locally, not in Netlify Functions
if (!process.env.NETLIFY) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app; 