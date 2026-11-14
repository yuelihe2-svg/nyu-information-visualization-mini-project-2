import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
for(const scale of [1,1.25,1.5]){
 const c=await b.newContext({viewport:{width:Math.round(3440/scale),height:Math.round(1440/scale)},deviceScaleFactor:scale,reducedMotion:'reduce'});
 const p=await c.newPage();await p.goto(pathToFileURL(resolve(root,'output/prototype/Food_Budget_Atlas.html')).href);
 await p.waitForFunction(()=>document.querySelector('#share-value').textContent==='15.7');
 await p.locator('[data-type="away"]').click();
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const info=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,contextFont:getComputedStyle(document.querySelector('.card-description')).fontSize,axisFont:getComputedStyle(document.querySelector('.tick text')).fontSize,labels:[...document.querySelectorAll('.end-label')].map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})}));
 const labels=[...info.labels].sort((a,b)=>a.top-b.top);if(info.overflow||labels.some((n,i)=>i&&n.top<labels[i-1].bottom))throw Error('Overflow or overlapping labels');
 results.push({scale,...info});await c.close();
}
await b.close();await writeFile('output/prototype/ultrawide-verification.json',JSON.stringify({scope:'3440x1440 equivalent CSS viewports and device scales; not a physical monitor or operating-system scaling test',results},null,2));console.log('PASS: three ultrawide viewport/device-scale combinations, no horizontal overflow or overlapping endpoint labels.');
