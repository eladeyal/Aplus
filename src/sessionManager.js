// Simple in-memory session store
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, []);
  }
  return sessions.get(userId);
}

function addMessage(userId, role, content) {
  const session = getSession(userId);
  session.push({ role, content });
  // Keep last 20 messages
  if (session.length > 20) {
    session.shift();
  }
}

function clearSession(userId) {
  sessions.delete(userId);
}

module.exports = { getSession, addMessage, clearSession }; 