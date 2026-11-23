import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const directory = resolve(root, 'output/prototype/screenshots');
await mkdir(directory, {recursive: true});
const browser = await chromium.launch({headless:true, args:['--disable-gpu'], executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {
  const page = await browser.newPage({viewport:{width:1440,height:1100}, reducedMotion:'reduce', offline:true});
  await page.goto(pathToFileURL(resolve(root, 'output/prototype/Food_Budget_Atlas.html')).href);
  await page.waitForFunction(() => document.querySelector('#share-value')?.textContent === '15.7');
  // Show the actual controls, summary, and all three views at a readable scale.
  // These notes are screenshot annotations only, not claims of peer observations.
  await page.addStyleTag({content: `
    .masthead,.hero,.method,.data-section,footer {display:none!important}
    main {padding-top:20px;padding-bottom:20px}
    .capture-note {font:14px/1.5 Arial,sans-serif;padding:18px 24px;margin:0 0 18px;border-left:5px solid #216d77;background:#e9f1ed;color:#17333a}
    .capture-note strong {display:block;font-size:18px;margin-bottom:4px}
  `});
  async function capture(filename, title, description) {
    await page.evaluate(({title,description})=> {
      document.querySelector('.capture-note')?.remove();
      const note=document.createElement('div'); note.className='capture-note';
      const heading=document.createElement('strong'); heading.textContent=title;
      const body=document.createElement('span'); body.textContent=description;
      note.append(heading,body); document.querySelector('main').prepend(note);
    },{title,description});
    await page.mouse.move(0,0);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0,0); });
    // Allow resize/scroll painting to settle before capturing the whole document.
    await page.waitForTimeout(180);
    await page.screenshot({path:resolve(directory,filename),fullPage:true});
  }
  await capture('01-overview.png','01 / OVERVIEW - Which income group spends the largest share on food?',
    '2024, all food: Lowest 20% = 15.7%; Highest 20% = 11.3%. Read the dot plot, then the home/away composition, then the time trend. All percentages use total expenditures as the denominator.');
  await page.locator('.segment[aria-label^="Middle 20%, away"]').click();
  await page.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').click();
  await page.locator('[data-mode="facets"]').click();
  await page.locator('#zoom-trend').check();
  await capture('02-linked-selection.png','02 / SMALL MULTIPLES + ZOOM - Middle-income group, away from home, 2020',
    'Each group has a separate trend with identical axes. Points select quintile + year. Zoom keeps zero, using one category-wide range. The selected share is 4.0% ($2,070).');
  console.log('Saved two annotated screenshots from the offline prototype.');
} finally { await browser.close(); }
