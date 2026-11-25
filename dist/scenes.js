// 게임 장면 이미지. 기본 일러스트(shop-illustration.jpg)의 부분 확대와, 같은 색감으로 그린 평면 장면(은행·가족·폐업·개업).
const P = { sky: '#e9a77a', wall: '#f0d9b0', green: '#2f5d45', dark: '#3a2a20', brick: '#b5563c', amber: '#f2b866', cream: '#f7ead0', night: '#2b2a3a', paper: '#efe7d8' };
const svg = body => `<svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${body}</svg>`;
const person = (x, y, body, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-62" r="22" fill="${P.dark}"/><path d="M-34 0v-26a34 34 0 0 1 68 0v26z" fill="${body}"/></g>`;

const bank = () => svg(`<rect width="1200" height="300" fill="${P.wall}"/>
<rect y="210" width="1200" height="90" fill="${P.dark}"/>
<rect x="60" y="40" width="190" height="120" fill="#cfe0d0"/><rect x="60" y="40" width="190" height="120" fill="none" stroke="${P.green}" stroke-width="8"/><line x1="155" y1="40" x2="155" y2="160" stroke="${P.green}" stroke-width="6"/>
<circle cx="980" cy="70" r="36" fill="${P.cream}" stroke="${P.dark}" stroke-width="6"/><path d="M980 70V46M980 70l16 10" stroke="${P.dark}" stroke-width="5" fill="none"/>
<rect x="330" y="120" width="360" height="130" fill="${P.green}"/><rect x="330" y="116" width="360" height="14" fill="${P.brick}"/>
${person(510, 120, '#6b7f95')}<rect x="420" y="150" width="180" height="70" fill="${P.cream}" opacity=".35"/>
<rect x="760" y="170" width="150" height="46" fill="${P.paper}"/><rect x="778" y="184" width="100" height="6" fill="${P.dark}" opacity=".5"/><rect x="778" y="198" width="70" height="6" fill="${P.dark}" opacity=".5"/>
${person(1040, 240, P.brick, 1.2)}`);

const family = () => svg(`<rect width="1200" height="300" fill="${P.night}"/>
<rect x="80" y="40" width="240" height="150" fill="#3b4a66"/><circle cx="130" cy="95" r="5" fill="${P.amber}"/><circle cx="190" cy="120" r="4" fill="${P.amber}"/><circle cx="250" cy="85" r="5" fill="${P.amber}"/><circle cx="280" cy="140" r="4" fill="${P.amber}"/>
<rect x="80" y="40" width="240" height="150" fill="none" stroke="${P.dark}" stroke-width="10"/>
<path d="M740 0v70" stroke="${P.dark}" stroke-width="5"/><path d="M690 70h100l-24 40h-52z" fill="${P.amber}"/>
<rect y="220" width="1200" height="80" fill="#2a1d16"/>
<rect x="420" y="190" width="640" height="26" fill="${P.brick}"/><rect x="450" y="216" width="14" height="70" fill="${P.dark}"/><rect x="1020" y="216" width="14" height="70" fill="${P.dark}"/>
${person(520, 190, '#6b7f95')}${person(740, 190, P.green)}${person(960, 190, P.amber, .8)}
<circle cx="610" cy="178" r="16" fill="${P.cream}"/><circle cx="850" cy="178" r="16" fill="${P.cream}"/><circle cx="740" cy="176" r="20" fill="${P.paper}"/>`);

const closed = () => svg(`<rect width="1200" height="300" fill="#9a8f86"/>
<rect y="240" width="1200" height="60" fill="#5b524b"/>
<path d="M300 40h600v26H300z" fill="${P.green}"/><path d="M300 66h600l-20 24H320z" fill="#244a37"/>
<rect x="320" y="90" width="560" height="150" fill="#6f6860"/>
${Array.from({ length: 10 }, (_, i) => `<rect x="320" y="${96 + i * 14}" width="560" height="6" fill="#5e5851"/>`).join('')}
<rect x="540" y="130" width="120" height="76" fill="${P.paper}" transform="rotate(-3 600 168)"/><rect x="560" y="150" width="80" height="6" fill="${P.dark}" opacity=".55" transform="rotate(-3 600 168)"/><rect x="560" y="166" width="60" height="6" fill="${P.dark}" opacity=".55" transform="rotate(-3 600 168)"/>
<rect x="120" y="60" width="10" height="180" fill="${P.dark}"/><circle cx="125" cy="56" r="16" fill="${P.amber}" opacity=".7"/>
${person(1020, 240, '#6b7f95')}`);

const open = () => svg(`<rect width="1200" height="300" fill="${P.sky}"/>
<rect y="240" width="1200" height="60" fill="${P.dark}"/>
<path d="M280 50h640v30H280z" fill="${P.green}"/><path d="M280 80h640l-20 26H300z" fill="#244a37"/>
<rect x="300" y="106" width="600" height="134" fill="${P.amber}"/><rect x="330" y="124" width="240" height="96" fill="${P.cream}"/><rect x="620" y="124" width="240" height="96" fill="${P.cream}"/>
<rect x="540" y="150" width="120" height="90" fill="${P.green}"/>
<path d="M360 20h90v26l-45 12-45-12z" fill="${P.brick}"/><rect x="940" y="140" width="120" height="100" fill="${P.brick}"/>
<path d="M1000 130v-40m-30 70h60" stroke="${P.dark}" stroke-width="6"/>${person(1130, 240, P.green)}${person(110, 240, '#6b7f95')}`);

export const vignettes = { bank, family, closed, open };

// 사건 → 장면. 이미지가 도움이 되는 사건에만 붙이고 나머지는 대사 중심으로 둔다.
export function sceneFor(event, state) {
  const ch = event?.channel ?? '';
  if (state.finished) return null;
  if (state.decisions.length === 0) return { art: 'art-open', tag: '개업' };
  if (/은행/.test(ch)) return { svg: 'bank', tag: ch };
  if (/가족/.test(ch)) return { svg: 'family', tag: ch };
  if (/건물주|계약서/.test(ch)) return { art: 'art-street', tag: ch };
  if (event?.kind === 'competition') return { art: 'art-street', tag: '경쟁 점포' };
  if (/직원/.test(ch)) return { art: 'art-counter', tag: ch };
  if (/본사|거래처|수리/.test(ch)) return null;
  return state.decisions.length % 5 === 0 ? { art: `art-${state.industry}`, tag: ch } : null;
}

export function sceneHTML(scene) {
  if (!scene) return '';
  const art = scene.svg ? vignettes[scene.svg]() : `<div class="art ${scene.art}"></div>`;
  return `${art}<span class="tag">${scene.tag}</span>`;
}

// 업종 선택 카드: 업종마다 전용 평면 일러스트 (400x300)
const shopSvg = body => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${body}</svg>`;
const frame = (sign, signColor, awning, signText = '#f7ead0') => `<rect width="400" height="300" fill="${P.sky}"/>
<rect y="244" width="400" height="56" fill="${P.dark}"/><rect y="244" width="400" height="6" fill="#5b4332"/>
<rect x="46" y="92" width="308" height="152" fill="${P.wall}"/>
<rect x="60" y="14" width="280" height="44" fill="${signColor}"/><text x="200" y="50" text-anchor="middle" font-family="'Noto Serif KR',serif" font-weight="900" font-size="36" fill="${signText}">${sign}</text>
<path d="M40 70h320v22H40z" fill="${awning}"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${40 + i * 40} 92h40l-20 16z" fill="${i % 2 ? P.cream : awning}"/>`).join('')}`;
const door = x => `<rect x="${x}" y="130" width="64" height="114" fill="${P.green}"/><rect x="${x + 8}" y="140" width="48" height="60" fill="#cfe0d0"/><circle cx="${x + 52}" cy="196" r="3" fill="${P.amber}"/>`;
const win = (x, w = 120) => `<rect x="${x}" y="124" width="${w}" height="96" fill="${P.amber}"/><rect x="${x}" y="124" width="${w}" height="96" fill="none" stroke="${P.green}" stroke-width="6"/>`;

const chicken = () => shopSvg(`${frame('치킨', P.brick, P.brick)}${win(70)}${door(250)}
<g transform="translate(110 170)"><path d="M-26 0h52l-8 44h-36z" fill="#f7ead0"/><path d="M-22 14h44M-18 28h36" stroke="${P.brick}" stroke-width="8"/><path d="M-26 0a26 12 0 0 1 52 0z" fill="${P.brick}"/><circle cx="-10" cy="-8" r="9" fill="#c9763c"/><circle cx="8" cy="-10" r="9" fill="#c9763c"/><circle cx="-1" cy="-16" r="8" fill="#d98c4a"/></g>
<g transform="translate(335 236)"><circle cx="-14" cy="0" r="9" fill="${P.dark}"/><circle cx="22" cy="0" r="9" fill="${P.dark}"/><path d="M-14 -2h36l-8-22h-14z" fill="${P.green}"/><rect x="-6" y="-34" width="22" height="14" fill="${P.amber}"/></g>`);

const cafe = () => shopSvg(`${frame('카페', '#5b4332', P.green)}${win(70, 130)}${door(260)}
<path d="M110 150h44v26a22 22 0 0 1-44 0z" fill="#f7ead0"/><path d="M154 156a12 12 0 0 1 0 22" fill="none" stroke="#f7ead0" stroke-width="5"/><path d="M122 140c-6-8 6-12 0-20M138 140c-6-8 6-12 0-20" fill="none" stroke="#fff6e0" stroke-width="3" opacity=".8"/>
<path d="M190 124v18M190 142a14 14 0 0 1 14 14h-28a14 14 0 0 1 14-14z" stroke="${P.dark}" stroke-width="3" fill="${P.brick}"/>
<g fill="${P.dark}"><circle cx="64" cy="232" r="14"/><rect x="62" y="232" width="4" height="12"/><circle cx="352" cy="232" r="14"/><rect x="350" y="232" width="4" height="12"/></g>`);

const store = () => shopSvg(`<rect width="400" height="300" fill="${P.sky}"/>
<rect y="244" width="400" height="56" fill="${P.dark}"/><rect y="244" width="400" height="6" fill="#5b4332"/>
<rect x="30" y="40" width="340" height="204" fill="${P.cream}"/>
<rect x="30" y="40" width="340" height="46" fill="${P.green}"/><rect x="30" y="86" width="340" height="8" fill="${P.amber}"/>
<text x="200" y="76" text-anchor="middle" font-family="'Noto Serif KR',serif" font-weight="900" font-size="36" fill="#f7ead0">편의점</text>
<rect x="46" y="104" width="190" height="124" fill="#fff6e0" stroke="${P.green}" stroke-width="6"/>
${[0, 1, 2].map(r => `<rect x="54" y="${116 + r * 36}" width="174" height="4" fill="${P.dark}" opacity=".5"/>` + Array.from({ length: 6 }, (_, c) => `<rect x="${58 + c * 28}" y="${r * 36 + 98}" width="22" height="20" fill="${[P.brick, P.amber, P.green, '#6b7f95', P.brick, P.amber][(c + r) % 6]}"/>`).join('')).join('')}
<rect x="262" y="104" width="86" height="140" fill="#cfe0d0" stroke="${P.green}" stroke-width="6"/><line x1="305" y1="104" x2="305" y2="244" stroke="${P.green}" stroke-width="4"/>
<rect x="352" y="170" width="12" height="40" fill="${P.brick}"/>`);

const snack = () => shopSvg(`<rect width="400" height="300" fill="${P.sky}"/>
<rect y="244" width="400" height="56" fill="${P.dark}"/><rect y="244" width="400" height="6" fill="#5b4332"/>
<rect x="46" y="100" width="308" height="144" fill="${P.wall}"/>
<rect x="70" y="16" width="260" height="42" fill="${P.brick}"/><text x="200" y="50" text-anchor="middle" font-family="'Noto Serif KR',serif" font-weight="900" font-size="36" fill="#f7ead0">분식</text>
<path d="M36 64h328v30H36z" fill="${P.brick}"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${36 + i * 41}" y="64" width="20.5" height="30" fill="#f7ead0"/>`).join('')}
<rect x="60" y="150" width="190" height="94" fill="#8a6a50"/><rect x="60" y="144" width="190" height="10" fill="#5b4332"/>
<ellipse cx="120" cy="140" rx="46" ry="12" fill="#3a2a20"/><path d="M74 140a46 36 0 0 0 92 0z" fill="#c9763c"/><ellipse cx="120" cy="140" rx="40" ry="9" fill="${P.brick}"/>
${[100, 118, 136].map(x => `<rect x="${x}" y="134" width="16" height="7" rx="3" fill="#f2c48a"/>`).join('')}
<path d="M98 120c-6-9 6-13 0-22M124 120c-6-9 6-13 0-22M148 120c-6-9 6-13 0-22" fill="none" stroke="#fff6e0" stroke-width="3" opacity=".85"/>
<ellipse cx="200" cy="196" rx="22" ry="9" fill="#f7ead0"/><path d="M178 196a22 14 0 0 0 44 0z" fill="${P.green}"/>
<rect x="270" y="120" width="70" height="124" fill="${P.green}"/><rect x="278" y="130" width="54" height="64" fill="#cfe0d0"/>`);

export const industryArt = { chicken, cafe, store, snack };
