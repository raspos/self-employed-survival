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
