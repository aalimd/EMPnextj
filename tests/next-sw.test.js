'use strict';
// Next.js service worker (public/sw.js). Run: node --test tests/next-sw.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function worker({ offline = false } = {}) {
  const handlers = {};
  const ok = { status: 200, type: 'basic', clone() { return this; }, url: 'net' };
  const fetched = [];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    URL,
    Promise,
    Response,
    self: {
      registration: { scope: 'https://example.test/' },
      location: new URL('https://example.test/'),
      addEventListener(type, handler) { handlers[type] = handler; },
    },
    fetch: async (request) => {
      fetched.push(typeof request === 'string' ? request : request.url);
      if (offline) throw new Error('offline');
      return ok;
    },
    caches: {
      open: async () => ({ match: async () => undefined, put: async () => {} }),
    },
  });
  return {
    ok,
    fetched,
    async fetch(path, extras = {}) {
      let result;
      handlers.fetch({
        request: {
          method: 'GET',
          url: new URL(path, 'https://example.test/').href,
          mode: extras.mode || 'cors',
          destination: extras.destination || '',
        },
        respondWith(p) { result = p; },
      });
      return result === undefined ? undefined : result;
    },
  };
}

test('RSC flight requests bypass the HTML app-shell fallback', async () => {
  const w = worker();
  const rsc = await w.fetch('/index.txt?_rsc=abc');
  assert.equal(rsc, w.ok);
  assert.ok(w.fetched.some((u) => u.includes('_rsc=abc')));
  const shift = await w.fetch('/shift/chest-pain/index.txt?_rsc=sy0e3');
  assert.equal(shift, w.ok);
});

test('RSC flight requests do not intercept other origins', async () => {
  const w = worker();
  assert.equal(await w.fetch('https://example.com/index.txt?_rsc=1'), undefined);
});
