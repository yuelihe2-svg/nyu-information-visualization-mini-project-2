// Reproducible engineering audit. This does not replace peer or screen-reader testing.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, firefox } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { csvParse, csvFormat } from 'd3';
import { validateRows } from '../src/data-validation.js';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'tmp/comprehensive');
await mkdir(out, {recursive:true});
const html = await readFile(resolve(root,'output/prototype/Food_Budget_Atlas.html'),'utf8');
const url = pathToFileURL(resolve(root,'output/prototype/Food_Budget_Atlas.html')).href;
const raw = csvParse(await readFile(resolve(root,'data/food_spending.csv'),'utf8'));
const numeric = raw.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,k==='income_quintile'?v:Number(v)])));
const quintiles = ['Lowest','Second','Middle','Fourth','Highest'];
const report = {checked_on:new Date().toISOString(),data_validation:[],browsers:[],limitations:['Automated checks do not replace real peer sessions or NVDA/VoiceOver evaluation.','Safari/WebKit and physical mobile devices were not tested.','Browser CVD simulations cover four types, not all eight listed in the lecture.']};
report.status='running';
report.sha256={};
for(const file of ['index.html','src/main.js','src/styles.css','src/data-validation.js','data/food_spending.csv','output/prototype/Food_Budget_Atlas.html']) report.sha256[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
validateRows(numeric,quintiles);
for(const [name,mutate] of [
  ['missing row',r=>r.pop()],['duplicate key',r=>r[0]={...r[1]}],['nonfinite amount',r=>r[0].food_total_usd=NaN],
  ['zero denominator',r=>r[0].total_expenditures_usd=0],['wrong rank',r=>r[0].quintile_rank=5],
  ['invalid year',r=>r[0].year=2030],['invalid group',r=>r[0].income_quintile='Unknown'],
  ['inconsistent components',r=>r[0].food_at_home_usd+=100]
]) {const data=structuredClone(numeric);mutate(data);assert.throws(()=>validateRows(data,quintiles));report.data_validation.push(name);}

for(const [name,engine,options] of [
  ['Edge',chromium,{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--disable-gpu']}],
  ['Firefox',firefox,{}]
]) {
  const browser=await engine.launch({headless:true,...options});
  const result={name,version:browser.version(),states:0,checks:[],axe:[],performance:{}};
  report.browsers.push(result);
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',offline:true,acceptDownloads:true});
    const page=await context.newPage();const errors=[],network=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
    const start=performance.now();await page.goto(url);await page.waitForFunction(()=>document.querySelector('#share-value')?.textContent==='15.7');
    result.performance.offline_load_ms=Math.round(performance.now()-start);
    assert.deepEqual(network,[]);
    const durations=[];
    // Exhaustive 10 years x 5 quintiles x 3 categories x 2 modes x 2 scales.
    for(const type of ['all','home','away']) for(const mode of ['overlay','facets']) for(const zoom of [false,true]) {
      const field={all:'food_total_usd',home:'food_at_home_usd',away:'food_away_from_home_usd'}[type];
      const upper=zoom?Math.ceil(Math.max(...numeric.map(r=>100*r[field]/r.total_expenditures_usd))+.5):20;
      for(const row of numeric) {
        const snapshot=await page.evaluate(({type,mode,zoom,year,q})=>{
          const t=performance.now();
          const change=(id,value)=>{const el=document.querySelector(id);el.value=value;el.dispatchEvent(new Event('change'));};
          document.querySelector(`[data-type="${type}"]`).click();
          document.querySelector(`[data-mode="${mode}"]`).click();
          const checkbox=document.querySelector('#zoom-trend');if(checkbox.checked!==zoom)checkbox.click();
          change('#year-select',year);change('#quintile-select',q);
          const number=(id)=>document.querySelector(id).textContent;
          const points=[...document.querySelectorAll(mode==='facets'?'.facet-point':'.trend-point')].map(n=>({year:n.__data__.year,q:n.__data__.income_quintile,cy:+n.getAttribute('cy')}));
          const dot=document.querySelector('.dot-hit[aria-pressed="true"]');
          return {share:number('#share-value'),spending:number('#spending-value'),gap:number('#gap-value'),scale:number('#trend-scale-note'),annotation:number('#trend-observation'),group:dot.__data__.income_quintile,points,time:performance.now()-t};
        },{type,mode,zoom,year:row.year,q:row.income_quintile});
        const value=100*row[field]/row.total_expenditures_usd;
        assert.equal(snapshot.share,value.toFixed(1));assert.equal(snapshot.spending,`$${row[field].toLocaleString('en-US')}`);
        const low=numeric.find(r=>r.year===row.year&&r.income_quintile==='Lowest');const high=numeric.find(r=>r.year===row.year&&r.income_quintile==='Highest');
        assert(Math.abs(parseFloat(snapshot.gap.replace('−','-'))-Number((100*low[field]/low.total_expenditures_usd-100*high[field]/high.total_expenditures_usd).toFixed(1)))<1e-9);
        assert(snapshot.scale.includes(`0–${upper}%`));assert.equal(snapshot.group,row.income_quintile);
        assert(snapshot.annotation.includes(String(row.year)));
        for(const point of snapshot.points){const r=numeric.find(r=>r.year===point.year&&r.income_quintile===point.q);const h=mode==='facets'?146:253;assert(Math.abs(point.cy-h*(1-100*r[field]/r.total_expenditures_usd/upper))<.001);}
        durations.push(snapshot.time);result.states++;
      }
    }
    durations.sort((a,b)=>a-b);result.performance.update_batch_p95_ms=+durations[Math.floor(.95*durations.length)].toFixed(1);
    result.checks.push('600 complete states: share, dollars, quintile gap, annotation context and all 50 trend point positions match source data.');
    await page.locator('#reset-button').click();
    await page.selectOption('#quintile-select','Highest');await page.locator('[data-type="away"]').click();
    await page.locator('[data-mode="facets"]').click();await page.locator('#zoom-trend').check();
    await page.locator('#undo-button').click();assert.equal(await page.locator('#zoom-trend').isChecked(),false);
    await page.locator('#undo-button').click();assert.equal(await page.locator('[data-mode="overlay"]').getAttribute('aria-pressed'),'true');
    await page.locator('#undo-button').click();assert.equal(await page.locator('[data-type="all"]').getAttribute('aria-pressed'),'true');
    await page.locator('#undo-button').click();assert.equal(await page.locator('#quintile-select').inputValue(),'Lowest');
    await page.selectOption('#quintile-select','Middle');await page.locator('#reset-button').click();await page.locator('#undo-button').click();assert.equal(await page.locator('#quintile-select').inputValue(),'Middle');
    result.checks.push('Undo restores category, group, layout, zoom and pre-reset selection.');
    // Actual keyboard path into native alternative, including opening its disclosure.
    await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
    assert(await page.locator('#data-details').evaluate(n=>n.open));assert(await page.locator('#data-details summary').evaluate(n=>n===document.activeElement));
    assert.equal(await page.locator('th[scope="col"]').count(),16);
    await page.locator('#reset-button').click();
    for(const [label,setup] of [
      ['default',async()=>{}],['facets-zoom',async()=>{await page.locator('[data-type="away"]').click();await page.locator('[data-mode="facets"]').click();await page.locator('#zoom-trend').check();}],
      ['mobile',async()=>{await page.setViewportSize({width:390,height:844});}]
    ]) {await setup();const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();result.axe.push({state:label,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:a.incomplete.map(v=>v.id)});}
    for(const width of [320,390,600,768,900,1000,1280,1440,1920]){
      await page.setViewportSize({width,height:900});await page.waitForTimeout(80);
      const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(n=>n.getBoundingClientRect().right>innerWidth+1).map(n=>({tag:n.tagName,id:n.id,cls:String(n.className),right:n.getBoundingClientRect().right}))}));
      assert(overflow.scroll<=width+1,`overflow ${name} ${width}: ${JSON.stringify(overflow)}`);
      const clipped=await page.locator('.facet-chart svg text').evaluateAll(ns=>ns.filter(n=>{const b=n.getBoundingClientRect(),s=n.ownerSVGElement.getBoundingClientRect();return b.left<s.left-1||b.right>s.right+1;}).map(n=>n.textContent));
      assert.deepEqual(clipped,[],`Clipped facet labels at ${width}`);
    }
    result.checks.push('Open-table reflow and facet label containment at 9 widths (320–1920 px); native table headers and keyboard skip link checked.');
    await page.setViewportSize({width:1280,height:900});
    await page.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').focus();await page.keyboard.press('Space');
    assert.equal(await page.locator('#share-value').innerText(),'4.0');assert(await page.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').evaluate(n=>n===document.activeElement));
    await page.keyboard.press('Escape');assert.equal(await page.locator('#tooltip').isVisible(),false);
    const downloadPromise=page.waitForEvent('download');await page.locator('#download-data').click();const download=await downloadPromise;
    const exported=csvParse(await readFile(await download.path(),'utf8'));assert.equal(exported.length,50);
    for(const r of exported){const source=numeric.find(n=>n.year===+r.year&&n.income_quintile===r.income_quintile);for(const f of ['total_expenditures_usd','food_total_usd','food_at_home_usd','food_away_from_home_usd'])assert.equal(+r[f],source[f]);}
    result.checks.push('Keyboard Space/Escape/focus retention and downloaded CSV amounts verified.');
    await page.locator('#data-details summary').click();
    if(name==='Edge'){
      await page.pdf({path:resolve(out,'print-facets.pdf'),preferCSSPageSize:true,printBackground:true});
      assert.equal(await page.locator('#data-details').getAttribute('open'),null);
      assert.equal(await page.locator('#zoom-trend').isChecked(),true);
      await page.locator('.card-trend').screenshot({path:resolve(out,'facets.png')});
      result.checks.push('Print report preserves selected state and restores the collapsed disclosure.');
      const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',offline:true});
      const mobile=await touch.newPage();await mobile.goto(url);await mobile.waitForSelector('.dot-hit');
      await mobile.locator('[data-type="away"]').tap();await mobile.locator('[data-mode="facets"]').tap();await mobile.locator('#zoom-trend').tap();
      await mobile.locator('.facet-hit[aria-label^="Middle 20%, 2020:"]').tap();assert.equal(await mobile.locator('#share-value').innerText(),'4.0');
      await mobile.locator('.card-trend').screenshot({path:resolve(out,'touch-mobile.png')});await touch.close();result.checks.push('Emulated touch tap selects Middle / Away / 2020 in facets.');
    }
    assert.deepEqual(errors,[],'No console or uncaught errors');
    // Mutate the bundled data, keeping 50 rows, and require an honest error state.
    const broken=raw.map(r=>({...r}));broken[0]={...broken[1]};
    const badHtml=html.replace(/data:text\/csv;base64,[A-Za-z0-9+/=]+/,()=>`data:text/csv;base64,${Buffer.from(csvFormat(broken)).toString('base64')}`);
    assert.notEqual(badHtml,html,'Expected inlined CSV data URL');
    const badFile=resolve(out,'invalid-data.html');await writeFile(badFile,badHtml);
    const bad=await context.newPage();await bad.goto(pathToFileURL(badFile).href);await bad.locator('[role="alert"]').waitFor();
    assert.equal(await bad.locator('.dashboard-grid').isVisible(),false);await bad.close();
    result.checks.push('Corrupt same-length dataset shows an alert and hides misleading charts. Offline startup requires no network.');
    console.log(`${name}: ${result.states} states, ${result.axe.reduce((n,a)=>n+a.violations.length,0)} axe violations; load ${result.performance.offline_load_ms} ms.`);
  } finally {await browser.close();await writeFile(resolve(root,'output/prototype/comprehensive-verification.json'),JSON.stringify(report,null,2));}
}
assert(report.browsers.every(b=>b.axe.every(a=>a.violations.length===0)),'Accessibility violations require review');
report.status='passed';
await writeFile(resolve(root,'output/prototype/comprehensive-verification.json'),JSON.stringify(report,null,2));
console.log('PASS: comprehensive audit completed.');
