document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize Form ---
    initializeDateInputs();
    window.Common.loadDoctorInfo('doctorNameThai', 'doctorNameEnglish', 'medicalLicense');

    document.getElementById('previewButton').addEventListener('click', previewLetter);
    window.Common.handleFormSubmitOnEnter('freeFormLetterForm', previewLetter);

    // Auto-uppercase specific fields
    ['documentTitle', 'doctorNameEnglish'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                this.value = this.value.toUpperCase();
            });
        }
    });

    // Focus on document title initially
    document.getElementById('documentTitle').focus();

    function initializeDateInputs() {
        const form = document.getElementById('freeFormLetterForm');
        const getEra = () => window.Common.getEraFromForm(form);

        document.querySelectorAll('.date-input').forEach(input => {
            window.Common.attachDateAutoFormat(input, getEra);
            input.placeholder = 'DD/MM/YYYY';
        });

        const letterDateInput = document.getElementById('letterDate');
        window.Common.setTodayIfEmpty(letterDateInput, getEra());

        const eraSelect = document.getElementById('yearEra');
        if (eraSelect) {
            const onEraChange = () => {
                const newEra = getEra();
                window.Common.updateDateLabelsForEra(form, newEra);
                document.querySelectorAll('.date-input').forEach(inp => {
                    const v = inp.value;
                    if (v && v.length === 10) {
                        const fromEra = (newEra === window.Common.ERA_BE) ? window.Common.ERA_CE : window.Common.ERA_BE;
                        const converted = window.Common.convertDateString(v, fromEra, newEra);
                        if (converted) inp.value = converted;
                    }
                });
            };
            eraSelect.addEventListener('change', onEraChange);
            window.Common.updateDateLabelsForEra(form, getEra());
        }
    }

    function previewLetter() {
        const form = document.getElementById('freeFormLetterForm');
        const data = {};
        let isValid = true;
        let missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'วันที่ / Date' },
            { id: 'documentTitle', name: 'หัวข้อเอกสาร / Document Title' },
            { id: 'letterBody', name: 'เนื้อหาจดหมาย / Letter Body' },
            { id: 'doctorNameThai', name: 'ชื่อแพทย์ (ไทย) / Doctor Name (Thai)' },
            { id: 'medicalLicense', name: 'เลขที่ใบประกอบวิชาชีพ / Medical License No.' }
        ];

        requiredFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id);
            if (!element || !element.value?.trim()) {
                missingFieldsMessages.push(fieldInfo.name);
                if (element) element.style.borderColor = 'red';
                isValid = false;
            } else if (element) {
                element.style.borderColor = '';
                if (element.classList.contains('date-input') && element.value.length > 0) {
                    const era = window.Common.getEraFromForm('freeFormLetterForm');
                    const valid = !!window.Common.parseDate(element.value, era);
                    if (!valid) {
                        missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidField = Array.from(document.querySelectorAll('[style*="border-color: red"]'))[0];
            if (firstInvalidField) firstInvalidField.focus();
            return;
        }

        new FormData(form).forEach((value, key) => {
            if (typeof value === 'string') {
                data[key] = value.trim();
            } else {
                data[key] = value;
            }
        });

        // Normalize date to BE for display consistency if needed, or keep as is.
        // Usually we want to display what the user selected.
        // But if we want to support switching eras in print view, we might need to store the era.
        const era = window.Common.getEraFromForm('freeFormLetterForm');
        data._yearEra = era;

        // Ensure uppercase fields
        data.documentTitle = data.documentTitle.toUpperCase();
        data.doctorNameEnglish = (data.doctorNameEnglish || '').toUpperCase();

        localStorage.setItem('freeFormLetterDataForPrint', JSON.stringify(data));
        window.open('print-letter.html', '_blank');
    }
});
