// 시안 3개(메인·게임 화면)를 실제 게임 데이터로 생성한다. 공개 사이트(dist)에는 포함되지 않는다.
import fs from 'node:fs';
import { createSimulation } from '../dist/simulation.js';
import { beginEpisodes, currentEpisode, decideEpisode, episodeSpeaker, episodeContext } from '../dist/episodes.js';

// 실제 시뮬레이션에서 16개월차 사건을 뽑는다.
const s = createSimulation({ industry: 'chicken', own: 20000, loan: 3000 });
beginEpisodes(s, 1);
while (!(s.month >= 16 && currentEpisode(s))) decideEpisode(s, 'a');
const e = currentEpisode(s);
const fmt = n => Math.round(Math.abs(n)).toLocaleString('ko-KR');
const data = {
  month: s.month, cash: fmt(s.cash), revenue: fmt(s.lastRevenue), debt: fmt(s.debt),
  channel: e.channel, who: episodeSpeaker(e), title: e.title, body: episodeContext(s, e), a: e.a, b: e.b,
  cashSeries: [s.buffer, ...s.records.map(r => r.cash)],
};
const PHOTO = 'https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/24/27a53bdc-c3c2-4d3e-9d48-6f9e96f5c2f0.jpg';
const PHOTO2 = 'https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202409/25/5f6b8026-67e1-4181-8b20-8f37e3999ac9.jpg';
const ILLU = '../dist/shop-illustration.jpg';
const FONTS = `<link rel="icon" href="data:,"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@500;700;900&display=swap">`;
const head = (css, title) => `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${FONTS}<link rel="stylesheet" href="${css}"></head><body>`;
const page = (css, title, body) => head(css, title) + body + '</body></html>';

