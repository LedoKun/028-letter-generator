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

  function parseMonthYear(str, era) {
    if (!str) return null;
    const match = String(str).match(/^(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);
    if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) return null;
    if (era === ERA_BE) year -= 543;
    return { month, year };
  }

  function convertMonthYearString(str, fromEra, toEra) {
    const parsed = parseMonthYear(str, fromEra);
    if (!parsed) return '';
    let year = parsed.year;
    if (toEra === ERA_BE) year += 543;
    return `${pad2(parsed.month)}/${year}`;
  }

  function parseTime24(str) {
    if (!str) return null;
    const match = String(str).match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  function formatDateInputValue(value) {
    const raw = normalizeDigits(value).slice(0, 8);
    let formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += `/${raw.slice(2, 4)}`;
    if (raw.length >= 5) formatted += `/${raw.slice(4, 8)}`;
    return formatted;
  }

  function formatMonthYearInputValue(value) {
    const raw = normalizeDigits(value).slice(0, 6);
    let formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += `/${raw.slice(2, 6)}`;
    return formatted;
  }

  function formatTimeInputValue(value, padThreeDigits = false) {
    let raw = normalizeDigits(value).slice(0, 4);
    if (padThreeDigits && raw.length === 3) raw = `0${raw}`;
    if (raw.length === 3) return raw;
    let formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += `:${raw.slice(2, 4)}`;
    return formatted;
  }

  function attachDateAutoFormat(input, getEra) {
    if (!input) return;
    const handler = (event) => {
      if (event && event.inputType === 'deleteContentBackward' && input.value.slice(-1) === '/') {
        input.value = input.value.slice(0, -1);
        return;
      }
      const v = formatDateInputValue(input.value);
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
    input.inputMode = 'numeric';
    input.pattern = '\\d{2}/\\d{2}/\\d{4}';
    return () => {
      input.removeEventListener('input', handler);
      input.removeEventListener('blur', handler);
    };
  }

  function attachMonthYearAutoFormat(input, getEra) {
    if (!input) return;
    const handler = (event) => {
      if (event && event.inputType === 'deleteContentBackward' && input.value.slice(-1) === '/') {
        input.value = input.value.slice(0, -1);
        return;
      }
      const value = formatMonthYearInputValue(input.value);
      input.value = value;
      if (event && (event.type === 'blur' || (event.type === 'input' && value.length === 7))) {
        const era = getEra ? getEra() : ERA_CE;
        input.style.borderColor = (!value || parseMonthYear(value, era)) ? '' : 'red';
      }
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    input.maxLength = 7;
    input.inputMode = 'numeric';
    input.pattern = '\\d{2}/\\d{4}';
    input.placeholder = 'MM/YYYY';
    return () => {
      input.removeEventListener('input', handler);
      input.removeEventListener('blur', handler);
    };
  }

  function attachTimeAutoFormat(input) {
    if (!input) return;
    const handler = (event) => {
      if (event && event.inputType === 'deleteContentBackward' && input.value.slice(-1) === ':') {
        input.value = input.value.slice(0, -1);
        return;
      }
      const value = formatTimeInputValue(input.value, event && event.type === 'blur');
      input.value = value;
      if (event && (event.type === 'blur' || (event.type === 'input' && value.length === 5))) {
        input.style.borderColor = (!value || parseTime24(value)) ? '' : 'red';
      }
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    input.maxLength = 5;
    input.inputMode = 'numeric';
    input.pattern = '([01]\\d|2[0-3]):[0-5]\\d';
    input.placeholder = 'HH:MM';
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
      const hasRequiredMarker = !!lab.querySelector('.required-asterisk') || /\*/.test(txt);
      const linkedInput = lab.htmlFor ? root.querySelector(`#${lab.htmlFor}`) : null;
      const isFormattedDateInput = linkedInput
        && (linkedInput.classList.contains('date-input') || linkedInput.classList.contains('month-year-input'));
      const cleaned = txt
        .replace(/\((พ\.ศ\.|BE|CE)\)/gi, '')
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (isFormattedDateInput) {
        const suffix = era === ERA_BE ? ' (พ.ศ.)' : ' (CE)';
        lab.textContent = cleaned;
        if (hasRequiredMarker) {
          lab.appendChild(document.createTextNode(' '));
          const requiredMarker = document.createElement('span');
          requiredMarker.className = 'required-asterisk';
          requiredMarker.textContent = '*';
          lab.appendChild(requiredMarker);
        }
        lab.appendChild(document.createTextNode(suffix));
      }
    });
    root.querySelectorAll('input.date-input').forEach(inp => {
      inp.placeholder = 'DD/MM/YYYY';
    });
    root.querySelectorAll('input.month-year-input').forEach(inp => {
      inp.placeholder = 'MM/YYYY';
    });
  }

  // --- New Shared Functions ---

  function autoFocusPatientName(id = 'patientName') {
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  function saveDoctorInfo(thaiId, engId, licenseId) {
    let sharedInfo = {};
    try {
      const existingInfo = localStorage.getItem('sharedDoctorInfo');
      if (existingInfo) sharedInfo = JSON.parse(existingInfo);
    } catch (e) { console.error("Error reading sharedDoctorInfo:", e); sharedInfo = {}; }

    if (thaiId) {
        const el = document.getElementById(thaiId);
        if (el) sharedInfo.sharedDoctorNameThai = el.value;
    }
    if (engId) {
        const el = document.getElementById(engId);
        if (el) sharedInfo.sharedDoctorNameEnglish = el.value.toUpperCase();
    }
    if (licenseId) {
        const el = document.getElementById(licenseId);
        if (el) sharedInfo.sharedMedicalLicense = el.value;
    }
    localStorage.setItem('sharedDoctorInfo', JSON.stringify(sharedInfo));
  }

  function loadDoctorInfo(thaiId, engId, licenseId) {
    const savedInfo = localStorage.getItem('sharedDoctorInfo');
    if (savedInfo) {
      try {
        const doctorInfo = JSON.parse(savedInfo);
        if (thaiId) {
            const el = document.getElementById(thaiId);
            if (el) el.value = doctorInfo.sharedDoctorNameThai || '';
        }
        if (engId) {
            const el = document.getElementById(engId);
            if (el) el.value = doctorInfo.sharedDoctorNameEnglish || '';
        }
        if (licenseId) {
            const el = document.getElementById(licenseId);
            if (el) el.value = doctorInfo.sharedMedicalLicense || '';
        }
      } catch (e) {
        console.error("Error parsing sharedDoctorInfo:", e);
      }
    }

    [thaiId, engId, licenseId].forEach(id => {
      if (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => saveDoctorInfo(thaiId, engId, licenseId));
      }
    });
  }

  function autoFormatNationalId(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 13) value = value.slice(0, 13);

    let formattedValue = '';
    if (value.length > 0) formattedValue += value.slice(0, 1);
    if (value.length >= 2) formattedValue += '-' + value.slice(1, 5);
    if (value.length >= 6) formattedValue += '-' + value.slice(5, 10);
    if (value.length >= 11) formattedValue += '-' + value.slice(10, 12);
    if (value.length >= 13) formattedValue += '-' + value.slice(12, 13);

    input.value = formattedValue;
    input.maxLength = 17;
  }

  function handleFormSubmitOnEnter(formId, previewFunction) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'TEXTAREA') {
          return;
        }
        if (activeElement && activeElement.type !== 'button' && activeElement.type !== 'submit') {
          event.preventDefault();
          if (typeof previewFunction === 'function') previewFunction();
        }
      }
    });
  }

  // --- Smart Date Component (Module 3) ---

  function detectEraFromValue(value) {
    const m = String(value || '').match(/(\d{4})$/);
    return (m && parseInt(m[1], 10) >= 2300) ? ERA_BE : ERA_CE;
  }

  function parseDateAuto(value) {
    const era = detectEraFromValue(value);
    const date = parseDate(value, era);
    if (date) return date;
    const partial = parseMonthYear(value, era);
    return partial ? new Date(partial.year, partial.month - 1, 1) : null;
  }

  function parseMonthYearAuto(value) {
    return parseMonthYear(value, detectEraFromValue(value));
  }

  function convertDateToEra(value, targetEra) {
    const sourceEra = detectEraFromValue(value);
    return convertDateString(value, sourceEra, targetEra)
      || convertMonthYearString(value, sourceEra, targetEra);
  }

  function convertMonthYearToEra(value, targetEra) {
    return convertMonthYearString(value, detectEraFromValue(value), targetEra);
  }

  function eraBadgeText(value) {
    const m = String(value || '').match(/(\d{4})$/);
    return (m && parseInt(m[1], 10) >= 2300) ? '[BE]' : '[CE]';
  }

  function wrapWithBadge(input, includeFormatToggle) {
    if (!input || !input.parentNode) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'date-field-wrap mt-1';
    input.parentNode.insertBefore(wrapper, input);

    const badge = document.createElement('span');
    badge.className = 'era-badge';
    badge.textContent = '[CE]';
    wrapper.appendChild(badge);
    wrapper.appendChild(input);
    input.classList.remove('mt-1');

    const updateBadge = () => { badge.textContent = eraBadgeText(input.value); };
    input.addEventListener('input', updateBadge);
    input.addEventListener('blur', updateBadge);
    updateBadge();

    if (includeFormatToggle) {
      const select = document.createElement('select');
      select.className = 'date-format-toggle';
      const fullOption = document.createElement('option');
      fullOption.value = 'full';
      fullOption.textContent = 'DD/MM/YYYY';
      const myOption = document.createElement('option');
      myOption.value = 'monthyear';
      myOption.textContent = 'MM/YYYY';
      select.appendChild(fullOption);
      select.appendChild(myOption);
      wrapper.appendChild(select);
      return { wrapper, badge, select, updateBadge };
    }
    return { wrapper, badge, updateBadge };
  }

  function attachEraBadge(input) {
    if (!input || input.dataset.eraBadgeAttached) return;
    input.dataset.eraBadgeAttached = '1';
    wrapWithBadge(input, false);
  }

  function attachSmartDate(input) {
    if (!input || input.dataset.smartDateAttached) return;
    input.dataset.smartDateAttached = '1';
    input.dataset.eraBadgeAttached = '1';

    const parts = wrapWithBadge(input, true);
    const select = parts.select;
    const updateBadge = parts.updateBadge;

    const switchFormat = () => {
      if (select.value === 'monthyear') {
        const full = input.value;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(full)) input.dataset.fullDate = full;
        const m = full.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        input.value = m ? `${m[2]}/${m[3]}` : '';
        input.maxLength = 7;
        input.placeholder = 'MM/YYYY';
        input.pattern = '\\d{2}/\\d{4}';
      } else {
        if (input.dataset.fullDate) input.value = input.dataset.fullDate;
        input.maxLength = 10;
        input.placeholder = 'DD/MM/YYYY';
        input.pattern = '\\d{2}/\\d{2}/\\d{4}';
      }
      updateBadge();
    };
    select.addEventListener('change', switchFormat);

    const handler = (event) => {
      if (event && event.inputType === 'deleteContentBackward' && input.value.slice(-1) === '/') {
        input.value = input.value.slice(0, -1);
      }
      if (select.value === 'monthyear') {
        const v = formatMonthYearInputValue(input.value);
        input.value = v;
        if (/^\d{2}\/\d{4}$/.test(v)) {
          const saved = input.dataset.fullDate || '';
          const sm = saved.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          const day = sm ? sm[1] : '01';
          input.dataset.fullDate = `${day}/${v}`;
        }
        if (event && (event.type === 'blur' || (event.type === 'input' && v.length === 7))) {
          input.style.borderColor = (!v || parseMonthYear(v, detectEraFromValue(v))) ? '' : 'red';
        }
      } else {
        const v = formatDateInputValue(input.value);
        input.value = v;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) input.dataset.fullDate = v;
        if (event && (event.type === 'blur' || (event.type === 'input' && v.length === 10))) {
          input.style.borderColor = (!v || parseDate(v, detectEraFromValue(v))) ? '' : 'red';
        }
      }
      updateBadge();
    };
    input.addEventListener('input', handler);
    input.addEventListener('blur', handler);
    input.maxLength = 10;
    input.inputMode = 'numeric';
    input.pattern = '\\d{2}/\\d{2}/\\d{4}';
    input.placeholder = 'DD/MM/YYYY';

    return () => {
      input.removeEventListener('input', handler);
      input.removeEventListener('blur', handler);
    };
  }

  // --- Cross-form patient state (Module 1) ---

  const PATIENT_STORE_KEY = 'sharedPatientInfo';
  const PATIENT_FIELD_ALIASES = {
    patientName: 'patientName',
    hn: 'hn',
    dob: 'dob',
    age: 'patientAge',
    sex: 'patientGender',
    address: 'address',
    nationalId: 'nationalId',
    passportNumber: 'passportNumber'
  };

  function readPatientStore() {
    try {
      const raw = localStorage.getItem(PATIENT_STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writePatientStore(data) {
    try {
      localStorage.setItem(PATIENT_STORE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore quota/security errors
    }
  }

  function syncPatientFields(mapping) {
    // mapping: { canonicalKey: elementId }
    const store = readPatientStore();
    Object.keys(mapping).forEach(key => {
      const el = document.getElementById(mapping[key]);
      if (!el) return;
      if (store[key]) el.value = store[key];
      const persist = () => {
        const current = readPatientStore();
        current[key] = el.value;
        writePatientStore(current);
      };
      el.addEventListener('input', persist);
      el.addEventListener('change', persist);
    });
  }

  function clearPatientStore() {
    try {
      localStorage.removeItem(PATIENT_STORE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function setupClearFormButton(buttonId, formId) {
    const btn = document.getElementById(buttonId);
    const form = document.getElementById(formId);
    if (!btn || !form) return;
    wireClearFormButton(btn, form);
  }

  function wireClearFormButton(btn, form) {
    if (!btn || !form) return;
    btn.addEventListener('click', function () {
      clearPatientStore();
      form.reset();
      location.reload();
    });
  }

  function setupClearFormButtons(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    document.querySelectorAll('[data-clear-form]').forEach(btn => wireClearFormButton(btn, form));
  }

  function renderDocTabs(activeId) {
    const header = document.querySelector('header');
    if (!header || header.parentNode.querySelector('.doc-tabs')) return;
    const tabs = [
      { id: 'referral', label: 'หนังสือส่งตัว / Referral', href: '/referral/index.html' },
      { id: 'medication', label: 'หนังสือรับรองการพกยา / Medication Certificate for Travel', href: '/certificate-medication-letter/index.html' },
      { id: 'medical', label: 'ใบรับรองแพทย์ / Medical Certificate', href: '/medical-certificate/index.html' },
      { id: 'freeform', label: 'หนังสือกำหนดเอง / Custom', href: '/free-form-letter/index.html' }
    ];
    const nav = document.createElement('nav');
    nav.className = 'doc-tabs';
    tabs.forEach(tab => {
      const a = document.createElement('a');
      a.href = tab.href;
      a.textContent = tab.label;
      a.className = 'doc-tab' + (tab.id === activeId ? ' active' : '');
      nav.appendChild(a);
    });
    header.insertAdjacentElement('afterend', nav);
    const actions = document.createElement('div');
    actions.className = 'top-form-actions';
    actions.innerHTML = '<button type="button" class="btn-danger thai-font" data-clear-form>ล้างฟอร์ม / Clear Form</button>';
    nav.insertAdjacentElement('afterend', actions);
  }

  const UI_LANGUAGE_KEY = 'documentLanguage';
  const SINGLE_LANGUAGE_LABELS = {
    'Retroviral infection': ['การติดเชื้อ Retroviral', 'Retroviral infection'],
    'Active Syphilis': ['โรคซิฟิลิสที่อยู่ระหว่างการรักษา', 'Active Syphilis'],
    'Suspected Mpox': ['สงสัยโรค mpox', 'Suspected Mpox'],
    'HBV Co-Infection': ['การติดเชื้อ HBV ร่วม', 'HBV Co-Infection'],
    'HCV Co-Infection': ['การติดเชื้อ HCV ร่วม', 'HCV Co-Infection'],
    'Treated Syphilis': ['ซิฟิลิสที่รักษาแล้ว', 'Treated Syphilis'],
    'Treated HCV': ['HCV ที่รักษาแล้ว', 'Treated HCV'],
    'Treated TB': ['วัณโรคที่รักษาแล้ว', 'Treated TB'],
    'Completed TPT': ['ได้รับ TPT ครบแล้ว', 'Completed TPT'],
    'Ongoing TPT': ['อยู่ระหว่างรับ TPT', 'Ongoing TPT'],
    'Other Medical History': ['ประวัติการรักษาอื่น', 'Other Medical History']
  };

  function languagePair(thai, english) {
    const fragment = document.createDocumentFragment();
    [['th', thai], ['en', english]].forEach(([language, value]) => {
      const span = document.createElement('span');
      span.className = `i18n-${language}`;
      span.textContent = value;
      fragment.appendChild(span);
    });
    return fragment;
  }

  function prepareLanguageText() {
    const selector = 'label, legend, button, a, .preview-title, .preview-empty, .doc-tab';
    document.querySelectorAll(selector).forEach(element => {
      if (element.closest('.language-toggle') || element.dataset.i18nReady) return;
      element.dataset.i18nReady = '1';
      Array.from(element.childNodes).forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent;
        const separator = text.indexOf(' / ');
        if (separator >= 0 && /[\u0E00-\u0E7F]/.test(text.slice(0, separator))) {
          node.replaceWith(languagePair(text.slice(0, separator), text.slice(separator + 3)));
          return;
        }
        const pair = SINGLE_LANGUAGE_LABELS[text.trim()];
        if (pair) node.replaceWith(languagePair(pair[0], pair[1]));
      });
    });

    const header = document.querySelector('header');
    if (header) {
      const thaiHeading = header.querySelector('h1');
      const englishHeading = header.querySelector('p');
      if (thaiHeading) thaiHeading.classList.add('i18n-th');
      if (englishHeading) {
        englishHeading.className = thaiHeading ? thaiHeading.className : englishHeading.className;
        englishHeading.classList.remove('i18n-th');
        englishHeading.classList.add('i18n-en');
      }
    }

    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
      if (input.dataset.placeholderTh) return;
      const placeholder = input.placeholder;
      const separator = placeholder.indexOf(' / ');
      if (separator >= 0 && /[\u0E00-\u0E7F]/.test(placeholder.slice(0, separator))) {
        input.dataset.placeholderTh = placeholder.slice(0, separator);
        input.dataset.placeholderEn = placeholder.slice(separator + 3);
      } else if (placeholder.startsWith('เช่น ')) {
        input.dataset.placeholderTh = placeholder;
        input.dataset.placeholderEn = `e.g., ${placeholder.slice(5)}`;
      } else if (placeholder === 'จำนวน') {
        input.dataset.placeholderTh = placeholder;
        input.dataset.placeholderEn = 'Quantity';
      } else if (placeholder === 'ระบุเอกสารอื่น ๆ') {
        input.dataset.placeholderTh = placeholder;
        input.dataset.placeholderEn = 'Specify other documents';
      } else if (placeholder.startsWith('e.g., ')) {
        input.dataset.placeholderTh = `เช่น ${placeholder.slice(6)}`;
        input.dataset.placeholderEn = placeholder;
      }
    });

    document.querySelectorAll('option').forEach(option => {
      if (option.dataset.labelTh) return;
      const separator = option.textContent.indexOf(' / ');
      if (separator >= 0 && /[\u0E00-\u0E7F]/.test(option.textContent.slice(0, separator))) {
        option.dataset.labelTh = option.textContent.slice(0, separator);
        option.dataset.labelEn = option.textContent.slice(separator + 3);
      } else if (option.textContent.trim() === '-- Select --') {
        option.dataset.labelTh = '-- เลือก --';
        option.dataset.labelEn = '-- Select --';
      }
    });
  }

  function setupLanguageToggle(formId) {
    const form = document.getElementById(formId);
    const header = document.querySelector('header');
    if (!form || !header) return;

    prepareLanguageText();
    const input = document.createElement('input');
    input.type = 'hidden';
    input.id = 'language';
    input.name = 'language';
    form.appendChild(input);

    const toggle = document.createElement('div');
    header.classList.add('language-toggle-host');
    toggle.className = 'language-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Document language');
    toggle.innerHTML = '<button type="button" data-language="th">TH</button><button type="button" data-language="en">EN</button>';
    header.appendChild(toggle);

    const apply = language => {
      const selected = language === 'en' ? 'en' : 'th';
      const targetEra = selected === 'th' ? ERA_BE : ERA_CE;
      input.value = selected;
      document.documentElement.lang = selected;
      document.body.dataset.language = selected;
      toggle.querySelectorAll('button').forEach(button => {
        const active = button.dataset.language === selected;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('[data-placeholder-th]').forEach(element => {
        element.placeholder = element.dataset[selected === 'th' ? 'placeholderTh' : 'placeholderEn'];
      });
      document.querySelectorAll('option[data-label-th]').forEach(option => {
        option.textContent = option.dataset[selected === 'th' ? 'labelTh' : 'labelEn'];
      });
      document.querySelectorAll('[data-value-th][data-value-en]').forEach(element => {
        if (!element.dataset.valueOriginal) element.dataset.valueOriginal = element.value;
        const defaults = [element.dataset.valueOriginal, element.dataset.valueTh, element.dataset.valueEn];
        if (defaults.includes(element.value)) element.value = element.dataset[selected === 'th' ? 'valueTh' : 'valueEn'];
      });
      form.querySelectorAll('[data-language-field]').forEach(section => {
        const active = section.dataset.languageField === selected;
        section.querySelectorAll('input, select, textarea').forEach(element => {
          if (!element.dataset.languageRequired) element.dataset.languageRequired = String(element.required);
          element.disabled = !active;
          element.required = active && element.dataset.languageRequired === 'true';
          if (!active) element.style.borderColor = '';
        });
      });
      form.querySelectorAll('.date-input').forEach(element => {
        if (parseDateAuto(element.value)) element.value = convertDateToEra(element.value, targetEra);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      });
      form.querySelectorAll('.month-year-input').forEach(element => {
        if (parseMonthYearAuto(element.value)) element.value = convertMonthYearToEra(element.value, targetEra);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      });
      try { localStorage.setItem(UI_LANGUAGE_KEY, selected); } catch (error) { /* ignore */ }
      document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: selected } }));
    };

    toggle.addEventListener('click', event => {
      const button = event.target.closest('button[data-language]');
      if (button) apply(button.dataset.language);
    });
    let initial = 'th';
    try { initial = localStorage.getItem(UI_LANGUAGE_KEY) || initial; } catch (error) { /* ignore */ }
    apply(initial);
  }

  function setupPdfPreview({ formId, collectData, buildPayload, debounce = 1000 }) {
    const form = document.getElementById(formId);
    let iframe = document.getElementById('previewFrame');
    const status = document.getElementById('previewStatus');
    if (!form || !iframe || !status) return;
    let timer;
    let renderVersion = 0;
    let objectUrl = '';

    const message = (thai, english, state, keepPreview = false) => {
      status.textContent = document.documentElement.lang === 'en' ? english : thai;
      status.dataset.state = state;
      status.dataset.hasPreview = String(keepPreview);
      status.style.display = 'flex';
      iframe.style.display = keepPreview ? 'block' : 'none';
    };
    const render = async (version = ++renderVersion) => {
      const { data, isValid } = collectData();
      if (!isValid) {
        message('กรอกข้อมูลที่จำเป็นให้ครบถ้วนเพื่อดูตัวอย่าง', 'Complete required fields to preview', 'empty');
        return;
      }
      message('กำลังอัปเดตตัวอย่าง PDF…', 'Updating PDF preview…', 'loading', !!objectUrl);
      try {
        const blob = await window.PdfGenerator.generateBlob(buildPayload(data));
        if (version !== renderVersion) return;
        const nextUrl = URL.createObjectURL(blob);
        const nextFrame = document.createElement('iframe');
        nextFrame.className = 'preview-frame preview-frame-next';
        nextFrame.title = iframe.title;
        nextFrame.addEventListener('load', () => {
          if (version !== renderVersion) {
            nextFrame.remove();
            URL.revokeObjectURL(nextUrl);
            return;
          }
          nextFrame.id = 'previewFrame';
          nextFrame.classList.remove('preview-frame-next');
          iframe.remove();
          iframe = nextFrame;
          status.style.display = 'none';
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          objectUrl = nextUrl;
        }, { once: true });
        nextFrame.src = nextUrl;
        iframe.after(nextFrame);
      } catch (error) {
        if (version !== renderVersion) return;
        console.error('Error generating live preview:', error);
        message('ไม่สามารถสร้างตัวอย่าง PDF ได้ โปรดลองอีกครั้ง', 'Unable to generate the PDF preview. Please try again.', 'error', !!objectUrl);
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      const version = ++renderVersion;
      message('รออัปเดตตัวอย่าง PDF…', 'PDF preview update pending…', 'pending', !!objectUrl);
      timer = setTimeout(() => render(version), debounce);
    };
    form.addEventListener('input', schedule);
    form.addEventListener('change', schedule);
    document.addEventListener('languagechange', schedule);
    window.addEventListener('beforeunload', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
    render();
  }

  window.Common = {
    ERA_BE,
    ERA_CE,
    parseDate,
    formatDate,
    convertDateString,
    parseMonthYear,
    convertMonthYearString,
    parseTime24,
    formatDateInputValue,
    formatMonthYearInputValue,
    formatTimeInputValue,
    attachDateAutoFormat,
    attachMonthYearAutoFormat,
    attachTimeAutoFormat,
    setTodayIfEmpty,
    getEraFromForm,
    updateDateLabelsForEra,
    autoFocusPatientName,
    saveDoctorInfo,
    loadDoctorInfo,
    autoFormatNationalId,
    handleFormSubmitOnEnter,
    detectEraFromValue,
    parseDateAuto,
    parseMonthYearAuto,
    convertDateToEra,
    convertMonthYearToEra,
    eraBadgeText,
    attachEraBadge,
    attachSmartDate,
    syncPatientFields,
    clearPatientStore,
    setupClearFormButton,
    setupClearFormButtons,
    renderDocTabs,
    setupLanguageToggle,
    setupPdfPreview
  };
})();
