import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
process.env.SURVIVAL_PORT='4174';const {server}=await import('./serve.mjs');
process.on('uncaughtException',error=>{console.error(error);server.close();process.exit(1);});
await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-proxy-server'],executablePath:'C:/Users/kimwo/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4174');await page.locator('#industryOptions button').first().waitFor();
await page.screenshot({path:'artifacts/desktop-home.png'});
await page.locator('#funds').fill('50000');await page.locator('#start').click();
for(let i=0;i<5;i++){await page.locator('#eventChoices button').first().click();}
await page.locator('#results:not(.off)').waitFor();assert.equal(await page.locator('#monthsRun').innerText(),'36개월');assert.equal(await page.locator('#recordTable tr').count(),36);
await page.screenshot({path:'artifacts/desktop-results.png',fullPage:false});
await page.locator('#compare').click();await page.locator('#personalized h3').waitFor();assert.ok((await page.locator('#personalized').innerText()).includes('게임 기록'));
await page.screenshot({path:'artifacts/desktop-reality.png'});
for(let i=0;i<8;i++){await page.locator(`[data-story="${i}"]`).click();await page.locator('#storyContent h3').waitFor();if(i===1){await page.locator('#salesSlider').fill('1000');await page.locator('#salesSlider').dispatchEvent('input');assert.ok((await page.locator('#breakCaption').innerText()).includes('−300만원'));}if(i===2){await page.locator('#orderFee').fill('2');assert.ok((await page.locator('#orderCaption').innerText()).includes('6,350'));}}
await page.locator('#nextStory').click();await page.locator('#indicatorSelect').selectOption('five');assert.ok((await page.locator('#comparison').innerText()).includes('+1.6%p'));
await page.locator('.ending').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/desktop-ending.png'});
await page.locator('#restart').click();await page.locator('#start').click();await page.locator('#quit').click();await page.locator('#compare').click();assert.equal(await page.locator('#storyContent h3').innerText(),'가게를 닫는 데도 돈이 든다');
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4174');await mobile.locator('#industryOptions button').first().waitFor();await mobile.screenshot({path:'artifacts/mobile-home.png'});
const overflow=[];for(const id of ['setup','reality','data','sources']){await mobile.locator('#'+id).scrollIntoViewIfNeeded();const size=await mobile.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));if(size.s>size.w)overflow.push({id,...size});}
await mobile.locator('[data-story="2"]').click();await mobile.locator('#storyContent').scrollIntoViewIfNeeded();await mobile.screenshot({path:'artifacts/mobile-story.png'});
await mobile.locator('#funds').fill('50000');await mobile.locator('#start').click();for(let i=0;i<5;i++)await mobile.locator('#eventChoices button').first().click();await mobile.locator('#results:not(.off)').waitFor();await mobile.screenshot({path:'artifacts/mobile-results.png'});assert.equal(await mobile.locator('#monthsRun').innerText(),'36개월');
const mobileSize=await mobile.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));assert.ok(mobileSize.s<=mobileSize.w,JSON.stringify(mobileSize));
assert.deepEqual(errors,[]);assert.deepEqual(overflow,[]);await browser.close();server.close();fs.writeFileSync('artifacts/browser-qa.json',JSON.stringify({status:'passed',desktop:'1440×1000',mobile:'390×844',checks:['36 months','5 choices','36 ledger rows','personalized reality','8 stories','break-even slider','order decomposition','statistics comparison','last scene','voluntary closure','mobile complete game','no page errors','no page overflow'],errors,overflow},null,2));console.log('Browser QA passed');
