// 복구한 기존 화면의 12~15px 글자와 터치 영역을 화면별로 센다. 사용: node scripts/font-audit.mjs [폭]
import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4179';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const w=Number(process.argv[2]||390),out='artifacts/old-ui';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:w,height:w<700?844:900}});
await p.goto('http://127.0.0.1:4179/');await p.waitForTimeout(600);
const audit=name=>p.evaluate(()=>{const res={};for(const e of document.querySelectorAll('body *')){const r=e.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(e).visibility==='hidden')continue;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const f=Math.round(parseFloat(getComputedStyle(e).fontSize));if(f<14){const k=e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.split(' ')[0]:'')+':'+f;res[k]=(res[k]||0)+1;}}return res;});
const rows={};
rows.home=await audit();await p.screenshot({path:`${out}/${w}-home.png`,fullPage:true});
await p.locator('#start').click();await p.waitForTimeout(500);rows.play=await audit();await p.screenshot({path:`${out}/${w}-play.png`});
await p.locator('#quit').click();await p.waitForTimeout(500);rows.results=await audit();
await p.locator('#reality').scrollIntoViewIfNeeded();rows.stories=await audit();await p.locator('#data').scrollIntoViewIfNeeded();rows.data=await audit();
console.log(w,JSON.stringify(rows));await b.close();server.close();
