import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { csvParse } from 'd3';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const records = csvParse(await readFile(resolve(root, 'data/food_spending.csv'), 'utf8'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
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
      }
    }
  }
  checks.push('All 150 year x category x quintile states match the frozen CSV and update chart contexts.');
  await page.locator('#reset-button').click();
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
  await page.locator('.trend-hit').last().scrollIntoViewIfNeeded();
  await page.locator('.trend-hit').last().hover();
  const bounds = await page.locator('#tooltip').boundingBox();
  assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 900);
  checks.push('Tooltip stays within the viewport near the lower chart edge.');
  assert.deepEqual(errors, []);
  checks.push('No uncaught browser errors.');
  await mkdir(resolve(root, 'output/prototype'), {recursive:true});
  await writeFile(resolve(root, 'output/prototype/verification.json'), JSON.stringify({checked_on:'2026-11-08', browser:'Microsoft Edge / Chromium', checks, human_peer_testing:'Not conducted; not replaced by automated checks.'}, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser.close();
}
