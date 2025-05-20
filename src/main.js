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

const app = express();

// Admin API: get bot status and toggle on/off
app.get('/admin/config', (req, res) => {
  const { botEnabled } = getConfig();
  res.json({ botEnabled });
});
app.post('/admin/toggle', (req, res) => {
  const { botEnabled } = toggleBot();
  res.json({ botEnabled });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
  const from = req.body.from;
  const message = req.body.body;
  try {
    const reply = await generateResponse(from, message);
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