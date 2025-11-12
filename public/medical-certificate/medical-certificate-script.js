document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize Form ---
    initializeDateInputs();
    initializeSalutationField();
    initializeNationalIdInput();
    loadDoctorInfo();
    setupOptionalSections(); // This function will be modified
    setupAdvisedRestCalculation();
    autoFocusPatientName();

    document.getElementById('previewButton').addEventListener('click', previewMedicalCertificate);
    document.getElementById('medicalCertificateForm').addEventListener('keydown', handleFormSubmitOnEnter);

    const doctorNameEnglishCertInput = document.getElementById('doctorNameEnglish');
    if (doctorNameEnglishCertInput) {
        doctorNameEnglishCertInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // --- Helper Functions ---
    function autoFocusPatientName() {
        const patientNameInput = document.getElementById('patientName');
        if (patientNameInput) patientNameInput.focus();
    }

    function initializeDateInputs() {
        const form = document.getElementById('medicalCertificateForm');
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
                calculateRestDays();
            };
            eraSelect.addEventListener('change', onEraChange);
            window.Common.updateDateLabelsForEra(form, getEra());
        }
    }

    function initializeSalutationField() {
        const salutationSelect = document.getElementById('patientSalutation');
        const otherSalutationInput = document.getElementById('otherPatientSalutation');
        if (salutationSelect && otherSalutationInput) {
            salutationSelect.addEventListener('change', function () {
                if (this.value === 'OTHER') {
                    otherSalutationInput.classList.remove('hidden-field');
                    otherSalutationInput.required = true;
                    otherSalutationInput.focus();
                } else {
                    otherSalutationInput.classList.add('hidden-field');
                    otherSalutationInput.required = false;
                    otherSalutationInput.value = '';
                    otherSalutationInput.style.borderColor = '';
                }
            });
        }
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

    function initializeNationalIdInput() {
        const nationalIdInput = document.getElementById('nationalIdNumber');
        if (nationalIdInput) {
            nationalIdInput.addEventListener('input', autoFormatNationalId);
        }
    }


    function setupOptionalSections() {
        const sections = [
            { checkboxId: 'includeConsultationDiagnosis', detailsId: 'consultationDiagnosisDetails', dateToDefault: 'consultationDate' },
            { checkboxId: 'includeAdvisedRest', detailsId: 'advisedRestDetails', dateToDefault: 'restStartDate' },
            { checkboxId: 'includeSyphilisTreatment', detailsId: 'syphilisTreatmentDetails', dateToDefault: 'syphilisTreatmentDate' },
            { checkboxId: 'includeTBTreatment', detailsId: 'tbTreatmentDetails', dateToDefault: 'tbTreatmentCompletionDate' },
            { checkboxId: 'includeDoctorComment', detailsId: 'doctorCommentDetails' } // No date for this one
        ];

        sections.forEach(section => {
            const checkbox = document.getElementById(section.checkboxId);
            const detailsDiv = document.getElementById(section.detailsId);
            if (checkbox && detailsDiv) {
                const toggleDetails = () => {
                    const isChecked = checkbox.checked;
                    detailsDiv.style.display = isChecked ? 'block' : 'none';
                    detailsDiv.querySelectorAll('input, select, textarea').forEach(el => {
                        el.disabled = !isChecked;
                        if (!isChecked) {
                            if (el.type !== 'checkbox' && el.type !== 'radio') el.value = '';
                            el.style.borderColor = '';
                            if (el.id === 'restDurationDays') el.value = '';
                        }
                    });

                    // Default the specific date field if the section is checked and the date field is empty
                    if (isChecked && section.dateToDefault) {
                        const dateField = document.getElementById(section.dateToDefault);
                        if (dateField && dateField.value === '') {
                            const era = window.Common.getEraFromForm('medicalCertificateForm');
                            dateField.value = window.Common.formatDate(new Date(), era);
                            // Trigger blur to format/validate
                            dateField.dispatchEvent(new Event('blur'));
                        }
                    }

                    if (isChecked && section.checkboxId === 'includeAdvisedRest') {
                        calculateRestDays();
                    }
                };
                checkbox.addEventListener('change', toggleDetails);
                toggleDetails();
            }
        });
    }

    function calculateRestDays() {
        const startDateInput = document.getElementById('restStartDate');
        const endDateInput = document.getElementById('restEndDate');
        const durationInput = document.getElementById('restDurationDays');
        const parentCheckbox = document.getElementById('includeAdvisedRest');

        if (!parentCheckbox || !parentCheckbox.checked) {
            durationInput.value = '';
            if (startDateInput) startDateInput.style.borderColor = '';
            if (endDateInput) endDateInput.style.borderColor = '';
            return;
        }

        // If restEndDate is empty and restStartDate is being set, optionally default restEndDate
        if (startDateInput.value && !endDateInput.value && document.activeElement === startDateInput) {
            // endDateInput.value = startDateInput.value; // Or JSDateToBE(new Date(BEToJSDate(startDateInput.value)));
            // Or leave it blank for user to fill
        }


        const eraNow = window.Common.getEraFromForm('medicalCertificateForm');
        const startDate = window.Common.parseDate(startDateInput.value, eraNow);
        const endDate = window.Common.parseDate(endDateInput.value, eraNow);

        let validStart = true;
        let validEnd = true;

        if (startDateInput.value && !startDate) {
            startDateInput.style.borderColor = 'red';
            validStart = false;
        } else if (startDateInput.value) {
            startDateInput.style.borderColor = '';
        }

        if (endDateInput.value && !endDate) {
            endDateInput.style.borderColor = 'red';
            validEnd = false;
        } else if (endDateInput.value) {
            endDateInput.style.borderColor = '';
        }

        if (startDate && endDate && validStart && validEnd) {
            if (endDate < startDate) {
                endDateInput.style.borderColor = 'red';
                durationInput.value = 'N/A';
            } else {
                endDateInput.style.borderColor = '';
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                durationInput.value = diffDays;
            }
        } else {
            durationInput.value = '';
        }
    }


    function setupAdvisedRestCalculation() {
        const startDateInput = document.getElementById('restStartDate');
        const endDateInput = document.getElementById('restEndDate');
        if (startDateInput) {
            startDateInput.addEventListener('change', calculateRestDays);
            startDateInput.addEventListener('blur', calculateRestDays);
        }
        if (endDateInput) {
            endDateInput.addEventListener('change', calculateRestDays);
            endDateInput.addEventListener('blur', calculateRestDays);
        }
    }


    function saveDoctorInfo() {
        let sharedInfo = {};
        try {
            const existingInfo = localStorage.getItem('sharedDoctorInfo');
            if (existingInfo) sharedInfo = JSON.parse(existingInfo);
        } catch (e) { console.error("Error reading sharedDoctorInfo for update:", e); sharedInfo = {}; }

        sharedInfo.sharedDoctorNameThai = document.getElementById('doctorNameThai').value;
        sharedInfo.sharedDoctorNameEnglish = document.getElementById('doctorNameEnglish').value.toUpperCase();
        sharedInfo.sharedMedicalLicense = document.getElementById('medicalLicense').value;
        localStorage.setItem('sharedDoctorInfo', JSON.stringify(sharedInfo));
    }

    function loadDoctorInfo() {
        const savedInfo = localStorage.getItem('sharedDoctorInfo');
        if (savedInfo) {
            try {
                const doctorInfo = JSON.parse(savedInfo);
                document.getElementById('doctorNameThai').value = doctorInfo.sharedDoctorNameThai || '';
                document.getElementById('doctorNameEnglish').value = doctorInfo.sharedDoctorNameEnglish || '';
                document.getElementById('medicalLicense').value = doctorInfo.sharedMedicalLicense || '';
            } catch (e) {
                console.error("Error parsing sharedDoctorInfo:", e);
                document.getElementById('doctorNameThai').value = '';
                document.getElementById('doctorNameEnglish').value = '';
                document.getElementById('medicalLicense').value = '';
            }
        }
        ['doctorNameThai', 'doctorNameEnglish', 'medicalLicense'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', saveDoctorInfo);
        });
    }

    function handleFormSubmitOnEnter(event) {
        if (event.key === 'Enter') {
            const activeElement = document.activeElement;
            // Allow Enter and Shift+Enter (or any combo) inside textareas to insert newlines normally
            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                return; // do not intercept
            }
            // For other inputs (not buttons), treat Enter as preview
            if (activeElement && activeElement.type !== 'button' && activeElement.type !== 'submit') {
                event.preventDefault();
                previewMedicalCertificate();
            }
            // Buttons keep default behavior
        }
    }

    function previewMedicalCertificate() {
        const form = document.getElementById('medicalCertificateForm');
        const data = {};
        let isValid = true;
        let missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'วันที่ออกเอกสาร / Certificate Date' },
            { id: 'patientName', name: 'ชื่อ-นามสกุลผู้ป่วย / Patient Full Name' },
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
                    const era = window.Common.getEraFromForm('medicalCertificateForm');
                    const valid = !!window.Common.parseDate(element.value, era);
                    if (!valid) {
                        missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        const salutationSelect = document.getElementById('patientSalutation');
        if (salutationSelect && salutationSelect.value === 'OTHER') {
            const otherSalutationInput = document.getElementById('otherPatientSalutation');
            if (!otherSalutationInput || !otherSalutationInput.value.trim()) {
                missingFieldsMessages.push('คำนำหน้าชื่อ (อื่นๆ) / Salutation (Other)');
                if (otherSalutationInput) otherSalutationInput.style.borderColor = 'red';
                isValid = false;
            } else if (otherSalutationInput) {
                otherSalutationInput.style.borderColor = '';
            }
        }


        const optionalDateSections = [
            { checkboxId: 'includeConsultationDiagnosis', dateFieldId: 'consultationDate', name: 'วันที่ปรึกษา / Consultation Date' },
            { checkboxId: 'includeAdvisedRest', dateFieldId: 'restStartDate', name: 'วันที่เริ่มพัก / Rest Start Date' },
            { checkboxId: 'includeAdvisedRest', dateFieldId: 'restEndDate', name: 'วันที่สิ้นสุดการพัก / Rest End Date' },
            { checkboxId: 'includeSyphilisTreatment', dateFieldId: 'syphilisTreatmentDate', name: 'วันที่รักษาซิฟิลิส / Syphilis Treatment Date' },
            { checkboxId: 'includeTBTreatment', dateFieldId: 'tbTreatmentCompletionDate', name: 'วันที่รักษาวัณโรคครบ / TB Treatment Completion Date' }
        ];

        optionalDateSections.forEach(sec => {
            const checkbox = document.getElementById(sec.checkboxId);
            const dateField = document.getElementById(sec.dateFieldId);
            if (checkbox && checkbox.checked && dateField && dateField.value.trim()) {
                const era = window.Common.getEraFromForm('medicalCertificateForm');
                const valid = !!window.Common.parseDate(dateField.value, era);
                if (!valid) {
                    missingFieldsMessages.push(`${sec.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${dateField.value})`);
                    dateField.style.borderColor = 'red';
                    isValid = false;
                } else {
                    dateField.style.borderColor = '';
                }
            } else if (dateField && (!checkbox || !checkbox.checked)) {
                dateField.style.borderColor = '';
            }
        });

        const includeRestCheckbox = document.getElementById('includeAdvisedRest');
        if (includeRestCheckbox && includeRestCheckbox.checked) {
            const restStartDateInput = document.getElementById('restStartDate');
            const restEndDateInput = document.getElementById('restEndDate');
            const era = window.Common.getEraFromForm('medicalCertificateForm');
            const restStartDate = window.Common.parseDate(restStartDateInput.value, era);
            const restEndDate = window.Common.parseDate(restEndDateInput.value, era);

            if (restStartDate && restEndDate && restEndDate < restStartDate) {
                missingFieldsMessages.push('วันที่สิ้นสุดการพักต้องไม่มาก่อนวันที่เริ่มพัก / Rest end date cannot be before rest start date');
                restEndDateInput.style.borderColor = 'red';
                isValid = false;
            }
            if ((restStartDateInput.value && !restEndDateInput.value) || (!restStartDateInput.value && restEndDateInput.value)) {
                missingFieldsMessages.push('กรุณาระบุทั้งวันที่เริ่มและสิ้นสุดการพัก / Please provide both start and end dates for rest period');
                if (!restStartDateInput.value) restStartDateInput.style.borderColor = 'red';
                if (!restEndDateInput.value) restEndDateInput.style.borderColor = 'red';
                isValid = false;
            }
        }


        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidField = Array.from(document.querySelectorAll('[style*="border-color: red"]'))[0];
            if (firstInvalidField) firstInvalidField.focus();
            return;
        }

        new FormData(form).forEach((value, key) => {
            const element = form.elements[key];
            if (element && element.type === 'checkbox') {
                data[key] = element.checked;
            } else if (element && key !== 'passportIdNumber') {
                if (typeof value === 'string') {
                    data[key] = value.trim();
                } else {
                    data[key] = value;
                }
            }
        });

        data.passportNumber = document.getElementById('passportNumber').value.trim();
        data.nationalIdNumber = document.getElementById('nationalIdNumber').value.trim();

        const salutationElement = form.elements['patientSalutation'];
        const selectedSalutationOption = salutationElement.options[salutationElement.selectedIndex];

        if (data.patientSalutation === 'OTHER') {
            data.patientSalutation = data.otherPatientSalutation;
            data.patientSalutationEnglish = data.otherPatientSalutation;
        } else if (data.patientSalutation === 'NONE') {
            data.patientSalutation = '';
            data.patientSalutationEnglish = '';
        } else {
            data.patientSalutation = salutationElement.value;
            data.patientSalutationEnglish = selectedSalutationOption.dataset.english || '';
        }

        const genderElement = form.elements['patientGender'];
        const selectedGenderOption = genderElement.options[genderElement.selectedIndex];
        if (data.patientGender === 'NONE') {
            data.patientGender = '';
            data.patientGenderEnglish = '';
        } else {
            data.patientGender = genderElement.value;
            data.patientGenderEnglish = selectedGenderOption.dataset.english || '';
        }

        // Collect notes for disease sections if present
        data.syphilisNotes = document.getElementById('syphilisNotes')?.value || '';
        data.tbNotes = document.getElementById('tbNotes')?.value || '';

        data.doctorNameEnglish = data.doctorNameEnglish.toUpperCase();

        // Normalize dates to CE for certificates; keep track of selected era
        const era = window.Common.getEraFromForm('medicalCertificateForm');
        const toCE = (v) => v ? window.Common.convertDateString(v, era, window.Common.ERA_CE) : '';
        data.letterDate = toCE(data.letterDate);
        if (data.includeConsultationDiagnosis) data.consultationDate = toCE(data.consultationDate);
        if (data.includeAdvisedRest) {
            data.restStartDate = toCE(data.restStartDate);
            data.restEndDate = toCE(data.restEndDate);
        }
        if (data.includeSyphilisTreatment) data.syphilisTreatmentDate = toCE(data.syphilisTreatmentDate);
        if (data.includeTBTreatment) data.tbTreatmentCompletionDate = toCE(data.tbTreatmentCompletionDate);
        data._yearEra = era;

        localStorage.setItem('medicalCertificateDataForPrint', JSON.stringify(data));
        window.open('print-medical-certificate.html', '_blank');
    }
});
