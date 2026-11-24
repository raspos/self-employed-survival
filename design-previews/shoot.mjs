import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='design-previews/shots';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});const issues=[];
for(const d of ['a','b','c'])for(const s of ['main','game'])for(const [tag,w,h] of [['1440',1440,900],['390',390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto(pathToFileURL(path.resolve(`design-previews/${d}-${s}.html`)).href);await p.waitForTimeout(3500);
  const r=await p.evaluate(()=>({ov:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<13.5&&!e.closest('svg')}).length,imgs:[...document.images].filter(i=>!i.naturalWidth).length}));
  if(r.ov>0||r.small||r.imgs)issues.push([d,s,tag,r]);
  await p.screenshot({path:`${out}/${d}-${s}-${tag}.png`,fullPage:s==='main'&&tag==='390'});await p.close();}
await b.close();console.log(JSON.stringify(issues));
