// 사건 채널 → 표현 형식. 모든 채널이 어느 형식에든 걸려야 한다(tests/ui.test.mjs).
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function formatKind(channel) {
  if (/은행|공문|고지서|계약서|알림|공지/.test(channel)) return 'doc';
  if (/문자/.test(channel)) return 'msg';
  if (/전화/.test(channel)) return 'call';
  if (/대화|현장/.test(channel)) return 'talk';
  if (/소식|리뷰/.test(channel)) return 'news';
  if (/달력/.test(channel)) return 'cal';
  return 'plain';
}

export function eventView({ channel, who, text, month }) {
  const t = esc(text), w = esc(who), c = esc(channel);
  switch (formatKind(channel)) {
    case 'doc': return `<div class="fmt-doc"><div class="sheet"><header><span>${c}</span><span>${month}개월차</span></header><p>${t}</p></div></div>`;
    case 'msg': return `<div class="fmt-msg"><div class="bubble">${w===c?'':`<span class="who-line">${w}</span>`}${t}</div></div>`;
    case 'call': return `<div class="fmt-call"><div class="call"><span class="dot"></span><div><small>${w} · 통화</small><p>${t}</p></div></div></div>`;
    case 'talk': return `<div class="fmt-talk"><div class="line"><b>${w}</b>${t}</div></div>`;
    case 'news': return `<div class="fmt-news"><div class="clip"><header>${c}${/가상/.test(channel) ? ' · 가상' : ''}</header><p>${t}</p></div></div>`;
    case 'cal': return `<div class="fmt-cal"><div class="cal"><b>${month}<br>개월</b><p>${t}</p></div></div>`;
    default: return `<p>${t}</p>`;
  }
}
