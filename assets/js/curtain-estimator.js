(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const pricing = window.CurtainPricing;
  let step = 1, currentGroups = null, batches = [], nextBatchId = 1;
  const names = ['洗滌風險', '量測方式', '輸入尺寸', '窗簾項目', '本組試算', '合計與複製'];
  const money = amount => '$' + amount.toLocaleString('zh-TW');
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const measure = () => document.querySelector('input[name="measure"]:checked').value;
  const allGroups = () => batches.flatMap(batch => batch.groups);
  const sizeText = group => `${group.measure === 'window' ? '整窗' : '單片布'} ${group.inputWidth} × ${group.inputHeight} cm`;

  function showStep(number) {
    step = number;
    for (let i = 1; i <= 6; i++) $('step' + i).hidden = i !== step;
    $('formError').textContent = '';
    $('stepCounter').textContent = `步驟 ${step}／6`;
    $('stepName').textContent = names[step - 1];
    $('progressFill').style.width = (step / 6 * 100) + '%';
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(step));
    document.querySelectorAll('.step-labels li').forEach((item, i) => {
      if (i === step - 1) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    $('wizardActions').hidden = step === 6;
    $('prevStep').hidden = step === 1;
    $('wizardActions').classList.toggle('single', step === 1);
    $('nextStep').textContent = step === 1 ? '開始試算' : step === 4 ? '查看本組試算' : step === 5 ? '加入清單並查看合計' : '下一步';
    if (step === 3 || step === 4) updateMeasure();
    if (step === 6) renderQuote();
    const heading = $('heading' + step);
    heading.focus({ preventScroll: true });
    const top = document.querySelector('.progress-heading').getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }

  function updateMeasure() {
    const isWindow = measure() === 'window';
    $('widthLabel').textContent = isWindow ? '整個窗戶寬（cm）' : '單片布寬（cm）';
    $('heightLabel').textContent = isWindow ? '完整窗戶高（cm）' : '單片布高（cm）';
    $('widthHint').textContent = isWindow ? '量整窗左右寬度，不用自行除以二' : '布攤平後，量左右寬度';
    $('heightHint').textContent = isWindow ? '量完整上下高度，高度不用減半' : '量布本身的上下高度';
    $('measureNotice').textContent = isWindow ? '整個窗戶的寬、高量一次。下一步分別選布簾與紗簾的款式、片數。' : '請量單片窗簾布攤平後的寬、高；相同尺寸再填片數。';
    $('windowGroups').hidden = !isWindow;
    $('actualGroup').hidden = isWindow;
    const width = Number($('width').value), height = Number($('height').value);
    $('dimensionSummary').textContent = width > 0 && height > 0 ? `${isWindow ? '整窗尺寸' : '單片布尺寸'}：${width} × ${height} cm` : '';
  }

  function dimensions() {
    const inputWidth = Number($('width').value), inputHeight = Number($('height').value);
    if (![inputWidth, inputHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('請輸入大於 0 的正確寬度與高度。');
    return { inputWidth, inputHeight, measure: measure() };
  }

  function collectGroups() {
    const input = dimensions();
    const groups = [];
    if (input.measure === 'window') {
      for (const kind of ['cloth', 'sheer']) {
        const prefix = kind === 'cloth' ? 'cloth' : 'sheer';
        if (!$(kind === 'cloth' ? 'washCloth' : 'washSheer').checked) continue;
        const label = kind === 'cloth' ? '布簾' : '紗簾';
        if (!$(prefix + 'Style').value) throw new Error(`請選擇${label}款式。`);
        if (!$(prefix + 'Qty').value) throw new Error(`請選擇${label}片數。`);
        groups.push(pricing.estimateGroup({ ...input, kind, style: $(prefix + 'Style').value, qty: Number($(prefix + 'Qty').value), materialKey: kind === 'cloth' ? $('clothMaterial').value : 'sheer' }));
      }
      if (!groups.length) throw new Error('請勾選要清洗的布簾或紗簾。');
    } else {
      if (!$('actualStyle').value) throw new Error('請選擇這組窗簾款式。');
      if (!$('actualQty').value) throw new Error('請選擇同尺寸片數。');
      groups.push(pricing.estimateGroup({ ...input, kind: $('actualKind').value, style: $('actualStyle').value, qty: Number($('actualQty').value), materialKey: $('actualMaterial').value }));
    }
    return groups;
  }

  function groupHtml(group, removeButton) {
    return `<div class="group-result"><div><strong>${escape(group.kindLabel)}｜${escape(group.styleLabel)}${group.kind === 'cloth' ? '｜' + escape(group.materialLabel) : ''}</strong><p>單片 ${money(group.unitPrice)} × ${group.qty} 片</p>${removeButton || ''}</div><div class="price">${money(group.subtotal)}</div></div>`;
  }

  function renderPreview() {
    currentGroups = collectGroups();
    const info = pricing.quoteTotal(currentGroups, false);
    $('previewSize').textContent = sizeText(currentGroups[0]);
    $('previewGroups').innerHTML = currentGroups.map(group => groupHtml(group)).join('');
    $('previewPieces').textContent = `本${measure() === 'window' ? '窗' : '組'}共洗 ${info.pieces} 片`;
    $('previewTotal').textContent = '洗費試算：' + money(info.washTotal);
  }

  function nextStep() {
    try {
      if (step === 1 && !$('agree').checked) throw new Error('請先勾選已閱讀並了解洗滌風險。');
      if (step === 3) dimensions();
      if (step === 4) renderPreview();
      if (step === 5) {
        if (!$('agree').checked) { showStep(1); throw new Error('請先閱讀並勾選洗滌風險告知。'); }
        if (!currentGroups) renderPreview();
        batches.push({ id: nextBatchId++, groups: currentGroups.map((group, i) => ({ ...group, id: i + 1 })), age: $('age').value });
        currentGroups = null;
      }
      showStep(step + 1);
    } catch (error) { $('formError').textContent = error.message; }
  }

  function renderQuote() {
    const groups = allGroups();
    if (!groups.length) $('installHelp').checked = false;
    const info = pricing.quoteTotal(groups, $('installHelp').checked);
    $('quoteList').innerHTML = batches.length ? batches.map((batch, index) => {
      const label = `第 ${index + 1} ${batch.groups[0].measure === 'window' ? '窗' : '組'}`;
      const total = pricing.quoteTotal(batch.groups, false);
      return `<article class="batch-summary"><h3>${label}</h3><div class="batch-size">${escape(sizeText(batch.groups[0]))}</div>${batch.groups.map(group => groupHtml(group, `<button type="button" class="text-button remove-group" data-batch="${batch.id}" data-group="${group.id}" aria-label="移除${label}的${group.kindLabel}">移除${group.kindLabel}</button>`)).join('')}<p class="batch-pieces">共 ${total.pieces} 片｜洗費 ${money(total.washTotal)}</p></article>`;
    }).join('') : '<p class="empty-quote">清單目前沒有窗簾項目，請再估一組。</p>';
    $('installBox').hidden = !groups.length;
    $('shareBox').hidden = !groups.length;
    $('installRule').textContent = `拆裝協助費：${money(info.base)}＋總洗費 ${info.rate * 100}%${info.snake ? '（清單含蛇行簾）' : ''}，向上進位至 $50 的倍數。`;
    $('quoteTotal').innerHTML = `<span>共洗 ${info.pieces} 片</span><div class="total-line">洗費試算<b>${money(info.washTotal)}</b></div>${$('installHelp').checked ? `<div class="total-line">拆裝協助費試算<b>${money(info.installFee)}</b></div><strong>預估總計：${money(info.total)}</strong>` : `<strong>洗費合計：${money(info.washTotal)}</strong>`}`;
    $('shareText').value = quoteShareText();
    $('copyStatus').textContent = '';
    document.querySelectorAll('[data-batch]').forEach(button => button.addEventListener('click', () => {
      const batch = batches.find(item => item.id === Number(button.dataset.batch));
      if (!batch) return;
      batch.groups = batch.groups.filter(group => group.id !== Number(button.dataset.group));
      batches = batches.filter(item => item.groups.length);
      renderQuote();
    }));
  }

  function quoteShareText() {
    const lines = ['潔屋洗衣漢口店｜窗簾清洗收件前參考', ''];
    batches.forEach((batch, index) => {
      const info = pricing.quoteTotal(batch.groups, false);
      lines.push(`第 ${index + 1} ${batch.groups[0].measure === 'window' ? '窗' : '組'}｜${sizeText(batch.groups[0])}`);
      batch.groups.forEach(group => {
        lines.push(`${group.kindLabel}｜${group.styleLabel}${group.kind === 'cloth' ? '｜' + group.materialLabel : ''}`);
        lines.push(`單片 ${money(group.unitPrice)} × ${group.qty} 片 = ${money(group.subtotal)}`);
      });
      lines.push(`共 ${info.pieces} 片｜洗費 ${money(info.washTotal)}`, '');
    });
    const info = pricing.quoteTotal(allGroups(), $('installHelp').checked);
    lines.push(`清洗片數合計：${info.pieces} 片`, `洗費合計：${money(info.washTotal)}`);
    if ($('installHelp').checked) lines.push('到府拆裝協助：需要', '拆裝協助費試算：' + money(info.installFee), '預估總計：' + money(info.total), '拆裝僅含拆下與裝回，不含整燙、定型、軌道調整；特殊狀況現場另估。');
    lines.push('已閱讀窗簾洗滌風險告知。', '線上試算僅供參考，正式價格與是否收件以門市收到窗簾後確認。');
    return lines.join('\n');
  }

  function updateLayer(kind) {
    const checked = $(kind === 'cloth' ? 'washCloth' : 'washSheer').checked;
    $(kind + 'Settings').hidden = !checked;
    $(kind + 'Settings').disabled = !checked;
    $(kind + 'Card').classList.toggle('selected', checked);
  }

  function updateStyle(select) {
    const preview = $(select.dataset.preview);
    preview.hidden = !select.value;
    if (!select.value) { preview.innerHTML = ''; return; }
    const hints = { pleated: '折簾：常見打摺窗簾。', snake: '蛇行簾：蛇行軌道或上方孔洞款式。', roman: '羅馬簾：橫向分段，可往上收合。' };
    preview.innerHTML = `<img src="assets/images/curtain-${select.value}.jpg" alt="${escape(pricing.styles[select.value])}款式參考"><p>${hints[select.value]}</p>`;
  }

  function updateAge() {
    const messages = { low: '仍可能因日曬與材質產生脆化、破損風險。', mid: '中度風險：洗後較可能出現脆化、縮水或配件老化。', high: '高度風險：請由門市收到實品後評估是否收件。' };
    $('riskMessage').textContent = messages[$('age').value];
    $('riskMessage').className = 'risk-message ' + $('age').value;
  }

  function clearDraft() {
    currentGroups = null;
    for (const id of ['width', 'height', 'clothStyle', 'clothQty', 'sheerStyle', 'sheerQty', 'actualStyle', 'actualQty']) $(id).value = '';
    $('washCloth').checked = false; $('washSheer').checked = false;
    $('actualKind').value = 'cloth'; $('actualMaterial').value = 'normal'; $('clothMaterial').value = 'normal';
    $('actualMaterialWrap').hidden = false;
    updateLayer('cloth'); updateLayer('sheer');
    document.querySelectorAll('.style-select').forEach(updateStyle);
  }

  async function copyText(text, field, status) {
    field.value = text;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = field.id === 'shareUrl' ? '已複製連結，可分享給客人或窗簾公司。' : '已複製試算內容，可貼給門市或窗簾公司。';
    } catch (_) {
      if (field.id === 'shareUrl') $('linkFallback').hidden = false;
      field.focus(); field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) { /* 保留文字供手動複製。 */ }
      status.textContent = copied ? '已複製。' : '請自行複製已選取的文字。';
    }
  }

  function estimatorUrl() {
    if (location.protocol === 'file:') return document.querySelector('link[rel="canonical"]').href;
    const url = new URL('curtain-estimator.html', location.href);
    return url.href;
  }

  document.querySelectorAll('.piece-select').forEach(select => {
    for (let n = 1; n <= 10; n++) select.add(new Option(n + ' 片', String(n)));
  });
  document.querySelectorAll('input[name="measure"]').forEach(input => input.addEventListener('change', updateMeasure));
  $('washCloth').addEventListener('change', () => updateLayer('cloth'));
  $('washSheer').addEventListener('change', () => updateLayer('sheer'));
  document.querySelectorAll('.style-select').forEach(select => select.addEventListener('change', () => updateStyle(select)));
  $('actualKind').addEventListener('change', () => { $('actualMaterialWrap').hidden = $('actualKind').value === 'sheer'; });
  $('age').addEventListener('change', updateAge);
  $('nextStep').addEventListener('click', nextStep);
  $('prevStep').addEventListener('click', () => showStep(step - 1));
  $('installHelp').addEventListener('change', renderQuote);
  $('nextItem').addEventListener('click', () => { clearDraft(); showStep(2); });
  $('resetForm').addEventListener('click', () => {
    if (batches.length && !window.confirm('要清空目前的試算清單，重新開始嗎？')) return;
    clearDraft(); batches = []; nextBatchId = 1; $('installHelp').checked = false; $('agree').checked = false; $('age').value = 'low';
    document.querySelector('input[name="measure"][value="actual"]').checked = true;
    renderQuote(); updateAge(); showStep(1);
  });
  $('copyQuote').addEventListener('click', () => copyText(quoteShareText(), $('shareText'), $('copyStatus')));
  document.querySelectorAll('.copy-link').forEach(button => button.addEventListener('click', () => copyText(estimatorUrl(), $('shareUrl'), $(button.dataset.status || 'linkStatus'))));
  document.querySelector('.wizard-panel').addEventListener('input', () => { currentGroups = null; $('formError').textContent = ''; });
  updateMeasure(); updateAge(); renderQuote();
})();
