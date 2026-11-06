(function () {
  'use strict';
  const button = document.getElementById('copyEstimatorLink');
  const field = document.getElementById('estimatorLinkField');
  const status = document.getElementById('estimatorLinkStatus');
  if (!button) return;
  button.addEventListener('click', async () => {
    const base = location.protocol === 'file:' ? document.querySelector('link[rel="canonical"]').href : location.href;
    const url = new URL('curtain-estimator.html', base).href;
    field.value = url;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      status.textContent = '已複製連結，可分享給客人或窗簾公司。';
    } catch (_) {
      field.hidden = false; field.focus(); field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_) { /* 保留連結供手動複製。 */ }
      status.textContent = copied ? '已複製連結。' : '請自行複製已選取的連結。';
    }
  });
})();
