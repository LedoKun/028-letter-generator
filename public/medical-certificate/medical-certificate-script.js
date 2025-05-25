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

    function BEToJSDate(beDateString) {
        if (!beDateString || !beDateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return null;
        const parts = beDateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const beYear = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(beYear) || month < 0 || month > 11 || day < 1 || day > 31) return null;
        const ceYear = beYear - 543;
        if (ceYear < 1900 || ceYear > new Date().getFullYear() + 100) return null;
        const date = new Date(ceYear, month, day);
        if (date.getFullYear() !== ceYear || date.getMonth() !== month || date.getDate() !== day) {
            return null;
        }
        return date;
    }

    function JSDateToBE(jsDate) {
        if (!jsDate || !(jsDate instanceof Date) || isNaN(jsDate)) return '';
        const day = String(jsDate.getDate()).padStart(2, '0');
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const ceYear = jsDate.getFullYear();
        const beYear = ceYear + 543;
        return `${day}/${month}/${beYear}`;
    }

    function isValidBEDate(beDateString) {
        return BEToJSDate(beDateString) instanceof Date;
    }

    function autoFormatDate(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        if (event.inputType === 'deleteContentBackward' && (input.value.slice(-1) === '/')) {
            input.value = input.value.slice(0, -1);
            return;
        }
        if (value.length > 8) value = value.slice(0, 8);
        let formattedValue = '';
        if (value.length > 0) formattedValue += value.slice(0, 2);
        if (value.length >= 3) formattedValue += '/' + value.slice(2, 4);
        if (value.length >= 5) formattedValue += '/' + value.slice(4, 8);
        input.value = formattedValue;

        if (event.type === 'blur' || (event.type === 'input' && formattedValue.length === 10)) {
            if (input.value.length > 0 && (input.value.length < 10 || !isValidBEDate(input.value))) {
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        }
    }

    function initializeDateInputs() {
        document.querySelectorAll('.date-input').forEach(input => {
            input.addEventListener('input', autoFormatDate);
            input.addEventListener('blur', autoFormatDate);
            input.maxLength = 10;
            input.placeholder = "วว/ดด/ปปปป";
        });
        const letterDateInput = document.getElementById('letterDate');
        if (letterDateInput && !letterDateInput.value) {
            letterDateInput.value = JSDateToBE(new Date());
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
                            dateField.value = JSDateToBE(new Date());
                            // Trigger blur to format/validate if necessary, though autoFormatDate runs on input
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


        const startDate = BEToJSDate(startDateInput.value);
        const endDate = BEToJSDate(endDateInput.value);

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
            if (activeElement && activeElement.tagName !== 'TEXTAREA' && activeElement.type !== 'button' && activeElement.type !== 'submit') {
                event.preventDefault();
                previewMedicalCertificate();
            } else if (activeElement && activeElement.tagName === 'TEXTAREA' && !event.shiftKey) {
            } else if (activeElement && (activeElement.type === 'button' || activeElement.type === 'submit')) {
            } else {
                event.preventDefault();
                previewMedicalCertificate();
            }
        }
    }

    function previewMedicalCertificate() {
        const form = document.getElementById('medicalCertificateForm');
        const data = {};
        let isValid = true;
        let missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'วันที่ออกเอกสาร / Certificate Date' },
            { id: 'patientSalutation', name: 'คำนำหน้าชื่อ / Salutation' },
            { id: 'patientName', name: 'ชื่อ-นามสกุลผู้ป่วย / Patient Full Name' },
            { id: 'patientGender', name: 'เพศ / Gender' },
            { id: 'doctorNameThai', name: 'ชื่อแพทย์ (ไทย) / Doctor Name (Thai)' },
            { id: 'doctorNameEnglish', name: 'ชื่อแพทย์ (อังกฤษ) / Doctor Name (English)' },
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
                if (element.classList.contains('date-input') && element.value.length > 0 && (element.value.length < 10 || !isValidBEDate(element.value))) {
                    missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                    element.style.borderColor = 'red';
                    isValid = false;
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
                if (dateField.value.length < 10 || !isValidBEDate(dateField.value)) {
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
            const restStartDate = BEToJSDate(restStartDateInput.value);
            const restEndDate = BEToJSDate(restEndDateInput.value);

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

        data.doctorNameEnglish = data.doctorNameEnglish.toUpperCase();

        localStorage.setItem('medicalCertificateDataForPrint', JSON.stringify(data));
        window.open('print-medical-certificate.html', '_blank');
    }
});