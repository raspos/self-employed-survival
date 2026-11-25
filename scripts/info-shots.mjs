import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4191';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='artifacts/info';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4191/#reality');await p.waitForTimeout(1000);
for(const [i,name] of [[0,'demand'],[3,'franchise'],[4,'labor'],[6,'closure'],[7,'debt']]){await p.locator('#storyTabs button').nth(i).click();await p.waitForTimeout(500);
 const el=p.locator('#storyContent .info, #storyContent .street, #storyContent .ftl').first();if(await el.count())await el.screenshot({path:`${out}/${w}-${name}.png`});else console.log('no info for',name);}
console.log(w,'errors',errs,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));await p.close();}
await b.close();server.close();
