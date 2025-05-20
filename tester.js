require('dotenv').config();
const axios = require('axios');

async function testConversation() {
  const url = `http://localhost:${process.env.PORT || 3000}/simulate`;
  const testUser = process.env.TEST_WHATSAPP_NUMBER || 'test-user';
  const messages = ['Hello', 'What products do you offer?', 'Thank you!'];
  
  for (const msg of messages) {
    try {
      const res = await axios.post(
        url,
        { from: testUser, body: msg },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(`User: ${msg}`);
      console.log(`Bot: ${res.data.reply}`);
    } catch (error) {
      console.error('Simulation error:', error.response ? error.response.data : error.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

testConversation(); 