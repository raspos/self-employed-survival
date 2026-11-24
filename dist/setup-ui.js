export function simplifySetup() {
  const setup = document.querySelector('#setup');
  const capital = document.querySelector('#funds');
  const details = document.createElement('details');
  details.className = 'assumptions setup-details';
  const heading = document.createElement('summary');
  heading.textContent = '상세 설정';
  details.append(heading);

  setup.querySelector('.desc')?.remove();
  const title = setup.querySelector('h2');
  title.textContent = '내 가게 열기';
  setup.querySelector('.kicker')?.remove();
  setup.querySelector('.brand-section .kicker')?.remove();
  setup.querySelector('.brand-section h3').textContent = '브랜드 선택';
  for (const id of ['loan', 'owner']) {
    details.append(document.getElementById(id).closest('.form-group'));
  }
  const extra = setup.querySelector('.extra-setup');
  extra.before(details);
  details.append(extra, setup.querySelector('.assumptions:not(.setup-details)'), setup.querySelector('.fee-preview'));

  const presets = document.createElement('div');
  presets.className = 'capital-presets';
  presets.setAttribute('role', 'group');
  presets.setAttribute('aria-label', '창업 자본 빠른 선택');
  for (const [amount, label] of [[5000, '5천만원'], [10000, '1억원'], [20000, '2억원']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.amount = amount;
    button.onclick = () => {
      capital.value = amount;
      capital.dispatchEvent(new Event('input', { bubbles: true }));
    };
    presets.append(button);
  }
  const sync = () => {
    for (const button of presets.children) {
      button.setAttribute('aria-pressed', String(button.dataset.amount === capital.value));
    }
  };
  capital.before(presets);
  capital.addEventListener('input', sync);
  sync();
  document.querySelector('#startAlert').setAttribute('aria-live', 'polite');
}
