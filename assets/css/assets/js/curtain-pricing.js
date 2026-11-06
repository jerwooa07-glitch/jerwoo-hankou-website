(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CurtainPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const styles = { pleated: '折簾', snake: '蛇行簾', roman: '羅馬簾' };
  const materials = {
    sheer: { label: '紗簾', factor: 0.8 },
    normal: { label: '一般單層', factor: 1 },
    heavy: { label: '厚布／雙層／絨布', factor: 1.7 }
  };
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function roundPrice(amount) {
    for (const step of [250, 370, 500, 700]) if (amount <= step) return step;
    return Math.ceil(amount / 50) * 50;
  }
  function estimateGroup(input) {
    const { inputWidth, inputHeight, measure, kind, style, qty } = input;
    if (![inputWidth, inputHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('請輸入正確的寬度與高度。');
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error('請選擇 1～10 片。');
    if (!owns(styles, style)) throw new Error('請選擇窗簾款式。');
    if (!['actual', 'window'].includes(measure) || !['cloth', 'sheer'].includes(kind)) throw new Error('請選擇量法與窗簾類型。');
    const materialKey = kind === 'sheer' ? 'sheer' : input.materialKey;
    if (!owns(materials, materialKey) || (kind === 'cloth' && materialKey === 'sheer')) throw new Error('請選擇布簾材質。');
    let width = inputWidth;
    let height = inputHeight;
    if (measure === 'window') {
      // 先以此層片數推估單片覆蓋寬度，再沿用 V9 的款式換算。
      const coveredWidth = inputWidth / qty;
      if (style === 'snake') { width = Math.ceil(coveredWidth * 2.5); height = Math.ceil(inputHeight + 20); }
      else if (style === 'roman') { width = Math.ceil(coveredWidth + 15); height = Math.ceil(inputHeight + 15); }
      else { width = Math.ceil(coveredWidth + 20); height = Math.ceil(inputHeight + 20); }
    }
    // 保留 V9 的材數、材質倍率、單片級距及蛇行簾規則。
    const rawCai = style === 'snake' && width <= 600 ? width * height / 1800 : width * height / 900;
    const cai = Math.ceil(rawCai);
    const unitPrice = roundPrice(cai * 10 * materials[materialKey].factor);
    return {
      measure, kind, style, materialKey, inputWidth, inputHeight, width, height, cai, qty,
      kindLabel: kind === 'sheer' ? '紗簾' : '布簾',
      styleLabel: styles[style], materialLabel: materials[materialKey].label,
      unitPrice, subtotal: unitPrice * qty
    };
  }
  function quoteTotal(groups, needsInstall) {
    const washTotal = groups.reduce((sum, group) => sum + group.subtotal, 0);
    const pieces = groups.reduce((sum, group) => sum + group.qty, 0);
    const snake = groups.some(group => group.style === 'snake');
    const base = snake ? 1500 : 1000;
    const rate = snake ? 0.15 : 0.1;
    const installFee = groups.length && needsInstall ? Math.ceil((base + washTotal * rate) / 50) * 50 : 0;
    return { washTotal, pieces, snake, base, rate, installFee, total: washTotal + installFee };
  }
  return Object.freeze({ estimateGroup, quoteTotal, roundPrice, styles, materials });
});
