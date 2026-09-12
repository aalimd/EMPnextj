const { chromium } = require('playwright-core');

const BASE = 'http://127.0.0.1:8123';
const PAGES = ['/', '/topic/chest-pain/', '/ecg/', '/explorer/normal/', '/study/due/', '/shift/dyspnea/'];
const WIDTHS = [320, 375, 390, 430, 768, 1280];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const path of PAGES) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      return { scrollWidth: de.scrollWidth, innerWidth: window.innerWidth };
    });
    const overflowed = overflow.scrollWidth > overflow.innerWidth + 1;
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(250);
      const o = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      if (o.scrollWidth > o.innerWidth + 1) {
        console.log(`OVERFLOW ${path} @${w}px: scrollWidth=${o.scrollWidth} inner=${o.innerWidth}`);
        failures++;
      }
    }
    console.log(`${errors.length ? 'CONSOLE-ERRORS' : 'CLEAN'} ${path} initial-overflow=${overflowed} errors=${JSON.stringify(errors.slice(0, 3))}`);
    if (errors.length) failures++;
    await page.close();
  }
  await browser.close();
  console.log(failures ? `SMOKE-FAIL (${failures})` : 'SMOKE-PASS');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('SMOKE-RUNNER-FAIL', e); process.exit(2); });
