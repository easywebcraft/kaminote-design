/* お問い合わせフォーム（2026-10-14）。見た目は contact-form.css
   ・必須の項目が空、電話・メールの形がおかしいときは、その項目の下に日本語で知らせる
   ・「見学を申し込む」から来たときは、ご用件を「見学の申し込み」にしておく（#form-visit）。採用ページからは「採用について」（#form-recruit）
   ・送り先（form の data-endpoint）が空のあいだは送信しない。サンプルである旨と電話番号を表示する
     送り先を決めたら data-endpoint に URL を入れる（Google フォームなど）。送るときは項目の name をそのまま使う */
(function () {
  var form = document.querySelector('.cf-form');
  if (!form) return;
  var result = document.querySelector('.cf-result');

  // 「採用について」を選んだときは、保護者向けの項目を隠し、名前の見出しを「お名前」にする（2026-10-26）
  var kind = form.querySelector('select[name="kind"]');
  function mode() {
    var recruit = kind && kind.value === '採用について';
    form.classList.toggle('is-recruit', recruit);
    form.querySelectorAll('.cf-for-parent').forEach(function (el) { el.hidden = recruit; });
    form.querySelectorAll('.cf-for-recruit').forEach(function (el) { el.hidden = !recruit; });
    form.querySelectorAll('.cf-parent-only').forEach(function (row) {
      row.hidden = recruit;
      row.querySelectorAll('input, textarea').forEach(function (el) { el.disabled = recruit; });
    });
    var parkHelp = form.querySelector('input[name="park"][value="病児保育"]');
    if (parkHelp) parkHelp.closest('label').hidden = recruit;
  }
  if (kind) kind.addEventListener('change', mode);

  function preset() {
    var sel = form.querySelector('select[name="kind"]');
    var to = { '#form-visit': '見学の申し込み', '#form-recruit': '採用について' }[location.hash];
    if (to) {
      if (sel) sel.value = to;
      mode();
      var f = document.getElementById('form');
      if (f) f.scrollIntoView();
    }
  }
  preset();
  window.addEventListener('hashchange', preset);

  function check(row) {
    var ok = true;
    row.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'radio') return;
      if (!el.checkValidity()) ok = false;
    });
    var radios = row.querySelectorAll('input[type="radio"][required]');
    if (radios.length && !row.querySelector('input[type="radio"]:checked')) ok = false;
    row.classList.toggle('is-bad', !ok);
    return ok;
  }
  form.querySelectorAll('.cf-row, .cf-agree-row').forEach(function (row) {
    row.addEventListener('change', function () { if (row.classList.contains('is-bad')) check(row); });
    row.addEventListener('input', function () { if (row.classList.contains('is-bad')) check(row); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    form.querySelectorAll('.cf-row, .cf-agree-row').forEach(function (row) {
      if (!check(row) && !first) first = row;
    });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var el = first.querySelector('input, select, textarea');
      if (el) setTimeout(function () { el.focus({ preventScroll: true }); }, 400);
      return;
    }
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      result.className = 'cf-result sample is-shown';
      result.querySelector('.cf-result-done').hidden = true;
      result.querySelector('.cf-result-sample').hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    fetch(endpoint, { method: 'POST', mode: 'no-cors', body: new FormData(form) }).then(function () {
      form.reset();
      result.className = 'cf-result done is-shown';
      result.querySelector('.cf-result-done').hidden = false;
      result.querySelector('.cf-result-sample').hidden = true;
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
