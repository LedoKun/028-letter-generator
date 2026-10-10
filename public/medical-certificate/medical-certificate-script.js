document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize Form ---
    initializeDateInputs();
    initializeSalutationField();
    initializeNationalIdInput();
    window.Common.loadDoctorInfo('doctorNameThai', 'doctorNameEnglish', 'medicalLicense');
    setupOptionalSections();
    setupAdvisedRestCalculation();
    window.Common.autoFocusPatientName();

    document.getElementById('printButton').addEventListener('click', printMedicalCertificate);
    document.getElementById('saveButton').addEventListener('click', saveMedicalCertificate);
    window.Common.handleFormSubmitOnEnter('medicalCertificateForm', saveMedicalCertificate);
    window.Common.renderDocTabs('medical');
    window.Common.setupLanguageToggle('medicalCertificateForm');
    window.Common.syncPatientFields({
        patientName: 'patientName',
        age: 'patientAge',
        sex: 'patientGender',
        nationalId: 'nationalIdNumber',
        passportNumber: 'passportNumber'
    });
    window.Common.setupClearFormButtons('medicalCertificateForm');
    window.Common.setupPdfPreview({
        formId: 'medicalCertificateForm',
        collectData: collectMedicalCertificateData,
        buildPayload: data => ({
            type: 'Medical-Certificate',
            patientName: data.patientName,
            language: data.language,
            content: window.PdfTemplates.buildMedicalCertificate(data)
        })
    });

    const doctorNameEnglishCertInput = document.getElementById('doctorNameEnglish');
    if (doctorNameEnglishCertInput) {
        doctorNameEnglishCertInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // --- Helper Functions ---


    function initializeDateInputs() {
        document.querySelectorAll('.date-input').forEach(input => {
            window.Common.attachSmartDate(input);
        });
        const letterDateInput = document.getElementById('letterDate');
        window.Common.setTodayIfEmpty(letterDateInput, window.Common.ERA_CE);
    }

    function initializeSalutationField() {
        const salutationSelect = document.getElementById('patientSalutation');
        const otherSalutationInput = document.getElementById('otherPatientSalutation');
        const otherSalutationLabel = document.querySelector('label[for="otherPatientSalutation"]');
        if (salutationSelect && otherSalutationInput) {
            salutationSelect.addEventListener('change', function () {
                if (this.value === 'OTHER') {
                    if (otherSalutationLabel) otherSalutationLabel.classList.remove('hidden-field');
                    otherSalutationInput.classList.remove('hidden-field');
                    otherSalutationInput.required = true;
                    otherSalutationInput.focus();
                } else {
                    if (otherSalutationLabel) otherSalutationLabel.classList.add('hidden-field');
                    otherSalutationInput.classList.add('hidden-field');
                    otherSalutationInput.required = false;
                    otherSalutationInput.value = '';
                    otherSalutationInput.style.borderColor = '';
                }
            });
        }
    }



    function initializeNationalIdInput() {
        const nationalIdInput = document.getElementById('nationalIdNumber');
        if (nationalIdInput) {
            nationalIdInput.addEventListener('input', window.Common.autoFormatNationalId);
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
                            dateField.value = window.Common.formatDate(new Date(), window.Common.ERA_CE);
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


        const startDate = window.Common.parseDateAuto(startDateInput.value);
        const endDate = window.Common.parseDateAuto(endDateInput.value);

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
                durationInput.value = '';
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




    function collectMedicalCertificateData() {
        const form = document.getElementById('medicalCertificateForm');
        const data = {};
        let isValid = true;
        const missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'วันที่ออกเอกสาร / Certificate date' },
            { id: 'patientName', name: 'ชื่อ-นามสกุลผู้ป่วย / Patient full name' }
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
            { checkboxId: 'includeConsultationDiagnosis', dateFieldId: 'consultationDate', name: 'วันที่เข้ารับการตรวจรักษา / Examination date' },
            { checkboxId: 'includeAdvisedRest', dateFieldId: 'restStartDate', name: 'วันที่เริ่มพักรักษาตัว / Medical leave start date' },
            { checkboxId: 'includeAdvisedRest', dateFieldId: 'restEndDate', name: 'วันที่สิ้นสุดการพักรักษาตัว / Medical leave end date' },
            { checkboxId: 'includeSyphilisTreatment', dateFieldId: 'syphilisTreatmentDate', name: 'วันที่ได้รับการรักษาซิฟิลิส / Syphilis treatment date' },
            { checkboxId: 'includeTBTreatment', dateFieldId: 'tbTreatmentCompletionDate', name: 'วันที่รักษาวัณโรคครบถ้วน / TB treatment completion date' }
        ];

        optionalDateSections.forEach(sec => {
            const checkbox = document.getElementById(sec.checkboxId);
            const dateField = document.getElementById(sec.dateFieldId);
            if (checkbox && checkbox.checked && dateField && dateField.value.trim()) {
                const valid = !!window.Common.parseDateAuto(dateField.value);
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
            const restStartDate = window.Common.parseDateAuto(restStartDateInput.value);
            const restEndDate = window.Common.parseDateAuto(restEndDateInput.value);

            if (restStartDate && restEndDate && restEndDate < restStartDate) {
                missingFieldsMessages.push('วันที่สิ้นสุดการพักรักษาตัวต้องตรงกับหรืออยู่หลังวันที่เริ่มพักรักษาตัว / Medical leave end date must be on or after the start date');
                restEndDateInput.style.borderColor = 'red';
                isValid = false;
            }
            if ((restStartDateInput.value && !restEndDateInput.value) || (!restStartDateInput.value && restEndDateInput.value)) {
                missingFieldsMessages.push('ระบุทั้งวันที่เริ่มและวันที่สิ้นสุดการพักรักษาตัว / Enter both the start and end dates for medical leave');
                if (!restStartDateInput.value) restStartDateInput.style.borderColor = 'red';
                if (!restEndDateInput.value) restEndDateInput.style.borderColor = 'red';
                isValid = false;
            }
        }

        if (isValid) {
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

            data.advisedRestNotes = document.getElementById('advisedRestNotes')?.value || '';
            data.syphilisNotes = document.getElementById('syphilisNotes')?.value || '';
            data.tbNotes = document.getElementById('tbNotes')?.value || '';

            data.doctorNameEnglish = (data.doctorNameEnglish || '').toUpperCase();

            const toCE = (v) => v ? window.Common.convertDateToEra(v, window.Common.ERA_CE) : '';
            data.letterDate = toCE(data.letterDate);
            if (data.includeConsultationDiagnosis) data.consultationDate = toCE(data.consultationDate);
            if (data.includeAdvisedRest) {
                data.restStartDate = toCE(data.restStartDate);
                data.restEndDate = toCE(data.restEndDate);
            }
            if (data.includeSyphilisTreatment) data.syphilisTreatmentDate = toCE(data.syphilisTreatmentDate);
            if (data.includeTBTreatment) data.tbTreatmentCompletionDate = toCE(data.tbTreatmentCompletionDate);
        }

        return { data, isValid, missingFieldsMessages };
    }

    function medicalCertificatePayload() {
        const { data, isValid, missingFieldsMessages } = collectMedicalCertificateData();
        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidField = Array.from(document.querySelectorAll('[style*="border-color: red"]'))[0];
            if (firstInvalidField) firstInvalidField.focus();
            return null;
        }
        return {
            type: 'Medical-Certificate',
            patientName: data.patientName,
            language: data.language,
            content: window.PdfTemplates.buildMedicalCertificate(data)
        };
    }

    async function saveMedicalCertificate() {
        const payload = medicalCertificatePayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.save(payload);
        } catch (error) {
            console.error('Error generating medical certificate PDF:', error);
            alert('Unable to generate PDF. Please check the console for details.');
        }
    }

    async function printMedicalCertificate() {
        const payload = medicalCertificatePayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.print(payload);
        } catch (error) {
            console.error('Error printing medical certificate PDF:', error);
            alert('Unable to print PDF. Please check the console for details.');
        }
    }

});
