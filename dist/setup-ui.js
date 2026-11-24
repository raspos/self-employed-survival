// 창업 자본 빠른 선택 버튼. 5천만원은 소형 점포(10평)로 시작한다.
export function mountPresets() {
  const capital = document.getElementById('funds');
  const box = document.getElementById('capitalPresets');
  for (const [amount, label] of [[5000, '5천만원'], [10000, '1억원'], [20000, '2억원']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.amount = amount;
    button.onclick = () => {
      capital.value = amount;
      document.getElementById('size').value = amount === 5000 ? 10 : 20;
      capital.dispatchEvent(new Event('input', { bubbles: true }));
    };
    box.append(button);
  }
  const sync = () => {
    for (const button of box.children) button.setAttribute('aria-pressed', String(button.dataset.amount === capital.value));
  };
  capital.addEventListener('input', sync);
  sync();
}
