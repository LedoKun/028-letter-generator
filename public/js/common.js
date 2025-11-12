// Common utilities for date handling and form helpers across generators
// Exposes window.Common with small surface area for reuse.
(function () {
  const ERA_BE = 'BE';
  const ERA_CE = 'CE';

  function pad2(n) { return String(n).padStart(2, '0'); }

  function normalizeDigits(value) {
    return String(value || '').replace(/[^0-9]/g, '');
  }

  function parseDate(str, era) {
    if (!str) return null;
    const m = String(str).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    let y = parseInt(m[3], 10);
    if (Number.isNaN(d) || Number.isNaN(mo) || Number.isNaN(y) || mo < 0 || mo > 11 || d < 1 || d > 31) return null;
    if (era === ERA_BE) y -= 543;
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
    return dt;
  }

  function formatDate(date, era) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const d = pad2(date.getDate());
    const m = pad2(date.getMonth() + 1);
    let y = date.getFullYear();
    if (era === ERA_BE) y += 543;
    return `${d}/${m}/${y}`;
  }

  function convertDateString(str, fromEra, toEra) {
    const dt = parseDate(str, fromEra);
    if (!dt) return '';
    return formatDate(dt, toEra);
  }

  function attachDateAutoFormat(input, getEra) {
    if (!input) return;
    const handler = (event) => {
      let raw = normalizeDigits(input.value);
      if (event && event.inputType === 'deleteContentBackward' && input.value.slice(-1) === '/') {
        input.value = input.value.slice(0, -1);
        return;
      }
      if (raw.length > 8) raw = raw.slice(0, 8);
      let v = '';
      if (raw.length > 0) v += raw.slice(0, 2);
      if (raw.length >= 3) v += '/' + raw.slice(2, 4);
      if (raw.length >= 5) v += '/' + raw.slice(4, 8);
      input.value = v;

      if (event && (event.type === 'blur' || (event.type === 'input' && v.length === 10))) {
        const era = getEra ? getEra() : ERA_CE;
        const valid = !!parseDate(v, era);
        input.style.borderColor = (!v || valid) ? '' : 'red';
      }
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    input.maxLength = 10;
    return () => {
      input.removeEventListener('input', handler);
      input.removeEventListener('blur', handler);
    };
  }

  function setTodayIfEmpty(input, era) {
    if (input && !input.value) {
      input.value = formatDate(new Date(), era);
    }
  }

  function getEraFromForm(form) {
    const root = (typeof form === 'string') ? document.getElementById(form) : form;
    const sel = root ? root.querySelector('#yearEra') : document.getElementById('yearEra');
    const val = sel ? sel.value : ERA_CE;
    return (val === ERA_BE || val === ERA_CE) ? val : ERA_CE;
  }

  function updateDateLabelsForEra(container, era) {
    const root = (typeof container === 'string') ? document.getElementById(container) : (container || document);
    if (!root) return;
    root.querySelectorAll('label').forEach(lab => {
      const txt = lab.textContent || '';
      const cleaned = txt.replace(/\((พ\.ศ\.|BE|CE)\)/gi, '').replace(/\s+$/,'');
      // Skip labels that are not true date fields, e.g., medicineDuration
      if (/(วัน|Date)/i.test(cleaned) && lab.htmlFor && lab.htmlFor !== 'medicineDuration') {
        const suffix = era === ERA_BE ? ' (พ.ศ.)' : ' (CE)';
        lab.textContent = cleaned + suffix;
      }
    });
    root.querySelectorAll('input.date-input').forEach(inp => {
      inp.placeholder = 'DD/MM/YYYY';
    });
  }

  window.Common = {
    ERA_BE,
    ERA_CE,
    parseDate,
    formatDate,
    convertDateString,
    attachDateAutoFormat,
    setTodayIfEmpty,
    getEraFromForm,
    updateDateLabelsForEra
  };
})();
