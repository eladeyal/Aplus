const { Configuration, OpenAIApi } = require('openai');
const config = require('../config.json');
const { getSession, addMessage } = require('./sessionManager');
const fs = require('fs');
const path = require('path');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const scriptGuidelines = fs.readFileSync(path.resolve(__dirname, '../scriptGuidelines.txt'), 'utf-8');

async function generateResponse(userId, userMessage) {
  addMessage(userId, 'user', userMessage);

  const tone = process.env.CHAT_TONE || 'default';
  const profile = process.env.PROFILE || 'default';

  const systemPrompt = `${config.chatTones[tone]}\n${config.profiles[profile].description}\n
== Conversation Guidelines ==\n${scriptGuidelines}`;
  const sessionMessages = getSession(userId);

  const messages = [{ role: 'system', content: systemPrompt }, ...sessionMessages];

  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages,
    temperature: 0.7
  });

  const response = completion.data.choices[0].message.content;
  addMessage(userId, 'assistant', response);
  return response;
}

module.exports = { generateResponse }; 