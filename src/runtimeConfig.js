const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../runtimeConfig.json');

function _read() {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ botEnabled: false }, null, 2));
  }
  const data = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(data);
}

function _write(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

function getConfig() {
  return _read();
}

function updateConfig(updates) {
  const cfg = _read();
  const newCfg = { ...cfg, ...updates };
  _write(newCfg);
  return newCfg;
}

function toggleBot() {
  const cfg = _read();
  const newCfg = { ...cfg, botEnabled: !cfg.botEnabled };
  _write(newCfg);
  return newCfg;
}

module.exports = { getConfig, updateConfig, toggleBot }; 