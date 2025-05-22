const { Configuration, OpenAIApi } = require('openai');
const config = require('../config.json');
const { getSession, addMessage } = require('./sessionManager');
const fs = require('fs');
const path = require('path');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

async function generateResponse(userId, userMessage) {
  addMessage(userId, 'user', userMessage);
  // Load structured script guidelines from JSON
  const scriptPath = path.resolve(__dirname, '../scriptGuidelines.json');
  const scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
  // Build guidelines text
  const { triggers, openingMessage, genericReplies, otherScript } = scriptData;
  const scriptGuidelines = (() => {
    let text = '1. Triggers:\n' + triggers.map(t => '- ' + t).join('\n') + '\n\n';
    text += '2. Opening Message:\n"' + openingMessage + '"\n\n';
    text += '3. Generic Replies:\n' + genericReplies.map(r => '- ' + r).join('\n') + '\n\n';
    text += otherScript;
    return text;
  })();

  const tone = process.env.CHAT_TONE || 'default';
  const profile = process.env.PROFILE || 'default';

  const systemPrompt = `השב תמיד בעברית, כתוב מימין לשמאל, בסגנון אנושי, קצר ותמציתי, וספק שירות בלבד ללא ניסיונות מכירה.
${config.chatTones[tone]}
${config.profiles[profile].description}

== Conversation Guidelines ==
${scriptGuidelines}`;
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