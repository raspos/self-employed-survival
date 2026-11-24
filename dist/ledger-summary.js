const categories = [
  ['원재료·상품', ['material']],
  ['직원 인건비', ['wages']],
  ['임대료', ['rent']],
  ['배달·결제 비용', ['delivery', 'card']],
  ['가맹 로열티', ['royalty']],
  ['기타 운영비·사건 지출', ['other']],
  ['소득세·부가세 유보', ['tax', 'vat']],
  ['대출 이자', ['interest']],
  ['대출 원금', ['principal']],
];

export function businessOutflows(records) {
  const rows = categories.map(([label, fields]) => ({
    label,
    amount: records.reduce((total, row) => total +
      fields.reduce((subtotal, key) => subtotal + (row[key] ?? 0), 0), 0),
  }));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return { total, rows: rows.filter(row => row.amount > 0).sort((a,b) => b.amount-a.amount) };
}

export function largestDecisionExpense(decisions) {
  return decisions.reduce((largest, decision) =>
    decision.cost > (largest?.cost ?? 0) ? decision : largest, null);
}