function spark(w, h) {
  const v = data.cashSeries, min = Math.min(...v), max = Math.max(...v), X = i => 2 + i * (w - 4) / (v.length - 1), Y = n => 4 + (1 - (n - min) / (max - min || 1)) * (h - 8);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="보유 현금 추이"><polyline points="${v.map((n, i) => `${X(i).toFixed(1)},${Y(n).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

/* ---------- A. 미니멀 에디토리얼 ---------- */
const aMain = page('a.css', '시안 A · 메인', `
<header class="mast"><div class="in"><a href="#">대한민국 자영업자로 살아남기</a><nav><a href="#">사장이 되어보기</a><a href="#">실제 사장님들</a><a href="#">자영업 데이터</a><a href="#">계산 방법</a></nav></div></header>
<main class="in">
<p class="kicker">중앙일보 「2024 자영업 리포트」 기반 인터랙티브</p>
<h1>대한민국<br>자영업자로 살아남기</h1>
<p class="deck">당신에게 1억원이 생겼습니다. 회사를 그만두고 사장이 되시겠습니까?</p>
<p><a class="btn" href="#">내 가게 시작하기</a></p>
<figure class="hero"><img src="${PHOTO}" alt="녹두호프에서 맥주병을 치우는 점주 김례숙 씨"><figcaption>2024년 9월, 서울 관악구 녹두호프. 점주 김례숙 씨가 손님이 떠난 테이블을 치우고 있다. 사진 중앙일보</figcaption></figure>
<ol class="toc"><li><a href="#"><b>실제 사장님들</b><span>2024년 취재 8편과 공식 통계</span></a></li><li><a href="#"><b>자영업 데이터</b><span>2024년 이후 무엇이 달라졌나</span></a></li><li><a href="#"><b>계산 방법</b><span>게임이 장부를 계산하는 법</span></a></li></ol>
</main>
<footer class="in">독립 제작 · 중앙일보 공식 서비스 아님</footer>`);
const aGame = page('a.css', '시안 A · 게임', `
<header class="mast"><div class="in"><a href="#">대한민국 자영업자로 살아남기</a><span class="state">개업 ${data.month}개월차 · ${data.month} / 36</span></div></header>
<main class="in game">
<p class="figures"><span>보유 현금 <b>${data.cash}만원</b></span><span>최근 매출 <b>${data.revenue}만원</b></span><span>남은 대출 <b>${data.debt}만원</b></span></p>
<article>
<p class="kicker">${data.who} · ${data.channel}</p>
<h1 class="ev">${data.title}</h1>
<blockquote>${data.body}</blockquote>
<ol class="choices"><li><a href="#"><i>1</i>${data.a}</a></li><li><a href="#"><i>2</i>${data.b}</a></li></ol>
</article>
<aside class="note"><img src="${PHOTO2}" alt="호부침개 점주 백선기 씨"><p><b>실제 사례</b> 2024년 호부침개 백선기 씨는 손님을 기다리며 가게 밖을 내다보고 있었다. <a href="#">이야기 읽기</a></p></aside>
<p class="fine"><a href="#">장부 보기</a> · <a href="#">여기서 문 닫기</a></p>
</main>`);

/* ---------- B. 스토리 중심 게임 ---------- */
const bMain = page('b.css', '시안 B · 메인', `
<section class="stage" style="background-image:url(${ILLU})">
<header><span>대한민국 자영업자로 살아남기</span><a href="#">메뉴</a></header>
<div class="panel"><h1>당신에게 1억원이 생겼습니다.</h1><p>회사를 그만두고 사장이 되시겠습니까?</p><a class="go" href="#">내 가게 시작하기</a><p class="sub"><a href="#">실제 사장님들의 이야기</a><a href="#">그때와 지금</a></p></div>
</section>
<footer>대한민국 자영업자로 살아남기 · 중앙일보 2024 자영업 리포트 기반 · 독립 제작</footer>`);
const bGame = page('b.css', '시안 B · 게임', `
<div class="hud"><span>개업 ${data.month}개월차</span><span>현금 <b>${data.cash}</b></span><span>매출 <b>${data.revenue}</b></span><span>대출 <b>${data.debt}</b></span></div>
<section class="scene" style="background-image:url(${ILLU})"><span class="tag">${data.channel}</span></section>
<section class="talk"><div class="who"><i>${data.who.split(' · ')[1]?.[0] ?? '민'}</i><b>${data.who}</b></div><h1>${data.title}</h1><p>${data.body}</p></section>
<section class="pick"><a href="#"><i>1</i>${data.a}</a><a href="#"><i>2</i>${data.b}</a></section>
<p class="foot"><a href="#">장부</a><a href="#">영업 조정</a><a href="#">문 닫기</a></p>`);

/* ---------- C. 모던 웹 서비스 ---------- */
const cMain = page('c.css', '시안 C · 메인', `
<header class="bar"><div class="in"><a class="logo" href="#">대한민국 자영업자로 살아남기</a><nav><a href="#">사장이 되어보기</a><a href="#">실제 사장님들</a><a href="#">자영업 데이터</a><a href="#">계산 방법</a></nav></div></header>
<main class="in hero"><div><h1>당신에게 1억원이 생겼습니다.<br>사장이 되시겠습니까?</h1><p class="lead">36개월 동안 매출과 대출, 가족과 건강 사이에서 선택하고, 그 끝에서 실제 사장님들의 이야기를 만납니다.</p><div class="row"><a class="btn" href="#">내 가게 시작하기</a><a class="link" href="#">실제 사장님들의 이야기</a></div>
<ol class="steps"><li><b>1</b>업종 고르기</li><li><b>2</b>자본과 상권 정하기</li><li><b>3</b>개업하고 36개월</li></ol></div>
<figure><img src="${ILLU}" alt="동네 가게에서 영수증을 정리하는 점주"></figure></main>
<section class="in real"><h2>실제 사장님들</h2><div class="grid"><a href="#"><img src="${PHOTO}" alt="녹두호프 점주 김례숙 씨"><b>손님이 줄어든 호프집</b><span>서울 관악구 녹두호프 · 2024년 9월</span></a><a href="#"><img src="${PHOTO2}" alt="호부침개 점주 백선기 씨"><b>권리금을 날린 전집 사장님</b><span>호부침개 · 2024년 9월</span></a><div class="num"><span>2026년 적용 최저임금</span><strong>10,320<small>원/시간</small></strong><span>2024년 9,860원보다 4.7% 올랐습니다.</span></div></div></section>
<footer class="in">독립 제작 · 중앙일보 공식 서비스 아님</footer>`);
const cGame = page('c.css', '시안 C · 게임', `
<header class="bar"><div class="in"><a class="logo" href="#">대한민국 자영업자로 살아남기</a><span class="state">${data.month} / 36개월</span></div></header>
<div class="in layout">
<aside class="side"><div class="prog"><i style="width:${data.month / 36 * 100}%"></i></div>
<dl><div><dt>보유 현금</dt><dd>${data.cash}<small>만원</small></dd></div><div><dt>최근 매출</dt><dd>${data.revenue}<small>만원</small></dd></div><div><dt>남은 대출</dt><dd>${data.debt}<small>만원</small></dd></div></dl>
<div class="chart"><p>현금 추이</p>${spark(260, 64)}</div><p class="fine"><a href="#">장부 보기</a> · <a href="#">여기서 문 닫기</a></p></aside>
<main class="event"><dl class="strip"><div><dt>현금</dt><dd>${data.cash}</dd></div><div><dt>매출</dt><dd>${data.revenue}</dd></div><div><dt>대출</dt><dd>${data.debt}</dd></div></dl><p class="chip">${data.who} · ${data.channel}</p><h1>${data.title}</h1><p class="body">${data.body}</p>
<div class="choices"><a href="#">${data.a}</a><a href="#">${data.b}</a></div></main></div>`);

const css = {
  'a.css': `
*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font:17px/1.75 'Noto Sans KR','Malgun Gothic',sans-serif;word-break:keep-all}
a{color:inherit}.in{width:min(760px,100% - 40px);margin:0 auto}
.mast{border-bottom:1px solid #111}.mast .in{width:min(1100px,100% - 40px);display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:56px;flex-wrap:wrap}
.mast>.in>a{font:900 17px 'Noto Serif KR',serif;text-decoration:none}.mast nav{display:flex;gap:20px;font-size:15px}.mast nav a{text-decoration:none}.state{font-size:15px;color:#555}
.kicker{margin:40px 0 12px;font-size:14px;color:#555}h1{font:900 clamp(30px,5vw,44px)/1.25 'Noto Serif KR',serif;margin:0 0 20px;letter-spacing:-.02em}
.deck{font:500 clamp(18px,2.4vw,21px)/1.7 'Noto Serif KR',serif;margin:0 0 24px}
.btn{display:inline-block;background:#111;color:#fff;padding:14px 28px;text-decoration:none;font-weight:700;font-size:17px}
.hero{margin:40px calc(50% - min(550px,50vw - 20px)) 0;width:min(1100px,100vw - 40px)}.hero img{display:block;width:100%;height:auto}
figcaption{font-size:14px;color:#555;margin-top:8px;max-width:760px}
.toc{list-style:none;margin:40px 0;padding:0;border-top:1px solid #111}.toc a{display:flex;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid #ddd;text-decoration:none}.toc span{color:#555;font-size:15px;text-align:right}
footer{padding:24px 0 48px;font-size:14px;color:#555}
.game{padding-bottom:48px}.figures{display:flex;flex-wrap:wrap;gap:4px 24px;margin:24px 0;padding:12px 0;border-top:1px solid #111;border-bottom:1px solid #ddd;font-size:16px;color:#555}.figures b{color:#111;font-weight:700}
h1.ev{font-size:clamp(26px,4vw,34px);margin-bottom:16px}blockquote{margin:0 0 28px;padding:0 0 0 20px;border-left:3px solid #111;font:500 18px/1.85 'Noto Serif KR',serif}
.choices{list-style:none;margin:0;padding:0;border-top:1px solid #111}.choices a{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #ddd;text-decoration:none;font-size:18px}.choices a:hover{background:#f6f6f4}.choices i{font:900 18px 'Noto Serif KR',serif;font-style:normal}
.note{display:flex;gap:16px;align-items:flex-start;margin:40px 0 24px;font-size:15px;line-height:1.65}.note img{width:120px;height:80px;object-fit:cover;flex:none}.note p{margin:0}.fine{font-size:14px;color:#555}
@media(max-width:520px){.mast nav{display:none}.note img{width:96px}}`,
  'b.css': `
*{box-sizing:border-box}body{margin:0;background:#1b1714;color:#f2ebe0;font:17px/1.75 'Noto Sans KR','Malgun Gothic',sans-serif;word-break:keep-all}a{color:inherit}
.stage{min-height:100vh;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:space-between}
@media(max-width:700px){.stage{background-position:78% 40%}}
.stage header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:rgba(27,23,20,.78);font-weight:700;font-size:16px}.stage header a{text-decoration:none;min-height:44px;display:flex;align-items:center}
.panel{background:rgba(27,23,20,.88);padding:24px 20px 28px;max-width:640px;margin:0 0 0 0}
@media(min-width:900px){.panel{margin:0 0 56px 56px;padding:32px 36px}}
h1{font:900 clamp(26px,4vw,38px)/1.3 'Noto Serif KR',serif;margin:0 0 8px}.panel p{margin:0 0 20px;font-size:19px}
.go{display:inline-flex;align-items:center;min-height:52px;padding:0 28px;background:#e0a458;color:#1b1714;font-weight:900;font-size:18px;text-decoration:none}
.panel .sub{margin:20px 0 0;display:flex;gap:20px;flex-wrap:wrap;font-size:15px}.panel .sub a{padding:6px 0}
footer{padding:20px;font-size:14px;color:#b9ae9f}
.hud{display:flex;flex-wrap:wrap;gap:4px 20px;padding:12px 20px;background:#120f0d;font-size:15px;color:#b9ae9f}.hud b{color:#f2ebe0;font-weight:700;margin-left:4px}.hud span:first-child{color:#e0a458;font-weight:700}
.scene{height:clamp(180px,32vw,340px);background-size:cover;background-position:30% 55%;position:relative}.tag{position:absolute;left:20px;bottom:0;background:#e0a458;color:#1b1714;font-weight:700;font-size:14px;padding:4px 12px}
.talk{max-width:820px;margin:0 auto;padding:24px 20px 8px}.who{display:flex;align-items:center;gap:12px;margin-bottom:12px}.who i{display:grid;place-items:center;width:44px;height:44px;background:#e0a458;color:#1b1714;font:900 20px 'Noto Serif KR',serif;font-style:normal}.who b{font-size:16px}
.talk h1{font-size:clamp(24px,3.6vw,32px)}.talk p{font-size:19px;line-height:1.85;margin:0}
.pick{max-width:820px;margin:0 auto;padding:20px;display:grid;gap:12px}.pick a{display:flex;gap:16px;align-items:center;min-height:64px;padding:12px 20px;background:#2a231e;border:1px solid #4a3f35;text-decoration:none;font-size:18px;font-weight:500}.pick a:hover{border-color:#e0a458}.pick i{display:grid;place-items:center;flex:none;width:32px;height:32px;background:#e0a458;color:#1b1714;font-weight:900;font-style:normal}
.foot{max-width:820px;margin:0 auto;padding:4px 20px 32px;display:flex;gap:24px;font-size:15px;color:#b9ae9f}.foot a{padding:8px 0}`,
  'c.css': `
*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#1c2330;font:17px/1.7 'Noto Sans KR','Malgun Gothic',sans-serif;word-break:keep-all}a{color:inherit}
.in{width:min(1120px,100% - 40px);margin:0 auto}.bar{background:#fff;border-bottom:1px solid #e3e6ec}.bar .in{display:flex;justify-content:space-between;align-items:center;min-height:60px;gap:16px}
.logo{font-weight:900;font-size:17px;text-decoration:none}.bar nav{display:flex;gap:24px;font-size:15px}.bar nav a{text-decoration:none;color:#4a5568}.state{font-size:15px;color:#4a5568}
.hero{display:grid;gap:32px;padding:48px 0;align-items:center}@media(min-width:900px){.hero{grid-template-columns:1.05fr 1fr;gap:64px;padding:80px 0}}
h1{font:900 clamp(28px,4vw,42px)/1.3 'Noto Sans KR',sans-serif;letter-spacing:-.03em;margin:0 0 16px}.lead{font-size:18px;color:#4a5568;margin:0 0 24px;max-width:30em}
.row{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;min-height:52px;padding:0 28px;background:#2556d6;color:#fff;border-radius:8px;font-weight:700;font-size:17px;text-decoration:none}.link{font-size:16px;color:#2556d6;font-weight:500}
.steps{list-style:none;margin:32px 0 0;padding:0;display:flex;gap:20px;flex-wrap:wrap;font-size:15px;color:#4a5568}.steps li{display:flex;align-items:center;gap:8px}.steps b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#e8eefc;color:#2556d6;font-size:14px}
figure{margin:0}figure img{display:block;width:100%;height:auto;border-radius:8px}footer{padding:24px 0 48px;font-size:14px;color:#4a5568}
.layout{display:grid;gap:24px;padding:24px 0 48px}@media(min-width:900px){.layout{grid-template-columns:300px 1fr;gap:48px;padding-top:40px;align-items:start}.side{position:sticky;top:24px}}
.side{background:#fff;border:1px solid #e3e6ec;border-radius:8px;padding:20px}.prog{height:6px;background:#e3e6ec;border-radius:3px;margin-bottom:16px}.prog i{display:block;height:100%;background:#2556d6;border-radius:3px}
dl{margin:0;display:grid;gap:12px}dl div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:1px solid #eef0f4;padding-bottom:12px}dt{font-size:15px;color:#4a5568}dd{margin:0;font-weight:900;font-size:22px}dd small{font-size:14px;font-weight:500;color:#4a5568;margin-left:2px}
.chart{margin-top:16px;color:#2556d6}.chart p{margin:0 0 4px;font-size:14px;color:#4a5568}.fine{font-size:14px;color:#4a5568;margin:16px 0 0}
.event{background:#fff;border:1px solid #e3e6ec;border-radius:8px;padding:28px}.chip{display:inline-block;margin:0 0 12px;padding:4px 12px;background:#e8eefc;color:#1f46b0;border-radius:99px;font-size:14px;font-weight:700}
.event h1{font-size:clamp(24px,3vw,30px);margin-bottom:12px}.body{font-size:18px;line-height:1.8;margin:0 0 24px}.choices{display:grid;gap:12px}.choices a{display:flex;align-items:center;min-height:56px;padding:12px 20px;border:1px solid #c9ced8;border-radius:8px;font-size:17px;font-weight:500;text-decoration:none;background:#fff}.choices a:hover{border-color:#2556d6;background:#f4f7ff}
.strip{display:none}@media(max-width:899px){.side dl{display:none}}.real{padding:0 0 48px}.real h2{font-size:22px;margin:0 0 16px}.real .grid{display:grid;gap:24px}@media(min-width:900px){.real .grid{grid-template-columns:1fr 1fr 1fr;gap:32px}}
.real a{text-decoration:none;display:block}.real a img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:8px;margin-bottom:12px}.real a b{display:block;font-size:18px}.real a span,.real .num span{font-size:14px;color:#4a5568}
.real .num strong{display:block;font-size:40px;font-weight:900;line-height:1.2;margin:8px 0}.real .num small{font-size:16px;font-weight:500;color:#4a5568;margin-left:4px}.real .num{border-top:2px solid #1c2330;padding-top:16px}
@media(max-width:899px){.layout{padding-bottom:0}.side{order:2}.event{order:1;padding:20px 20px 0}.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid #eef0f4}.strip dt{font-size:14px;color:#4a5568}.strip dd{margin:0;font-weight:900;font-size:19px}.choices{position:sticky;bottom:0;background:#fff;padding:12px 0;margin:0 -20px;padding-inline:20px;border-top:1px solid #e3e6ec}.bar nav{display:none}}`,
};
fs.mkdirSync('design-previews', { recursive: true });
for (const [name, html] of Object.entries({ 'a-main.html': aMain, 'a-game.html': aGame, 'b-main.html': bMain, 'b-game.html': bGame, 'c-main.html': cMain, 'c-game.html': cGame })) fs.writeFileSync(`design-previews/${name}`, html);
for (const [name, text] of Object.entries(css)) fs.writeFileSync(`design-previews/${name}`, text.trim() + '\n');
fs.writeFileSync('design-previews/index.html', page('a.css', '시안', '<main class="in"><h1>시안</h1><ol><li><a href="a-main.html">A 메인</a> · <a href="a-game.html">A 게임</a></li><li><a href="b-main.html">B 메인</a> · <a href="b-game.html">B 게임</a></li><li><a href="c-main.html">C 메인</a> · <a href="c-game.html">C 게임</a></li></ol></main>'));
console.log('ok', data.title, data.month);
