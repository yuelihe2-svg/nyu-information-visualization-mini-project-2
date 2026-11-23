import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { csvParse } from 'd3';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const records = csvParse(await readFile(resolve(root, 'data/food_spending.csv'), 'utf8'));
const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', offline: true });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.goto(pathToFileURL(resolve(root, 'output/prototype/Food_Budget_Atlas.html')).href);
  await page.waitForFunction(() => document.querySelector('#share-value')?.textContent === '15.7');
  assert.deepEqual(requests, [], 'Portable startup must not request network assets');
  checks.push('Portable HTML loads offline through file:// with no network requests.');
  const expectedOrder = ['Highest', 'Fourth', 'Middle', 'Second', 'Lowest'];
  for (const chart of ['#quintile-chart', '#composition-chart']) {
    assert.deepEqual(await page.locator(`${chart} .row-label`).allTextContents(), expectedOrder.map(q => `${q} 20%`));
    const positions = await page.locator(`${chart} .row-label`).evaluateAll(ns => ns.map(n => n.getBoundingClientRect().y));
    assert(positions.every((y,i) => i === 0 || y > positions[i-1]), 'Higher-income rows must be above lower-income rows');
  }
  assert.deepEqual(await page.locator('.dot-hit').evaluateAll(ns => ns.map(n => n.__data__.income_quintile)), expectedOrder);
  assert.deepEqual(await page.locator('.segment').evaluateAll(ns => ns.map(n => n.__data__.row.income_quintile)), expectedOrder.flatMap(q => [q,q]));
  assert.deepEqual(await page.locator('#quintile-select option').evaluateAll(ns => ns.map(n => n.value)), expectedOrder);
  assert.deepEqual(await page.locator('#comparison-table tbody th').allTextContents(), expectedOrder.map(q => `2024 · ${q} 20%`));
  checks.push('Dot/bar rows, keyboard mark order, income options and comparison table consistently run Highest to Lowest.');

  // Exercise every year, category and quintile through the public controls.
  for (const type of ['all', 'home', 'away']) {
    await page.locator(`[data-type="${type}"]`).click();
    for (const year of Array.from({length: 10}, (_, i) => 2015 + i)) {
      await page.selectOption('#year-select', String(year));
      for (const quintile of ['Lowest', 'Second', 'Middle', 'Fourth', 'Highest']) {
        await page.locator(`.dot-hit[aria-label^="${quintile} 20%"]`).dispatchEvent('click');
        const row = records.find(r => r.year === String(year) && r.income_quintile === quintile);
        const field = {all:'food_total_usd', home:'food_at_home_usd', away:'food_away_from_home_usd'}[type];
        const expected = (100 * Number(row[field]) / Number(row.total_expenditures_usd)).toFixed(1);
        assert.equal(await page.locator('#share-value').innerText(), expected);
        assert.equal(await page.locator('.dot-hit[aria-pressed="true"]').count(), 1);
        assert((await page.locator('#composition-context').innerText()).includes(quintile));
        assert((await page.locator('#trend-context').innerText()).includes(`${quintile} 20%`));
        assert((await page.locator('#compare-context').innerText()).includes(String(year)));
        assert.equal(await page.locator('#comparison-table tbody tr').count(), 5);
        assert.equal(await page.locator('#history-table tbody tr').count(), 10);
        assert((await page.locator('#comparison-table caption').textContent()).includes(String(year)));
        assert((await page.locator('#history-table caption').textContent()).includes(quintile));
        const ranked = records.filter(r => r.year === String(year)).sort((a,b) => Number(b[field])/Number(b.total_expenditures_usd) - Number(a[field])/Number(a.total_expenditures_usd));
        assert((await page.locator('#quintile-title').innerText()).startsWith(ranked[0].income_quintile));
      }
    }
  }
  checks.push('All 150 year x category x quintile states match the frozen CSV and update chart contexts.');
  await page.locator('#reset-button').click();
  await page.locator('#data-details summary').click();
  const dataRow = await page.locator('#comparison-table tbody tr').filter({hasText:'Lowest 20%'}).innerText();
  assert(dataRow.includes('$35,046') && dataRow.includes('$5,498') && dataRow.includes('15.7%'));
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-data').click();
  const download = await downloadPromise;
  const exported = csvParse(await readFile(await download.path(), 'utf8'));
  assert.equal(exported.length, 50);
  for (const row of exported) {
    const source = records.find(r => r.year === row.year && r.income_quintile === row.income_quintile);
    assert.equal(row.food_total_usd, source.food_total_usd);
    assert(Math.abs(Number(row.food_share_pct) - 100 * Number(source.food_total_usd) / Number(source.total_expenditures_usd)) < 1e-9);
  }
  checks.push('Linked native tables, data-derived comparison titles and all 50 exported CSV values checked against source.');
  // Check actual rendered essential mark colors, including opacity; grids are decorative.
  const contrasts = await page.evaluate(() => {
    const luminance = rgb => rgb.map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum,x,i) => sum + x * [.2126,.7152,.0722][i],0);
    return [...document.querySelectorAll('.data-dot,.segment,.trend-point,.trend-line,.year-marker')].map(el => {
      const s = getComputedStyle(el), color = el.matches('path,line') ? s.stroke : s.fill;
      const rgb = color.match(/[\d.]+/g).slice(0,3).map(Number);
      const blended = rgb.map(x => x * Number(s.opacity) + 255 * (1 - Number(s.opacity)));
      return 1.05 / (luminance(blended) + .05);
    });
  });
  assert(Math.min(...contrasts) >= 3, `Minimum mark contrast: ${Math.min(...contrasts)}`);
  checks.push(`Essential data marks on white meet 3:1 contrast (minimum ${Math.min(...contrasts).toFixed(2)}:1); selection also uses labels, outlines and width.`);
  await page.locator('.dot-hit').first().focus();
  assert(await page.locator('#tooltip').evaluate(n => n.classList.contains('visible')));
  assert((await page.locator('#tooltip').innerText()).includes('Annual spending:'));
  await page.keyboard.press('Escape');
  assert(!await page.locator('#tooltip').evaluate(n => n.classList.contains('visible')));
  await page.locator('.segment[aria-label^="Middle 20%, away"]').focus();
  await page.keyboard.press('Space');
  assert((await page.locator('#selected-label').innerText()).startsWith('MIDDLE'));
  assert.equal(await page.locator('[data-type="away"]').getAttribute('aria-pressed'), 'true');
  checks.push('Keyboard details, Escape dismissal, Space selection and pressed-state announcements work.');

  for (const width of [320, 390, 768, 1280, 1600]) {
    await page.setViewportSize({width, height:900});
    await page.waitForTimeout(80);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}px`);
  }
  checks.push('No horizontal overflow at 320, 390, 768, 1280 and 1600 px.');
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#reset-button').click();
  await page.locator('[data-mode="overlay"]').click();
  await page.locator('.trend-hit').last().scrollIntoViewIfNeeded();
  await page.locator('.trend-hit').last().hover();
  const bounds = await page.locator('#tooltip').boundingBox();
  assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 900);
  checks.push('Tooltip stays within the viewport near the lower chart edge.');
  await page.locator('#data-details summary').click();
  await mkdir(resolve(root, 'tmp/accessibility'), {recursive:true});
  await page.pdf({path:resolve(root,'tmp/accessibility/print-review.pdf'),preferCSSPageSize:true,printBackground:true});
  assert.equal(await page.locator('#data-details').getAttribute('open'), null, 'Print restores collapsed data section');
  const cdp = await context.newCDPSession(page);
  for (const type of ['deuteranopia','protanopia','tritanopia','achromatopsia']) {
    await cdp.send('Emulation.setEmulatedVisionDeficiency', {type});
    await page.locator('.dashboard-grid').screenshot({path:resolve(root,`tmp/accessibility/${type}.png`)});
  }
  checks.push('Print PDF generated with tables; four browser color-vision simulations captured for visual review. No real screen-reader user test claimed.');
  assert.deepEqual(errors, []);
  checks.push('No uncaught browser errors.');
  await mkdir(resolve(root, 'output/prototype'), {recursive:true});
  await writeFile(resolve(root, 'output/prototype/verification.json'), JSON.stringify({checked_on:'2026-11-10', browser:'Microsoft Edge / Chromium', checks, human_peer_testing:'Not conducted; not replaced by automated checks.'}, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
