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

  // 1. Search
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.fill('#searchInput', 'chest pain');
    await page.waitForSelector('.results-pop .res-item[data-id]', { timeout: 5000 });
    const first = await page.textContent('.results-pop .res-item[data-id] .r-title');
    await page.click('.results-pop .res-item[data-id]');
    await page.waitForURL('**/topic/chest-pain**', { timeout: 5000 });
    check('search navigates to topic', page.url().includes('/topic/chest-pain'), ` first=${first}`);
    check('search page clean', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await page.close();
  }

  // 2. Disclaimer gate
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const visible = await page.isVisible('#disclaimerOverlay');
    check('disclaimer shows when not agreed', visible);
    const disabled = await page.isDisabled('#disclaimerAcceptBtn');
    check('accept disabled until checkbox', disabled);
    await page.check('#disclaimerCheck');
    await page.click('#disclaimerAcceptBtn');
    await page.waitForTimeout(300);
    check('disclaimer dismissed after accept', !(await page.isVisible('#disclaimerOverlay')));
    const stored = await page.evaluate(() => localStorage.getItem('em-cps-disclaimer-agreed'));
    check('disclaimer persisted', stored === '1');
    await page.close();
  }

  // 3. Red-flag checklist
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/topic/chest-pain/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.check('.rf-item input >> nth=0');
    const banner = await page.textContent('#rfBanner');
    check('red-flag banner updates', banner.includes('1 warning sign'));
    const bar = await page.getAttribute('#rfBar', 'style');
    check('red-flag progress bar', bar && bar.includes('%') && !bar.includes('0%'), ` ${bar}`);
    await page.close();
  }

  // 4. Explorer findings + practice
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(BASE + '/explorer/normal/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('.explorer-finding-list [data-finding="1"]');
    const expl = await page.textContent('.explorer-explanation');
    check('explorer finding explanation', expl.length > 50, ` len=${expl.length}`);
    const marks = await page.locator('.ecg-finding-marks ellipse').count();
    check('explorer red highlight marks', marks > 0, ` marks=${marks}`);
    await page.goto(BASE + '/explorer/practice', { waitUntil: 'networkidle' });
    const reveal = await page.isVisible('[data-action="reveal"], .ex-primary');
    check('explorer practice conceal+reveal', reveal);
    check('explorer clean', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await page.close();
  }

  // 5. Study case + learn workspace
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(BASE + '/study/case/chest-pain', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    const opts = await page.locator('.quiz-option').count();
    check('study case quiz renders', opts >= 3, ` options=${opts}`);
    await page.goto(BASE + '/study/learn/practice', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const cards = await page.locator('.workspace-card').count();
    check('learn workspace mounts', cards > 0, ` cards=${cards}`);
    check('study clean', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await page.close();
  }

  // 6. Legacy hash deep links
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/#chest-pain', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check('hash #chest-pain redirects', page.url().includes('/topic/chest-pain'), ` ${page.url()}`);
    await page.goto(BASE + '/#ecg-explorer~normal', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check('hash #ecg-explorer~normal redirects', page.url().includes('/explorer/normal'), ` ${page.url()}`);
    await page.goto(BASE + '/#study~case', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    check('hash #study~case redirects', page.url().includes('/study/case'), ` ${page.url()}`);
    await page.close();
  }

  // 7. Theme + prefs persistence
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('#toolsToggle');
    await page.click('#themeBtn');
    await page.waitForTimeout(300);
    const theme = await page.getAttribute('html', 'data-theme');
    const stored = await page.evaluate(() => localStorage.getItem('em-cps-prefs'));
    check('dark mode applies+persist', theme === 'dark' && stored.includes('"theme":"dark"'), ` ${theme}`);
    await page.click('#themeBtn');
    await page.close();
  }

  // 8. ECG workbench opens from guide
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto(BASE + '/ecg/', { waitUntil: 'networkidle' });
    await dismissDisclaimer(page);
    await page.click('.ecg-fig [data-ecg-tool="expand"] >> nth=0');
    await page.waitForTimeout(500);
    const bench = await page.isVisible('#ecgWorkbench, .ecg-workbench');
    check('ecg workbench opens', bench);
    check('workbench clean', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await page.close();
  }

  await browser.close();
  console.log(failures ? `INTERACT-FAIL (${failures})` : 'INTERACT-PASS');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('INTERACT-RUNNER-FAIL', e); process.exit(2); });
