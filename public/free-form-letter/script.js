document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize Form ---
    initializeDateInputs();
    window.Common.loadDoctorInfo('doctorNameThai', 'doctorNameEnglish', 'medicalLicense');

    document.getElementById('printButton').addEventListener('click', printLetter);
    document.getElementById('saveButton').addEventListener('click', saveLetter);
    window.Common.handleFormSubmitOnEnter('freeFormLetterForm', saveLetter);
    window.Common.renderDocTabs('freeform');
    window.Common.setupLanguageToggle('freeFormLetterForm');
    window.Common.setupClearFormButtons('freeFormLetterForm');
    window.Common.setupPdfPreview({
        formId: 'freeFormLetterForm',
        collectData: collectLetterData,
        buildPayload: data => ({
            type: 'Free-Form-Letter',
            patientName: data.addressee || data.documentTitle || 'Patient',
            language: data.language,
            content: window.PdfTemplates.buildFreeForm(data)
        })
    });

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
        document.querySelectorAll('.date-input').forEach(input => {
            window.Common.attachSmartDate(input);
        });

        const letterDateInput = document.getElementById('letterDate');
        window.Common.setTodayIfEmpty(letterDateInput, window.Common.ERA_CE);
    }

    function collectLetterData() {
        const form = document.getElementById('freeFormLetterForm');
        const data = {};
        let isValid = true;
        const missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'วันที่ / Date' },
            { id: 'documentTitle', name: 'หัวเอกสาร / Document heading' },
            { id: 'letterBody', name: 'เนื้อหาหนังสือ / Letter body' }
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
                    const valid = !!window.Common.parseDateAuto(element.value);
                    if (!valid) {
                        missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        if (isValid) {
            new FormData(form).forEach((value, key) => {
                if (typeof value === 'string') {
                    data[key] = value.trim();
                } else {
                    data[key] = value;
                }
            });

            data.documentTitle = (data.documentTitle || '').toUpperCase();
            data.doctorNameEnglish = (data.doctorNameEnglish || '').toUpperCase();
        }

        return { data, isValid, missingFieldsMessages };
    }

    function letterPayload() {
        const { data, isValid, missingFieldsMessages } = collectLetterData();
        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidField = Array.from(document.querySelectorAll('[style*="border-color: red"]'))[0];
            if (firstInvalidField) firstInvalidField.focus();
            return null;
        }
        return {
            type: 'Free-Form-Letter',
            patientName: data.addressee || data.documentTitle || 'Patient',
            language: data.language,
            content: window.PdfTemplates.buildFreeForm(data)
        };
    }

    async function saveLetter() {
        const payload = letterPayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.save(payload);
        } catch (error) {
            console.error('Error generating free form letter PDF:', error);
            alert('Unable to generate PDF. Please check the console for details.');
        }
    }

    async function printLetter() {
        const payload = letterPayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.print(payload);
        } catch (error) {
            console.error('Error printing free form letter PDF:', error);
            alert('Unable to print PDF. Please check the console for details.');
        }
    }

});
