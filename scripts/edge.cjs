const { chromium } = require('playwright-core');

const BASE = 'http://127.0.0.1:8123';
let failures = 0;
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra}`);
  if (!cond) failures++;
}

async function dismissDisclaimer(page) {
  await page.waitForTimeout(400);
  if (await page.isVisible('#disclaimerOverlay')) {
    await page.check('#disclaimerCheck');
    await page.click('#disclaimerAcceptBtn');
    await page.waitForTimeout(300);
  }
}

(async () => {
  const browser = await chromium.launch();

  // 1. Unknown route -> not-found, back to library works
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
    // Static export: unknown paths serve out/404.html (Cloudflare) — same file here.
    await page.goto(BASE + '/404.html', { waitUntil: 'networkidle' });
    check('not-found content', (await page.textContent('#stage')).includes('Page not found'));
    await dismissDisclaimer(page);
    await page.click('#stage a.back-btn');
    await page.waitForURL(BASE + '/', { timeout: 5000 });
    check('not-found back to library', page.url().endsWith('/'));
    check('not-found clean', errors.length === 0, JSON.stringify(errors));
    await page.close();
  }

  // 2. Back/forward
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('a.cp-card[href="/topic/dyspnea/"]');
    await page.waitForURL('**/topic/dyspnea**', { timeout: 5000 });
    await page.goBack();
    await page.waitForURL(BASE + '/', { timeout: 5000 });
    check('back returns home', (await page.textContent('#stage')).includes('Build your clinical reasoning'));
    await page.goForward();
    await page.waitForURL('**/topic/dyspnea**', { timeout: 5000 });
    check('forward returns topic', (await page.textContent('#stage')).includes('Shortness of Breath'));
    await page.close();
  }

  // 3. Malformed localStorage degrades gracefully
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('em-cps-prefs', '{not json');
      localStorage.setItem('em-cps-learning', '[1,2,3]');
      localStorage.setItem('em-student-progress', '42');
      localStorage.setItem('em-ecg-learning-v1', 'null');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check('malformed storage still renders', (await page.textContent('#stage')).includes('Build your clinical reasoning'));
    check('malformed storage defaults theme', (await page.getAttribute('html', 'data-theme')) === 'light');
    check('malformed storage clean', errors.length === 0, JSON.stringify(errors));
    await page.close();
  }

  // 4. Prefs persist across reload (dark + scale + sidebar)
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('#toolsToggle');
    await page.click('#themeBtn');
    await page.click('#fontUp');
    await page.click('#collapseBtn');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const theme = await page.getAttribute('html', 'data-theme');
    const scale = await page.evaluate(() => document.documentElement.style.getPropertyValue('--type-scale'));
    const collapsed = await page.evaluate(() => document.documentElement.classList.contains('sidebar-collapsed'));
    check('dark reload', theme === 'dark', ` ${theme}`);
    check('scale reload', scale === '1.12', ` ${scale}`);
    check('sidebar reload', collapsed === true);
    // reset for other tests
    await page.click('#toolsToggle');
    await page.click('#themeBtn');
    await page.close();
  }

  // 5. Rapid navigation
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('a.cp-card[href="/topic/chest-pain/"]');
    await page.click('#topbarTools, .topbar');
    await page.goto(BASE + '/topic/dyspnea');
    await page.goto(BASE + '/topic/shock');
    await page.waitForTimeout(600);
    check('rapid nav lands correctly', page.url().includes('/topic/shock'));
    check('rapid nav clean', errors.length === 0, JSON.stringify(errors));
    await page.close();
  }

  // 6. Repeated explorer switching
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
    await page.goto(BASE + '/explorer/normal', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    for (let i = 0; i < 6; i++) {
      await page.click('.explorer-controls [aria-label="Next ECG"]');
      await page.waitForTimeout(250);
    }
    const h2 = await page.textContent('.explorer-findings h2');
    check('repeated switching stable', h2.length > 3, ` now=${h2.slice(0, 40)}`);
    check('switching clean', errors.length === 0, JSON.stringify(errors));
    await page.close();
  }

  // 7. Search edge cases
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.fill('#searchInput', 'x');
    await page.waitForTimeout(300);
    check('short query hides results', !(await page.isVisible('.results-pop')));
    await page.fill('#searchInput', 'zzzqxy');
    await page.waitForTimeout(400);
    const none = await page.textContent('.results-pop');
    check('no-result message', none.includes('No results'));
    await page.fill('#searchInput', 'WELLENS');
    await page.waitForSelector('.results-pop .res-item[data-id]', { timeout: 5000 });
    await page.click('.results-pop .res-item[data-id]');
    await page.waitForTimeout(800);
    check('abbrev/case search navigates (explorer case)', page.url().includes('/explorer/wellens-b/'), ` ${page.url()}`);
    // severity filter + search together
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.click('.context-filters summary');
    await page.click('[data-sev="critical"]');
    await page.fill('#searchInput', 'chest pain');
    await page.waitForSelector('.results-pop .res-item[data-id]', { timeout: 5000 });
    check('filter+search coexist', true);
    await page.close();
  }

  // 8. Workbench usable at 320px
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 320, height: 700 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
    await page.goto(BASE + '/ecg/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('.ecg-fig [data-ecg-tool="expand"] >> nth=0');
    await page.waitForTimeout(500);
    const o = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
    }));
    check('workbench 320px no overflow', o.sw <= o.iw + 1, ` ${o.sw} vs ${o.iw}`);
    await page.keyboard.press('Escape');
    await page.close();
  }

  await browser.close();
  console.log(failures ? `EDGE-FAIL (${failures})` : 'EDGE-PASS');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('RUNNER-FAIL', e); process.exit(2); });
