// 결과 공유 이미지(1:1, 4:5)를 PNG로 저장한다. 업종과 결과가 다른 세 경우를 만든다.
import {createRequire} from 'node:module';import fs from 'node:fs';
process.env.SURVIVAL_PORT='4178';const {server}=await import('./serve.mjs');
await new Promise(r=>server.listening?r():server.once('listening',r));
const {chromium}=createRequire(import.meta.url)('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='artifacts/share';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,channel:'chrome'});
for(const [name,industry,funds,quit] of [['good','snack','20000',false],['bad','chicken','10000',false],['quit','cafe','10000',true]]){
  const p=await b.newPage({viewport:{width:1100,height:900}});
  await p.goto('http://127.0.0.1:4178/');await p.waitForTimeout(500);
  await p.evaluate(()=>['step1','step2','step3'].forEach(i=>{document.getElementById(i).hidden=false;}));
  await p.locator('#industryOptions button').nth(['chicken','cafe','store','snack'].indexOf(industry)).click();
  await p.locator('#funds').fill(funds);await p.locator('#start').click();
  for(let i=0;i<20&&!await p.locator('#results').isVisible();i++){if(quit&&i===3){await p.locator('summary:text-is("운영 조정·폐업")').click();await p.locator('#quit').click();}else await p.locator('#eventChoices button').first().click();}
  await p.locator('#resultShare > summary').click();
  for(const [ratio,h] of [['1x1','1080'],['4x5','1350']]){await p.locator('#resultShare select').selectOption(h);await p.waitForTimeout(600);await p.locator('.share-preview').evaluate(c=>c.toBlob(()=>{}));
    const data=await p.locator('.share-preview').evaluate(c=>c.toDataURL('image/png'));fs.writeFileSync(`${out}/${name}-${ratio}.png`,Buffer.from(data.split(',')[1],'base64'));}
  await p.close();
}
await b.close();server.close();console.log(fs.readdirSync(out));
