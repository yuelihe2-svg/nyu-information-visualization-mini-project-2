import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.locator('#share-value').waitFor();
await mkdir('demo', { recursive: true });

// Annotation banners are temporary DOM elements; they do not alter dashboard code.
await page.addStyleTag({ content: `
  .demo-banner { background:#fff0df; border-left:5px solid #c66f3e; color:#17333a;
    margin:0 5.5% 14px; padding:12px 18px; font:700 13px/1.5 Arial,sans-serif; }
  .demo-banner small { display:block; font-weight:400; color:#5f706b; font-size:11px; }
` });

async function capture(filename, title, detail) {
  // D3 uses JavaScript transitions, which screenshot animations: 'disabled' does not stop.
  await page.waitForFunction(() => ![...document.querySelectorAll('svg *')].some(node => node.__transition));
  await page.mouse.move(1, 1);
  await page.evaluate(({ title, detail }) => {
    document.querySelector('.demo-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.innerHTML = `<div>${title}</div><small>${detail}</small>`;
    document.querySelector('main').prepend(banner);
  }, { title, detail });
  await page.screenshot({ path: `demo/${filename}`, fullPage: true, animations: 'disabled' });
}

await capture('01-overview.png', '01 · OVERVIEW: compare five income quintiles in 2024',
  'The dot plot carries budget share on a common position scale; the stacked bars split home and away food; the bottom panel adds time.');

await page.locator('#quintile-chart [aria-label^="Highest 20%"]').first().click();
await capture('02-quintile-selection.png', '02 · SELECT A DOT: focus the highest income quintile',
  'The dark dot, breakdown row, trend line, and summary all change together. The main share is 11.3% in 2024.');

await page.locator('#composition-chart [aria-label^="Middle 20%, away from home"]').click();
await page.locator('#trend-chart [aria-label^="Middle 20%, 2020:"]').click();
await capture('03-category-and-year.png', '03 · SELECT A SEGMENT, THEN A YEAR: food away from home in 2020',
  'The orange away-from-home segment selects the category and quintile; a dark point in the trend chooses 2020. All views now show the same measure.');

console.log('Saved three annotated dashboard screenshots in demo/.');
await browser.close();
