// 14개 화면 × 6개 폭 스크린샷과 자동 점검(가로 넘침, 12px 미만 글자, 44px 미만 터치 영역, 이미지, 콘솔 오류).
import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4176';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=process.argv[2]||'artifacts/ui-after';fs.mkdirSync(out,{recursive:true});
const widths=(process.argv[3]||'320,390,430,768,1024,1440').split(',').map(Number);
const b=await chromium.launch({headless:true,channel:'chrome'});
const report=[];
async function audit(p,name,w){
  const r=await p.evaluate(()=>{
    const vis=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
    const small=new Set(),tap=new Set();
    for(const e of document.querySelectorAll('body *')){
      if(!vis(e))continue;
      const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(own){const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<12&&!e.closest('svg'))small.add(`${e.tagName}.${e.className}:${fs}:${e.textContent.trim().slice(0,20)}`);
        if(e.closest('svg')){const t=e.getBoundingClientRect();const f=parseFloat(getComputedStyle(e).fontSize);const sc=e.ownerSVGElement?e.ownerSVGElement.getBoundingClientRect().width/e.ownerSVGElement.viewBox.baseVal.width:1;if(f*sc<11.5)small.add(`svg:${(f*sc).toFixed(1)}:${e.textContent.slice(0,12)}`);}}
      if(/^(BUTTON|SELECT|SUMMARY)$/.test(e.tagName)||(e.tagName==='INPUT'&&!['range','hidden'].includes(e.type))){const r=e.getBoundingClientRect();if(r.height<43.5||r.width<43.5)tap.add(`${e.tagName}#${e.id}:${Math.round(r.width)}x${Math.round(r.height)}:${(e.textContent||e.value||'').trim().slice(0,16)}`);}
    }
    const imgs=[...document.images].filter(i=>vis(i)&&!(i.complete&&i.naturalWidth>0)).map(i=>i.src.slice(-40));
    return {overflow:document.documentElement.scrollWidth-innerWidth,small:[...small].slice(0,8),tap:[...tap].slice(0,8),badImgs:imgs};
  });
  if(r.overflow>0||r.small.length||r.tap.length||r.badImgs.length)report.push({w,name,...r});
}
for(const w of widths){
  const p=await b.newPage({viewport:{width:w,height:w<700?844:900}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  const snap=async(name,full=false,sel)=>{await p.waitForTimeout(250);await audit(p,name,w);const path=`${out}/${w}-${name}.png`;if(sel)await p.locator(sel).first().screenshot({path});else await p.screenshot({path,fullPage:full});};
  await p.goto('http://127.0.0.1:4176/');await p.waitForTimeout(700);
  await snap('01-home');
  await p.locator('#setup').scrollIntoViewIfNeeded();await snap('02-industry');
  await p.locator('#toStep2').click();await snap('03-capital');
  await p.locator('#toStep3').click();await snap('04-ready');
  await p.locator('#start').click();await p.waitForTimeout(500);await snap('05-opening');
  // 선택을 진행하며 서로 다른 사건 형식을 찾는다
  const seen=new Set();let newsDone=false;
  for(let i=0;i<14&&await p.locator('#play').isVisible();i++){
    const fmt=await p.evaluate(()=>[...document.querySelectorAll('#eventText>div')].map(d=>d.className).join());
    if(fmt&&!seen.has(fmt)&&seen.size<3&&i>0){seen.add(fmt);await snap('06-event-'+fmt.replace(/\W+/g,''));}
    if(fmt==='fmt-news'&&!newsDone){newsDone=true;await snap('08-news');}
    await p.locator('#eventChoices button').first().click();await p.waitForTimeout(120);
  }
  if(await p.locator('#play').isVisible()){await p.locator('#cashChartBox').scrollIntoViewIfNeeded();await snap('07-ledger');await p.locator('#quit').click();await p.waitForTimeout(500);}
  await snap('09-closure');await p.locator('#results').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollTo(0,document.getElementById('results').offsetTop));await snap('10a-results');for(const k of ['b','c','d']){await p.evaluate(()=>scrollBy(0,innerHeight*.9));await snap('10'+k+'-results');}
  await p.locator('#salaryComparison').scrollIntoViewIfNeeded().catch(()=>{});await snap('11-salary',false,'#salaryComparison');
  await p.locator('#reality').scrollIntoViewIfNeeded();await snap('12-stories');
  await p.locator('#data').scrollIntoViewIfNeeded();await snap('13-data');
  await p.locator('#method').scrollIntoViewIfNeeded();await snap('14-method');
  if(errs.length)report.push({w,name:'console',errs:[...new Set(errs)].slice(0,5)});
  await p.close();
}
await b.close();server.close();
fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
console.log(JSON.stringify(report,null,1).slice(0,6000));console.log('shots',fs.readdirSync(out).length);
