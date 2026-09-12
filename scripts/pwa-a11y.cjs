const { chromium } = require('playwright-core');

const BASE = 'http://127.0.0.1:8123';
let failures = 0;
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra}`);
  if (!cond) failures++;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Agree disclaimer so SW + app settle
  if (await page.isVisible('#disclaimerOverlay')) {
    await page.check('#disclaimerCheck');
    await page.click('#disclaimerAcceptBtn');
    await page.waitForTimeout(300);
  }
  // Visit key routes online so the SW caches them
  for (const p of ['/topic/chest-pain/', '/ecg/', '/explorer/normal/']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
  }
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 15000 }).catch(() => {});
  const sw = await page.evaluate(async () => !!navigator.serviceWorker?.controller);
  check('service worker controls page', sw);
  await ctx.setOffline(true);
  await page.goto(BASE + '/topic/chest-pain/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  const body = await page.textContent('#stage').catch(() => '');
  check('offline revisit renders topic', body.includes('Chest Pain'), ` len=${body.length}`);
  await page.goto(BASE + '/ecg/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  const ecg = await page.textContent('#stage').catch(() => '');
  check('offline revisit renders ecg guide', ecg.includes('ECG interpretation'), ` len=${ecg.length}`);
  await ctx.setOffline(false);

  // A11y DOM spot checks on a fresh page
  const a11y = await browser.newPage();
  await a11y.goto(BASE + '/topic/dyspnea/', { waitUntil: 'networkidle' });
  const skip = await a11y.getAttribute('.skip-link', 'href');
  check('skip link targets stage', skip === '#stage');
  const noAlt = await a11y.evaluate(() =>
    Array.from(document.querySelectorAll('img')).filter((img) => img.getAttribute('alt') === null).length,
  );
  check('images have alt', noAlt === 0, ` missing=${noAlt}`);
  const unlabeled = await a11y.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter((b) => !(b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('title'))).length,
  );
  check('buttons have accessible names', unlabeled === 0, ` unlabeled=${unlabeled}`);
  const h1 = await a11y.locator('main h1').count();
  check('main has h1', h1 >= 1);
  const lang = await a11y.getAttribute('html', 'lang');
  check('html lang set', lang === 'en');
  await browser.close();
  console.log(failures ? `PWA-A11Y-FAIL (${failures})` : 'PWA-A11Y-PASS');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('RUNNER-FAIL', e); process.exit(2); });
