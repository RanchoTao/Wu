import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { logistic, nodes, edges } from '../assets/model.js';
const round=process.env.QA_ROUND||'round-1';
const output=`test-results/${round}`;await mkdir(output,{recursive:true});
const base=process.env.QA_URL||'http://127.0.0.1:4173/rongling-wu-tribute/';
let executablePath=process.env.CHROMIUM_PATH;
if(!executablePath){try{await access(chromium.executablePath())}catch{executablePath='C:/Users/RanchoTao/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'}}
const browser=await chromium.launch({headless:true,executablePath});
const report={round,base,timestamp:new Date().toISOString(),checks:[],viewports:[],errors:[],failedResponses:[]};
function check(name,condition){report.checks.push({name,passed:!!condition});if(!condition)report.errors.push(name)}
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();
await page.addInitScript(()=>{window.__draws={};const original=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){const id=this.canvas.id;window.__draws[id]=(window.__draws[id]||0)+1;return original.apply(this,args)}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400)report.failedResponses.push({url:res.url(),status:res.status()})});
await page.goto(base,{waitUntil:'networkidle'});
await page.waitForTimeout(1400);
await page.screenshot({path:`${output}/desktop-1440x900.png`});
// Warm up lazy artwork and capture a completed network in the long-page plate.
await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';try{await img.decode()}catch{}}});
await page.evaluate(()=>{const r=document.querySelector('.network-scroll').getBoundingClientRect();scrollTo({top:scrollY+r.top+500,behavior:'instant'})});await page.waitForTimeout(250);
check('Scroll reveals completed network',(await page.locator('#morph-label').textContent()).includes('03'));
await page.locator('#node-select').selectOption('C2');
await page.evaluate(()=>{const r=document.querySelector('.network-scroll').getBoundingClientRect();scrollTo({top:scrollY+r.top-115,behavior:'instant'})});await page.waitForTimeout(200);
await page.screenshot({path:`${output}/network-desktop.png`});
await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
await page.screenshot({path:`${output}/desktop-full.png`,fullPage:true});
check('Hero canvas rendered',await page.locator('#living-canvas').isVisible());
await page.bringToFront();
await page.evaluate(()=>{document.activeElement?.blur();scrollTo({top:0,behavior:'instant'})});
const wakeCount=await page.evaluate(()=>window.__draws['living-canvas']||0);
await page.waitForFunction(count=>!document.hidden&&(window.__draws['living-canvas']||0)>count,wakeCount,{timeout:4000}).catch(async e=>{console.log('Animation wake diagnostic',await page.evaluate(()=>({scrollY,hidden:document.hidden,classes:document.documentElement.className,draws:window.__draws,rect:document.querySelector('#living-canvas').getBoundingClientRect().toJSON()})));throw e});
const startDraw=await page.evaluate(()=>window.__draws['living-canvas']||0);await page.waitForTimeout(550);const endDraw=await page.evaluate(()=>window.__draws['living-canvas']||0);
report.heroFramesIn550ms=endDraw-startDraw;check('Hero active render budget capped at 30fps',endDraw-startDraw>0&&endDraw-startDraw<=18);
const before=await page.locator('#curve-c').getAttribute('d');
await page.locator('#growth-rate').evaluate(el=>{el.value='1.65';el.dispatchEvent(new Event('input',{bubbles:true}))});
check('Rate changes rendered curve',before!==await page.locator('#curve-c').getAttribute('d'));
check('Rate synchronizes hero control',(await page.locator('#hero-rate').inputValue())==='1.65');
check('All curves cross at inflection time',await page.locator('#value-c').textContent()==='50.0');
await page.locator('#observation-time').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
check('Observation slider changes values',await page.locator('#value-a').textContent()!==await page.locator('#value-b').textContent());
await page.locator('[data-view="snapshot"]').click();
check('Snapshot removes trajectories',await page.locator('#curve-paths').evaluate(el=>getComputedStyle(el).opacity)==='0');
await page.locator('#reset-growth').click();
check('Reset restores parameters',(await page.locator('#observation-time').inputValue())==='5'&&(await page.locator('#growth-rate').inputValue())==='0.9');
await page.locator('#growth-rate').focus();await page.keyboard.press('ArrowRight');
check('Keyboard changes slider',Number(await page.locator('#growth-rate').inputValue())>.9);
await page.locator('#reset-growth').click();
await page.locator('#node-select').selectOption('G1');
check('Node selector changes inspector',(await page.locator('#node-details h3').textContent()).includes('G₁'));
check('Selecting node completes readable network',(await page.locator('#morph-label').textContent()).includes('03'));
const g2=page.locator('.net-node').nth(1);await g2.focus();await page.keyboard.press('Enter');
check('Keyboard activates SVG node',(await page.locator('#node-select').inputValue())==='G2');
const p1=page.locator('.net-node').nth(6);await p1.click();
check('Pointer activates SVG node',(await page.locator('#node-select').inputValue())==='P1');
await page.locator('#node-select').selectOption('C2');
await page.locator('[data-filter="preprint"]').click();
check('Preprint filter only shows preprint',await page.locator('.work:visible').count()===1&&(await page.locator('.work:visible').getAttribute('data-kind'))==='preprint');
await page.locator('[data-filter="published"]').click();check('Published filter shows four',await page.locator('.work:visible').count()===4);
await page.locator('[data-filter="all"]').click();
await page.locator('.atlas-item').nth(2).locator('summary').click();
check('Research accordion expands',await page.locator('.atlas-item').nth(2).getAttribute('open')!==null);
await page.locator('.atlas-item').nth(2).locator('summary').click();
const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
report.accessibility=axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}));
// Inspect layout at all requested widths, including intermediate tablet.
for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844}]){
 await page.setViewportSize(viewport);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);
 const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,hero:document.querySelector('.hero').getBoundingClientRect().toJSON(),horizontalOffenders:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.left<-.5||r.right>innerWidth+.5)&&!el.closest('.hero-art')&&!el.matches('.hero-art,.work:before')}).map(el=>({tag:el.tagName,class:el.className?.baseVal??el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).slice(0,20)}));
 report.viewports.push({viewport,...layout});check(`No horizontal document overflow at ${viewport.width}`,layout.scrollWidth<=viewport.width);
 await page.screenshot({path:`${output}/${viewport.width===390?'mobile-390x844':viewport.width===768?'tablet-768x1024':'desktop-1440x900'}.png`});
 if(viewport.width===390){
  await page.screenshot({path:`${output}/mobile-full.png`,fullPage:true});
  await page.locator('.mobile-menu summary').click();
  check('Mobile menu opens',await page.locator('.mobile-menu nav').isVisible());
  await page.locator('.mobile-menu a[href="#works"]').click();
  check('Mobile menu closes after navigation',!(await page.locator('.mobile-menu').getAttribute('open')));
  await page.locator('#experiment').scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.screenshot({path:`${output}/mobile-experiment.png`});
  await page.evaluate(()=>{const r=document.querySelector('.network-scroll').getBoundingClientRect();scrollTo({top:scrollY+r.top-90,behavior:'instant'})});await page.waitForTimeout(250);await page.screenshot({path:`${output}/mobile-network.png`});
  const mobileAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.mobileAccessibility=mobileAxe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}));check('Mobile automated accessibility scan',mobileAxe.violations.length===0);
 }
}
// Match actual touch interactions rather than only dispatching synthetic events.
const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const touchPage=await touchContext.newPage();await touchPage.goto(base);await touchPage.locator('#growth-rate').scrollIntoViewIfNeeded();
const sliderBox=await touchPage.locator('#growth-rate').boundingBox();
await touchPage.touchscreen.tap(sliderBox.x+sliderBox.width*.8,sliderBox.y+sliderBox.height*.5);
check('Touch changes rate',Number(await touchPage.locator('#growth-rate').inputValue())>1.2);await touchContext.close();
// Reduced motion and no-JS are tested as separate browser contexts.
await page.locator('#explore').scrollIntoViewIfNeeded();await page.waitForTimeout(250);const offscreenStart=await page.evaluate(()=>window.__draws['living-canvas']||0);await page.waitForTimeout(250);check('Offscreen hero stops rendering',offscreenStart===await page.evaluate(()=>window.__draws['living-canvas']||0));
await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
check('Reduced motion pauses automatic motion',await page.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
check('Reduced motion button explains system setting',await page.locator('.motion-control').isDisabled());
const a=await page.locator('#living-canvas').evaluate(el=>el.toDataURL());await page.waitForTimeout(250);const b=await page.locator('#living-canvas').evaluate(el=>el.toDataURL());check('Reduced motion canvas stays still',a===b);
await page.locator('#hero-rate').evaluate(el=>{el.value='1.7';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForTimeout(120);
check('Paused hero still responds to user parameter',a!==await page.locator('#living-canvas').evaluate(el=>el.toDataURL()));
await page.locator('#hero-rate').evaluate(el=>{el.value='.9';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForTimeout(120);
await page.screenshot({path:`${output}/reduced-motion.png`});
await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.motion-control').click();check('Manual animation pause works',await page.locator('html').evaluate(el=>el.classList.contains('motion-paused')));await page.locator('.motion-control').click();
const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const np=await nojs.newPage();await np.goto(base);
check('No-JS: all five publications readable',await np.locator('.work').count()===5&&await np.locator('.work').first().isVisible());
check('No-JS: hero fallback visible',await np.locator('.hero-fallback').isVisible());check('No-JS: nonworking controls hidden',!(await np.locator('#growth-rate').isVisible()));
await np.screenshot({path:`${output}/no-js-mobile.png`});await nojs.close();
const fallback=await browser.newContext({viewport:{width:390,height:844}});await fallback.addInitScript(()=>HTMLCanvasElement.prototype.getContext=()=>null);const fp=await fallback.newPage();await fp.goto(base);
check('Canvas unavailable: original SVG fallback visible',await fp.locator('.hero-fallback').isVisible());
await fp.locator('#node-select').selectOption('P3');check('Canvas unavailable: SVG network still interactive',(await fp.locator('#node-select').inputValue())==='P3');await fallback.close();
const sourcePage=await context.newPage();await sourcePage.goto(new URL('sources.html',base).href);
const sourceAxe=await new AxeBuilder({page:sourcePage}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.sourceAccessibility=sourceAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.failureSummary)}));check('Sources page automated accessibility scan',sourceAxe.violations.length===0);await sourcePage.close();
// All local targets resolve under the project prefix. Remote URLs verified separately.
const localTargets=await page.evaluate(()=>[...new Set([...document.querySelectorAll('a[href],script[src],link[href],img[src]')].map(el=>el.getAttribute('href')||el.getAttribute('src')).filter(url=>!url.startsWith('http')&&!url.startsWith('mailto:')&&!url.startsWith('#')))]);
for(const target of localTargets){const res=await context.request.get(new URL(target,base).href);check(`Project subpath resource: ${target}`,res.status()===200)}
const brokenAnchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.hash.slice(1)).filter(id=>id&&!document.getElementById(id)));check('All in-page anchors exist',brokenAnchors.length===0);
for(const r of [.3,.5,.9,1.4,1.8])assert.equal(logistic(5,r),50);
assert.ok(logistic(2,.5)>logistic(2,1.4));assert.equal(nodes.length,9);assert.equal(edges.length,12);
check('Mathematical invariants and graph integrity',edges.every(e=>nodes.some(n=>n.id===e.from)&&nodes.some(n=>n.id===e.to)));
report.summary={passed:report.checks.filter(c=>c.passed).length,total:report.checks.length,axeViolations:report.accessibility.length,errors:report.errors.length,failedResponses:report.failedResponses.length};
await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
if(report.errors.length||report.failedResponses.length||report.accessibility.length)process.exitCode=1;
