import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {csvParse} from 'd3';
import {chromium} from 'playwright';

const root=resolve(import.meta.dirname,'..');
const rows=csvParse(await readFile(resolve(root,'data/food_spending.csv'),'utf8'));
const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const checks=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce',offline:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(resolve(root,'output/prototype/Food_Budget_Atlas.html')).href);
  await page.waitForFunction(()=>document.querySelector('#share-value')?.textContent==='15.7');
  for(const type of ['all','home','away']) {
    const field={all:'food_total_usd',home:'food_at_home_usd',away:'food_away_from_home_usd'}[type];
    const shares=rows.map(r=>100*Number(r[field])/Number(r.total_expenditures_usd));
    const domain=[0,Math.ceil(Math.max(...shares)+.5)];
    await page.locator(`[data-type="${type}"]`).click();
    for(const mode of ['overlay','facets']) {
      await page.locator(`[data-mode="${mode}"]`).click();
      for(const zoom of [false,true]) {
        await page.locator('#zoom-trend').setChecked(zoom);
        const note=await page.locator('#trend-scale-note').innerText();
        assert(note.includes(zoom?`${domain[0]}–${domain[1]}%`:'0–20%'));
        const selector=mode==='facets'?'.facet-chart': '#trend-chart';
        assert.equal(await page.locator(selector).count(),mode==='facets'?5:1);
        if (mode === 'facets') assert.deepEqual(await page.locator('.facet').evaluateAll(ns => ns.map(n => n.__data__)), ['Highest','Fourth','Middle','Second','Lowest']);
        const axes=await page.locator(`${selector} .y-axis`).allTextContents();
        assert(axes.every(a=>a===axes[0]),'Facets must share identical axis ticks');
        // Check geometry against the independently calculated domain, not just labels.
        const points=await page.locator(mode==='facets'?'.facet-point':'.trend-point').evaluateAll(ns=>ns.map(n=>({year:n.__data__.year,q:n.__data__.income_quintile,cy:+n.getAttribute('cy')})));
        const [lo,hi]=zoom?domain:[0,20];const height=mode==='facets'?146:253;
        for(const point of points){
          const row=rows.find(r=>+r.year===point.year&&r.income_quintile===point.q);
          const expected=height*(1-(100*Number(row[field])/Number(row.total_expenditures_usd)-lo)/(hi-lo));
          assert(Math.abs(point.cy-expected)<.001,'Point must use the declared shared Y scale');
        }
      }
    }
    const scale=await page.locator('#trend-scale-note').innerText();
    // Each of the 50 facet targets selects BOTH dimensions and updates other views.
    for(const row of rows){
      await page.locator(`.facet-hit[aria-label^="${row.income_quintile} 20%, ${row.year}:"]`).dispatchEvent('click');
      assert.equal(await page.locator('#share-value').innerText(),(100*Number(row[field])/Number(row.total_expenditures_usd)).toFixed(1));
      assert((await page.locator('#compare-context').innerText()).includes(row.year));
      assert((await page.locator('#history-table caption').textContent()).includes(row.income_quintile));
      assert.equal(await page.locator('#trend-scale-note').innerText(),scale,'Year/quintile selection must not rescale');
    }
  }
  checks.push('All 12 category/layout/scale combinations have correct geometry and identical scales across facets; zoom covers all 50 observations.');
  checks.push('All 150 category/year/quintile facet selections update the summary, other views and tables without rescaling.');
  await page.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#share-value').innerText(),'4.0');
  assert(await page.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').evaluate(n=>n===document.activeElement));
  await mkdir(resolve(root,'tmp/trend-modes'),{recursive:true});
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1100});await page.waitForTimeout(100);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(width===390||width===1440) await page.locator('.card-trend').screenshot({path:resolve(root,`tmp/trend-modes/facets-${width}.png`)});
  }
  await page.locator('[data-mode="overlay"]').click();
  await page.locator('.card-trend').screenshot({path:resolve(root,'tmp/trend-modes/overlay-zoom.png')});
  await page.locator('#reset-button').click();
  assert.equal(await page.locator('[data-mode="facets"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#zoom-trend').isChecked(),true);
  assert.equal(await page.locator('#share-value').innerText(),'15.7');
  checks.push('Keyboard selection retains focus; responsive facets fit 320–1440 px; Reset restores small multiples with shared zero-based zoom.');
  assert.deepEqual(errors,[]);checks.push('No uncaught browser errors.');
  await writeFile(resolve(root,'output/prototype/trend-verification.json'),JSON.stringify({checked_on:'2026-11-10',checks},null,2));
  console.log(checks.join('\n'));
}finally{await browser.close();}
