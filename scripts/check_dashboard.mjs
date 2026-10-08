import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.locator('#share-value').waitFor();
const initial = await page.locator('#share-value').innerText();
if (initial !== '15.7') throw new Error(`Unexpected initial share: ${initial}`);

await page.locator('#quintile-chart [aria-label^="Highest 20%"]').first().click();
if (await page.locator('#share-value').innerText() !== '11.3') throw new Error('Quintile selection did not update summary');
if (!await page.locator('#composition-chart .row-label.selected').filter({ hasText: 'Highest 20%' }).count()) throw new Error('Quintile selection did not update composition');

await page.locator('#composition-chart [aria-label^="Middle 20%, away from home"]').click();
if (await page.locator('#selected-label').innerText() !== 'MIDDLE 20% INCOME QUINTILE · 2024') throw new Error('Composition selection did not update quintile');
if (await page.locator('#type-control button.active').innerText() !== 'Away from home') throw new Error('Composition selection did not update food type');
if (!await page.locator('#trend-chart .end-label.selected').filter({ hasText: 'Middle' }).count()) throw new Error('Composition selection did not update trend');

await page.locator('#trend-chart [aria-label^="Middle 20%, 2018:"]').click();
if (await page.locator('#year-select').inputValue() !== '2018') throw new Error('Trend selection did not update year');
if (await page.locator('#selected-label').innerText() !== 'MIDDLE 20% INCOME QUINTILE · 2018') throw new Error('Trend selection did not update summary');

await page.locator('#reset-button').click();
if (await page.locator('#share-value').innerText() !== '15.7') throw new Error('Reset failed');
await page.locator('#composition-chart [aria-label^="Fourth 20%, at home"]').focus();
await page.keyboard.press('Enter');
if (await page.locator('#type-control button.active').innerText() !== 'At home') throw new Error('Keyboard selection failed');
await page.locator('#reset-button').click();
if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(100);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
if (overflow > 1) {
  const offenders = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(el => `${el.tagName}.${el.className?.baseVal || el.className}: ${Math.round(el.getBoundingClientRect().right)}`));
  throw new Error(`Mobile horizontal overflow: ${overflow}px; ${offenders.join(', ')}`);
}
await page.screenshot({ path: 'tmp/mobile-check.png', fullPage: true, animations: 'disabled' });
console.log('Pass: three-way selection, keyboard selection, category and year linking, reset, no page errors, mobile width.');
await browser.close();
