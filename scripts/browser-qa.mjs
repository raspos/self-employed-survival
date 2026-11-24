import {createRequire} from 'node:module';import fs from 'node:fs';import assert from 'node:assert/strict';
process.env.SURVIVAL_PORT='4174';const {server}=await import('./serve.mjs');
process.on('uncaughtException',error=>{console.error(error);server.close();process.exit(1);});
await new Promise(resolve=>server.listening?resolve():server.once('listening',resolve));
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/kimwo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-proxy-server'],channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const {createSimulation}=await import('../dist/simulation.js');
const {beginEpisodes,currentEpisode,decideEpisode}=await import('../dist/episodes.js');
function findFollowUp(key) {
 for(let seed=0;seed<100;seed++){
  const state=createSimulation({industry:'chicken',own:30000});
  beginEpisodes(state,seed);
  while(!state.finished){
   if(currentEpisode(state).requires===key) return state;
   decideEpisode(state,'a');
  }
 }
 assert.fail('Missing follow-up: '+key);
}
for(const [key,name] of [['labor','민서'],['family','지연'],['supplier','한 사장']]){
 const before=findFollowUp(key);
 const relationshipPage=await browser.newPage({viewport:{width:390,height:844}});
 relationshipPage.on('pageerror',e=>errors.push(e.message));
 await relationshipPage.goto('http://127.0.0.1:4174/#setup');
 await relationshipPage.evaluate(state=>localStorage.setItem('survival-v3',JSON.stringify(state)),before);
 await relationshipPage.reload();
 await relationshipPage.getByRole('button',{name:'이어서 플레이'}).click();
 const message=await relationshipPage.locator('#eventText').innerText();
 assert.ok(message.includes(name) && message.includes(before.contacts[key].choice));
 await relationshipPage.locator('#eventChoices button').first().click();
 const after=await relationshipPage.evaluate(()=>JSON.parse(localStorage.getItem('survival-v3')));
 if(key==='labor') assert.equal(after.wages,before.wages+65);
 if(key==='family') assert.equal(after.restDays,(before.restDays??0)+1);
 if(key==='supplier') assert.equal(after.decisions.at(-1).cost,30);
 await relationshipPage.close();
}
async function finish(page) {
 for(let i=0;i<18&&!await page.locator('#results').isVisible();i++) await page.locator('#eventChoices button').first().click();
 await page.locator('#results').waitFor();
}
await page.goto('http://127.0.0.1:4174');await page.locator('#industryOptions button').first().waitFor();
await page.screenshot({path:'artifacts/desktop-home.png'});
for(let category=0;category<4;category++){await page.locator('#industryOptions button').nth(category).click();assert.equal(await page.locator('#brandOptions button').count(),3);const first=Number(await page.locator('#sales').inputValue());await page.locator('#brandOptions button').nth(2).click();const last=Number(await page.locator('#sales').inputValue());assert.ok(first>last);assert.ok((await page.locator('#brandSummary').innerText()).includes('SCENARIO'));}
await page.locator('.setup-details > summary').click();
await page.locator('#industryOptions button').first().click();await page.locator('#salesCapture').fill('50');const half=Number(await page.locator('#sales').inputValue());await page.locator('#salesCapture').fill('100');const full=Number(await page.locator('#sales').inputValue());assert.ok(Math.abs(half*2-full)<.1);await page.locator('#salesCapture').fill('65');
await page.locator('#feeLabShare').fill('80');await page.locator('#feeLabShare').dispatchEvent('input');assert.equal(await page.locator('#deliveryShare').inputValue(),'80');await page.locator('#brandOptions').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/desktop-brands.png'});await page.locator('#feeLabShare').fill('40');await page.locator('#feeLabShare').dispatchEvent('input');
await page.locator('#funds').fill('50000');await page.locator('#start').click();
const savedTitle = await page.locator('#eventTitle').innerText();
await page.reload();
await page.getByRole('button',{ name:'이어서 플레이' }).click();
assert.equal(await page.locator('#eventTitle').innerText(), savedTitle);
await finish(page);
await page.locator('#results:not(.off)').waitFor();assert.equal(await page.locator('#monthsRun').innerText(),'36개월');assert.equal(await page.locator('#recordTable tr').count(),36);
await page.locator('#salaryComparison > summary').click();
await page.locator('#salaryComparison input').fill('6000');
assert.match(await page.locator('#salaryComparison tbody').innerText(), /16,200/);
await page.locator('#resultShare > summary').click();
const download = page.waitForEvent('download');
await page.getByRole('button',{name:'이미지 저장'}).click();
assert.match((await download).suggestedFilename(), /\.png$/);
await page.locator('#resultShare select').selectOption('1350');
const portraitDownload = page.waitForEvent('download');
await page.getByRole('button',{name:'이미지 저장'}).click();
const png = fs.readFileSync(await (await portraitDownload).path());
assert.equal(png.readUInt32BE(16),1080);
assert.equal(png.readUInt32BE(20),1350);
await page.screenshot({path:'artifacts/desktop-results.png',fullPage:false});
await page.locator('#compare').click();await page.locator('#personalized h3').waitFor();assert.ok((await page.locator('#personalized').innerText()).includes('게임 기록'));
await page.screenshot({path:'artifacts/desktop-reality.png'});
for(let i=0;i<8;i++){await page.locator(`[data-story="${i}"]`).click();await page.locator('#storyContent h3').waitFor();if(i===1){await page.locator('#salesSlider').fill('1000');await page.locator('#salesSlider').dispatchEvent('input');assert.ok((await page.locator('#breakCaption').innerText()).includes('−300만원'));}if(i===2){await page.locator('#orderFee').fill('2');assert.ok((await page.locator('#orderCaption').innerText()).includes('6,350'));assert.ok((await page.locator('#feeHistoryConclusion').innerText()).includes('같습니다'));await page.locator('#historyTicket').fill('15000');await page.locator('#historyTicket').dispatchEvent('input');assert.ok((await page.locator('#feeHistoryConclusion').innerText()).includes('200원'));await page.locator('#feeHistoryComparison').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/desktop-fee-history.png'});}}
await page.locator('#nextStory').click();await page.locator('#indicatorSelect').selectOption('five');assert.ok((await page.locator('#comparison').innerText()).includes('+1.6%p'));
await page.locator('#indicatorSelect').selectOption('foodSupply');assert.ok((await page.locator('#comparison').innerText()).includes('+13%'));assert.equal(await page.locator('#after2024 .update-chapters article').count(),4);assert.equal(await page.locator('#dataCards button').count(),8);await page.locator('#after2024').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/desktop-after2024.png'});
await page.locator('.ending').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/desktop-ending.png'});
await page.locator('#restart').click();await page.locator('#start').click();await page.locator('#quit').click();await page.locator('#compare').click();assert.equal(await page.locator('#storyContent h3').innerText(),'가게를 닫는 데도 돈이 든다');
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4174');await mobile.locator('#industryOptions button').first().waitFor();await mobile.screenshot({path:'artifacts/mobile-home.png'});
const overflow=[];for(const id of ['setup','reality','data','sources']){await mobile.locator('#'+id).scrollIntoViewIfNeeded();const size=await mobile.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));if(size.s>size.w)overflow.push({id,...size});}
await mobile.locator('[data-story="2"]').click();await mobile.locator('#storyContent').scrollIntoViewIfNeeded();await mobile.screenshot({path:'artifacts/mobile-story.png'});
await mobile.locator('#brandOptions').scrollIntoViewIfNeeded();await mobile.screenshot({path:'artifacts/mobile-brands.png'});await mobile.locator('#after2024').scrollIntoViewIfNeeded();await mobile.screenshot({path:'artifacts/mobile-after2024.png'});
await mobile.locator('#funds').fill('50000');await mobile.locator('#start').click();await finish(mobile);await mobile.locator('#results:not(.off)').waitFor();await mobile.screenshot({path:'artifacts/mobile-results.png'});assert.equal(await mobile.locator('#monthsRun').innerText(),'36개월');
const mobileSize=await mobile.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));assert.ok(mobileSize.s<=mobileSize.w,JSON.stringify(mobileSize));
await mobile.locator('#restart').click();
await mobile.locator('#funds').fill('50000');
await mobile.locator('.setup-details > summary').click();
await mobile.locator('#householdReserve').fill('5000');
await mobile.locator('#start').click();
await mobile.getByText('매장 양도',{exact:true}).click();
await mobile.getByLabel(/시설·권리 양도대금/).fill('600');
await mobile.getByRole('button',{name:'양도하고 영업 종료'}).click();
assert.equal(await mobile.locator('#resultTitle').innerText(),'가게를 넘기고 새 출발');
await mobile.locator('#runCharts > summary').click();
assert.match(await mobile.locator('#runCharts > p').innerText(),/가계 예비금 잔액 [\d,]+만원/);
assert.ok(await mobile.getByRole('heading',{name:'영업 기간 사업 지출'}).isVisible());
assert.ok(await mobile.locator('#runCharts').getByRole('rowheader',{name:'배달·결제 비용'}).isVisible());
await mobile.locator('#afterClosing > summary').click();
const initialProjection = await mobile.locator('#afterClosing > p').innerText();
await mobile.getByLabel(/재취업 세전 연봉/).fill('6500');
assert.notEqual(await mobile.locator('#afterClosing > p').innerText(),initialProjection);
await mobile.getByText('채무조정 조건 비교',{exact:true}).click();
const adjusted=mobile.locator('#afterClosing details').filter({hasText:'채무조정 조건 비교'}).locator('p').first();
const baselineAdjustment=await adjusted.innerText();
await mobile.getByLabel(/원금 거치 기간/).fill('12');
assert.notEqual(await adjusted.innerText(),baselineAdjustment);
assert.equal(await mobile.getByRole('link',{name:'새출발기금 지원 대상·조건'}).getAttribute('href'),'https://www.newstartfund.or.kr/Contents/Prod.do');
for (const width of [320, 768]) {
 const narrow = await browser.newPage({ viewport: { width, height: 850 } });
 narrow.on('pageerror', e => errors.push(e.message));
 await narrow.goto('http://127.0.0.1:4174/#setup');
 await narrow.locator('#industryOptions button').first().waitFor();
 const size = await narrow.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
 assert.ok(size[0] <= size[1], `Setup overflows at ${width}px: ${size}`);
 await narrow.close();
}
assert.deepEqual(errors,[]);assert.deepEqual(overflow,[]);await browser.close();server.close();fs.writeFileSync('artifacts/browser-qa.json',JSON.stringify({status:'passed',desktop:'1440×1000',mobile:'390×844',checks:['36 months','event-driven choices','36 ledger rows','personalized reality','8 stories','break-even slider','order decomposition','statistics comparison','last scene','voluntary closure','mobile complete game','no page errors','no page overflow'],errors,overflow},null,2));console.log('Browser QA passed');
