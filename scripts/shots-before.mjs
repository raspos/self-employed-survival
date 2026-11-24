import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4175';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=process.argv[2]||'artifacts/ui-before';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
for(const [name,w,h] of [['m390',390,844],['d1440',1440,900]]){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('http://127.0.0.1:4175/');await p.waitForTimeout(500);
await p.screenshot({path:`${out}/${name}-home.png`,fullPage:true});
await p.locator('#start').click();await p.waitForTimeout(600);await p.screenshot({path:`${out}/${name}-play.png`,fullPage:false});
await p.locator('#quit').click();await p.waitForTimeout(600);await p.screenshot({path:`${out}/${name}-results.png`,fullPage:false});await p.close();}
await b.close();server.close();
