require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const config = require('../config.json');
const { generateResponse } = require('./gptService');
const { sendMessage } = require('./whatsapp');
const logger = require('./logger');
const fs = require('fs');
const { clearSession } = require('./sessionManager');

const app = express();

// Basic auth for UI and simulation endpoints
const basicAuth = (req, res, next) => {
  if (req.path === '/webhook') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  const [scheme, encoded] = authHeader.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  if (user === 'haim' && pass === 'elinor1234') return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Authentication required');
};
app.use(basicAuth);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Simulation endpoint for local testing (bypasses Twilio integration)
app.post('/simulate', async (req, res) => {
  const from = req.body.from;
  const message = req.body.body;
  try {
    const reply = await generateResponse(from, message);
    const delay = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
      res.json({ reply });
    }, delay);
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

// Webhook endpoint for Twilio
app.post('/webhook', limiter, async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body;
  logger.info({ from, body });

  try {
    const reply = await generateResponse(from, body);
    const delay = Math.floor(Math.random() * 2000) + 1000;
    res.sendStatus(200);
    setTimeout(async () => {
      try {
        await sendMessage(from, reply);
        logger.info({ from, reply });
      } catch (err) {
        logger.error(err);
      }
    }, delay);
  } catch (error) {
    logger.error(error);
    res.sendStatus(500);
  }
});

// Serve WhatsApp sandbox config for UI
app.get('/whatsapp-config', (req, res) => {
  const number = process.env.WHATSAPP_NUMBER ? process.env.WHATSAPP_NUMBER.replace('whatsapp:', '') : '';
  const joinCode = process.env.SANDBOX_JOIN_CODE || '';
  res.json({ whatsappNumber: number, sandboxJoinCode: joinCode });
});

// Serve structured script guidelines as JSON
const guidelinesPath = path.resolve(__dirname, '../scriptGuidelines.json');
app.get('/guidelines', (req, res) => {
  fs.readFile(guidelinesPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Cannot read guidelines' });
    res.json(JSON.parse(data));
  });
});

// Update structured script guidelines from JSON body
app.post('/guidelines', (req, res) => {
  const newGuidelines = req.body;
  fs.writeFile(guidelinesPath, JSON.stringify(newGuidelines, null, 2), 'utf8', err => {
    if (err) return res.status(500).json({ error: 'Cannot write guidelines' });
    res.sendStatus(200);
  });
});

// Reset conversation for a user
app.post('/reset', async (req, res) => {
  const userId = req.body.from || req.body.From;
  clearSession(userId);
  return res.sendStatus(200);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app; 