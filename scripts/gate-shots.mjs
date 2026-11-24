import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4189';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='artifacts/gate';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:w<700?844:900}});
await p.goto('http://127.0.0.1:4189/');await p.waitForTimeout(600);
await p.locator('#toStep2').click();await p.locator('#toStep3').click();await p.locator('#start').click();
for(let i=0;i<20&&!await p.locator('#results').isVisible();i++)await p.locator('#eventChoices button').first().click();
await p.waitForTimeout(1500);
await p.locator('.reality-gateway').screenshot({path:`${out}/${w}-gateway.png`});
await p.locator('#compare').click();await p.waitForTimeout(500);
await p.locator('.ending:visible').first().screenshot({path:`${out}/${w}-end-stories.png`});
await p.locator('#toData1').click();await p.waitForTimeout(500);
await p.locator('.ending:visible').first().screenshot({path:`${out}/${w}-end-data.png`});
console.log(w,'menu current',await p.locator('.menu a[aria-current=page]').innerText());await p.close();}
await b.close();server.close();
