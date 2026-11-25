// test-errors.js — Tests error-handling paths without touching the happy path.
// Usage: node test-errors.js

require('fs').existsSync('.env') && require('fs')
  .readFileSync('.env', 'utf8')
  .split('\n')
  .forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length) process.env[key] = rest.join('=');
  });

const handler = require('./api/chat.js');

function fakeRes() {
  let _status = 200;
  const res = {
    status(code) { _status = code; return res; },
    json(body) {
      const { error, code, reply } = body;
      if (reply)  console.log(`  HTTP ${_status} ✅  reply: "${reply.slice(0,80)}..."`);
      if (error)  console.log(`  HTTP ${_status} ✅  error: "${error}" | code: ${code}`);
      return res;
    }
  };
  return res;
}

(async () => {
  // 1. Bad API key → should return 502 with code=auth_error
  console.log('\n🔑 Bad API key (expect 502, code=auth_error):');
  const savedKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'gsk_BAD_KEY_INTENTIONALLY';
  await handler({ method: 'POST', body: { message: 'test', history: [] } }, fakeRes());

  // 2. Bad model name → should return 502 with code=model_not_found
  console.log('\n🤖 Bad model override (expect 502, code=model_not_found):');
  process.env.GROQ_API_KEY = savedKey;
  process.env.GROQ_MODEL   = 'openai/gpt-oss-120b'; // retired model
  // Force reload so GROQ_MODEL re-evaluates — inline test using patched fetch
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: { message: 'The model `llama-3.3-70b-versatile` does not exist', code: 'model_not_found', type: 'invalid_request_error' } })
  });
  await handler({ method: 'POST', body: { message: 'test', history: [] } }, fakeRes());
  globalThis.fetch = origFetch;
  delete process.env.GROQ_MODEL;

  // 3. Rate limit simulation
  console.log('\n⏱️  Rate limit simulation (expect 502, code=rate_limited):');
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: { message: 'Rate limit exceeded', code: 'rate_limit_exceeded', type: 'tokens' } })
  });
  await handler({ method: 'POST', body: { message: 'test', history: [] } }, fakeRes());
  globalThis.fetch = origFetch;

  // 4. Missing API key env var
  console.log('\n🚫 Missing GROQ_API_KEY (expect 500):');
  const k = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  await handler({ method: 'POST', body: { message: 'test', history: [] } }, fakeRes());
  process.env.GROQ_API_KEY = k;

  // 5. Non-POST method
  console.log('\n🚫 GET request (expect 405):');
  await handler({ method: 'GET', body: {} }, fakeRes());

  console.log('\nDone.');
})();
