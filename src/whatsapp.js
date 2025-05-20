// Load .env variables
require('dotenv').config();
console.log('TWILIO_ACCOUNT_SID=', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN=', process.env.TWILIO_AUTH_TOKEN);

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendMessage(to, body) {
  return await client.messages.create({
    from: process.env.WHATSAPP_NUMBER,
    to,
    body
  });
}

module.exports = { sendMessage }; 