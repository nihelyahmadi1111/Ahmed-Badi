// test-chat.js — Run locally to verify api/chat.js works with the new model.
// Usage:  node test-chat.js
// Requires: GROQ_API_KEY in your .env (or set it as an env var before running)

require('fs').existsSync('.env') && require('fs')
  .readFileSync('.env', 'utf8')
  .split('\n')
  .forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length) process.env[key] = rest.join('=');
  });

const handler = require('./api/chat.js');

const TESTS = [
  {
    label: '✅ Happy path — normal legal question',
    body:  { message: 'Quels sont les domaines du cabinet ?', history: [] }
  },
  {
    label: '⚠️  Empty message — should return 400',
    body:  { message: '', history: [] }
  },
  {
    label: '⚠️  Missing body — should return 400',
    body:  {}
  },
];

function fakeRes() {
  let _status = 200;
  const res = {
    status(code) { _status = code; return res; },
    json(body)   {
      console.log('  HTTP', _status, '→', JSON.stringify(body, null, 2));
      return res;
    },
    _getStatus() { return _status; }
  };
  return res;
}

(async () => {
  for (const test of TESTS) {
    console.log('\n' + test.label);
    const req = { method: 'POST', body: test.body };
    await handler(req, fakeRes()).catch(e => console.error('  Uncaught:', e.message));
  }
  console.log('\nDone.');
})();
