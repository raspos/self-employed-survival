import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4184';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='artifacts/data';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4184/');await p.waitForTimeout(800);await p.evaluate(()=>{location.hash='#data'});await p.waitForTimeout(500);
const n=await p.locator('.chapter').count();
for(let i=0;i<n;i++){await p.locator('.chapter').nth(i).scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.locator('.chapter').nth(i).screenshot({path:`${out}/${w}-c${i}.png`});}
console.log(w,'chapters',n,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'errors',errs);await p.close();}
await b.close();server.close();
