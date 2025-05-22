document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Constants ---
    const ART_MEDICATION_OPTIONS = [
        { value: "TDF/3TC/DTG", text: "TDF/3TC/DTG" },
        { value: "TAF/3TC/DTG", text: "TAF/3TC/DTG" },
        { value: "TDF/3TC/EFV600", text: "TDF/3TC/EFV600" },
        { value: "TDF/FTC", text: "TDF/FTC" },
        { value: "EFV200", text: "EFV200" },
        { value: "RPV", text: "RPV" },
        { value: "LPVr", text: "LPV/r (200mg/50mg)" },
        { value: "DTG50", text: "DTG (50mg)" }
    ];
    let artMedicationCounter = 0;

    // --- Initialize Form ---
    initializeDateInputs();
    initializeNationalIdInput();
    initializeNapIdInput();
    setupConditionalSections();
    setupTreatedTBSitesLogic();
    setupTPTMedicationLogic();
    setupLastMedicinePickupToggle(); // MODIFIED: New function
    // setDefaultLastPickupDate(); // REMOVED: Now handled by setupLastMedicinePickupToggle
    loadDoctorInfo();
    initializeArtMedications();
    initializeTmxSmpCheckbox();
    handleFormSubmitOnEnter();
    document.getElementById('previewButton').addEventListener('click', previewLetter);

    autoFocusPatientName();

    // --- Helper Functions ---
    function autoFocusPatientName() {
        const patientNameInput = document.getElementById('patientName');
        if (patientNameInput) {
            patientNameInput.focus();
            console.log("Auto-focused on Patient Name input.");
        } else {
            console.warn("Patient Name input field (id='patientName') not found for auto-focus.");
        }
    }

    function BEToJSDate(beDateString) {
        if (!beDateString || !beDateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return null;
        const parts = beDateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const beYear = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(beYear) || month < 0 || month > 11 || day < 1 || day > 31) return null;
        const ceYear = beYear - 543;
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
        const originalLength = value.length;

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

        if (event.type === 'blur') {
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
        });
        const letterDateInput = document.getElementById('letterDate');
        if (!letterDateInput.value) letterDateInput.value = JSDateToBE(new Date());
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
        const nationalIdInput = document.getElementById('nationalId');
        if (nationalIdInput) nationalIdInput.addEventListener('input', autoFormatNationalId);
    }

    function autoFormatNapId(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        let formattedValue = '';
        if (value.length > 0) formattedValue += value.slice(0, 4);
        if (value.length >= 5) formattedValue += '-' + value.slice(4, 10);
        input.value = formattedValue;
        input.maxLength = 11;
    }

    function initializeNapIdInput() {
        const napIdInput = document.getElementById('napId');
        if (napIdInput) napIdInput.addEventListener('input', autoFormatNapId);
    }

    function setupConditionalSections() {
        const toggles = [
            { checkboxId: 'includeRetroviral', detailsId: 'retroviralDetails' },
            { checkboxId: 'includeSyphilisActive', detailsId: 'syphilisActiveDetails', callback: calculateSyphilisSchedule },
            { checkboxId: 'includeTreatedHCV', detailsId: 'treatedHCVDetails' },
            { checkboxId: 'includeTreatedTB', detailsId: 'treatedTBDetails' },
            { checkboxId: 'includeCompletedTPT', detailsId: 'completedTPTDetails' },
            { checkboxId: 'includeOtherHistory', detailsId: 'otherHistoryDetails' }
        ];
        toggles.forEach(toggle => {
            const checkbox = document.getElementById(toggle.checkboxId);
            const detailsDiv = document.getElementById(toggle.detailsId);
            if (checkbox && detailsDiv) {
                const updateVisibility = () => {
                    detailsDiv.style.display = checkbox.checked ? 'block' : 'none';
                    if (checkbox.checked && toggle.callback) toggle.callback();
                };
                checkbox.addEventListener('change', updateVisibility);
                updateVisibility(); // Initial state
            }
        });
        const syphilisStartDateInput = document.getElementById('syphilisStartDate');
        if (syphilisStartDateInput) {
            syphilisStartDateInput.addEventListener('change', calculateSyphilisSchedule);
            syphilisStartDateInput.addEventListener('blur', calculateSyphilisSchedule);
        }
        if (document.getElementById('includeSyphilisActive')?.checked) calculateSyphilisSchedule();
    }

    function createArtMedicationInputs(idSuffix) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('medication-item', 'grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-2', 'items-end'); // 4 cols for remove btn
        itemDiv.id = `artMedItem-${idSuffix}`;

        const medDiv = document.createElement('div');
        const medLabel = document.createElement('label');
        medLabel.htmlFor = `artMedSelect-${idSuffix}`;
        medLabel.textContent = `ยา / Medication:`;
        medLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const medSelect = document.createElement('select');
        medSelect.id = `artMedSelect-${idSuffix}`;
        medSelect.name = `artMedSelect-${idSuffix}`;
        medSelect.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        ART_MEDICATION_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            medSelect.appendChild(option);
        });
        medDiv.appendChild(medLabel);
        medDiv.appendChild(medSelect);

        const tabletsDiv = document.createElement('div');
        const tabletsLabel = document.createElement('label');
        tabletsLabel.htmlFor = `artTablets-${idSuffix}`;
        tabletsLabel.textContent = `จำนวน / Tablets:`;
        tabletsLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const tabletsInput = document.createElement('input');
        tabletsInput.type = 'number';
        tabletsInput.id = `artTablets-${idSuffix}`;
        tabletsInput.name = `artTablets-${idSuffix}`;
        tabletsInput.value = '1';
        tabletsInput.min = '0';
        tabletsInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        tabletsDiv.appendChild(tabletsLabel);
        tabletsDiv.appendChild(tabletsInput);

        const timeDiv = document.createElement('div');
        const timeLabel = document.createElement('label');
        timeLabel.htmlFor = `artTime-${idSuffix}`;
        timeLabel.textContent = `เวลา / Time (HH:MM):`;
        timeLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const timeInput = document.createElement('input');
        timeInput.type = 'time'; // Value will be in 24-hour format e.g. "14:30"
        timeInput.id = `artTime-${idSuffix}`;
        timeInput.name = `artTime-${idSuffix}`;
        timeInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        timeDiv.appendChild(timeLabel);
        timeDiv.appendChild(timeInput);

        const removeBtnDiv = document.createElement('div'); // Container for button for alignment
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'ลบ';
        removeBtn.classList.add('text-red-400', 'hover:text-red-300', 'text-xs', 'thai-font', 'py-1', 'px-2', 'border', 'border-red-400', 'rounded');
        removeBtn.onclick = function () { itemDiv.remove(); };
        removeBtnDiv.appendChild(removeBtn);


        itemDiv.appendChild(medDiv);
        itemDiv.appendChild(tabletsDiv);
        itemDiv.appendChild(timeDiv);
        itemDiv.appendChild(removeBtnDiv);
        return itemDiv;
    }

    function addArtMedicationToList() {
        artMedicationCounter++;
        const artContainer = document.getElementById('artMedicationsContainer');
        artContainer.appendChild(createArtMedicationInputs(artMedicationCounter));
    }

    function initializeArtMedications() {
        document.getElementById('addArtMedication').addEventListener('click', addArtMedicationToList);
        const artContainer = document.getElementById('artMedicationsContainer');
        if (artContainer.children.length <= 1) { // Only the <p> tag initially
            addArtMedicationToList(); // Add one by default
        }
    }

    function initializeTmxSmpCheckbox() {
        const checkbox = document.getElementById('includeTmxSmp');
        const tabletsDiv = document.getElementById('tmxSmpTabletsDiv');
        if (checkbox && tabletsDiv) {
            const updateVisibility = () => {
                tabletsDiv.style.display = checkbox.checked ? 'flex' : 'none';
                if (!checkbox.checked) {
                    document.getElementById('tmxSmpTablets').value = ''; // Clear value if unchecked
                }
            };
            checkbox.addEventListener('change', updateVisibility);
            updateVisibility(); // Initial state
        }
    }

    function calculateSyphilisSchedule() {
        const startDateInput = document.getElementById('syphilisStartDate');
        const dose1DateEl = document.getElementById('syphilisDose1Date');
        const dose2DateEl = document.getElementById('syphilisDose2Date');
        const dose3DateEl = document.getElementById('syphilisDose3Date');

        if (!startDateInput || !dose1DateEl || !dose2DateEl || !dose3DateEl) return;
        const startDate = BEToJSDate(startDateInput.value);

        if (!startDate) {
            dose1DateEl.textContent = 'N/A';
            dose2DateEl.textContent = 'N/A';
            dose3DateEl.textContent = 'N/A';
            if (startDateInput.value.length > 0 && startDateInput.value.length < 10) startDateInput.style.borderColor = 'red';
            else if (startDateInput.value.length === 10 && !isValidBEDate(startDateInput.value)) startDateInput.style.borderColor = 'red';
            else startDateInput.style.borderColor = '';
            return;
        }
        startDateInput.style.borderColor = '';

        dose1DateEl.textContent = JSDateToBE(new Date(startDate));
        const dose2Date = new Date(startDate);
        dose2Date.setDate(startDate.getDate() + 7);
        dose2DateEl.textContent = JSDateToBE(dose2Date);
        const dose3Date = new Date(startDate);
        dose3Date.setDate(startDate.getDate() + 14);
        dose3DateEl.textContent = JSDateToBE(dose3Date);
    }

    function setupTreatedTBSitesLogic() {
        const sitesSelect = document.getElementById('treatedTBSitesSelect');
        const sitesOtherInput = document.getElementById('treatedTBSitesOther');
        if (sitesSelect && sitesOtherInput) {
            const updateOtherVisibility = () => {
                const selectedOptions = Array.from(sitesSelect.selectedOptions).map(opt => opt.value);
                sitesOtherInput.style.display = selectedOptions.includes('Other') ? 'block' : 'none';
                if (!selectedOptions.includes('Other')) sitesOtherInput.value = '';
            };
            sitesSelect.addEventListener('change', updateOtherVisibility);
            updateOtherVisibility(); // Initial state
        }
    }

    function setupTPTMedicationLogic() {
        const tptMedicationSelect = document.getElementById('completedTPTMedication');
        const tptMedicationOtherInput = document.getElementById('completedTPTMedicationOther');
        if (tptMedicationSelect && tptMedicationOtherInput) {
            const updateOtherVisibility = () => {
                tptMedicationOtherInput.style.display = tptMedicationSelect.value === 'Other' ? 'block' : 'none';
                if (tptMedicationSelect.value !== 'Other') tptMedicationOtherInput.value = '';
            };
            tptMedicationSelect.addEventListener('change', updateOtherVisibility);
            updateOtherVisibility();
        }
    }

    // NEW function to manage the "Last Medicine Pickup" checkbox and related fields
    function setupLastMedicinePickupToggle() {
        const checkbox = document.getElementById('includeLastMedicinePickup');
        const detailsDiv = document.getElementById('lastMedicinePickupDetails');
        const dateInput = document.getElementById('lastMedicinePickupDate');
        const durationInput = document.getElementById('medicineDuration');

        if (checkbox && detailsDiv && dateInput && durationInput) {
            const toggleFields = (isChecked) => {
                detailsDiv.style.opacity = isChecked ? '1' : '0.5';
                dateInput.disabled = !isChecked;
                durationInput.disabled = !isChecked;
                if (isChecked) {
                    if (!dateInput.value) { // Set default date only if checked and empty
                        dateInput.value = JSDateToBE(new Date());
                    }
                } else {
                    // Optionally clear values when unchecked
                    // dateInput.value = '';
                    // durationInput.value = '';
                }
            };
            checkbox.addEventListener('change', function () {
                toggleFields(this.checked);
            });
            toggleFields(checkbox.checked); // Initialize based on current state
        }
    }

    function saveDoctorInfo() {
        localStorage.setItem('referralDoctorInfo', JSON.stringify({
            thaiName: document.getElementById('doctorNameThai').value,
            englishName: document.getElementById('doctorNameEnglish').value,
            licenseNo: document.getElementById('medicalLicense').value
        }));
    }

    function loadDoctorInfo() {
        const savedInfo = localStorage.getItem('referralDoctorInfo');
        if (savedInfo) {
            const doctorInfo = JSON.parse(savedInfo);
            document.getElementById('doctorNameThai').value = doctorInfo.thaiName || '';
            document.getElementById('doctorNameEnglish').value = doctorInfo.englishName || '';
            document.getElementById('medicalLicense').value = doctorInfo.licenseNo || '';
        }
        ['doctorNameThai', 'doctorNameEnglish', 'medicalLicense'].forEach(id => {
            document.getElementById(id).addEventListener('change', saveDoctorInfo);
        });
    }

    function handleFormSubmitOnEnter() {
        document.getElementById('referralForm').addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName !== 'TEXTAREA' && activeElement.type !== 'button' && activeElement.type !== 'submit') {
                    event.preventDefault();
                    previewLetter();
                } else if (activeElement && activeElement.tagName === 'TEXTAREA' && !event.shiftKey) {
                    // Allow newline
                } else if (activeElement && (activeElement.type === 'button' || activeElement.type === 'submit')) {
                    // Allow buttons
                } else {
                    event.preventDefault();
                    previewLetter();
                }
            }
        });
    }

    function previewLetter() {
        const form = document.getElementById('referralForm');
        const data = {};
        let isValid = true;

        const requiredStaticFields = [
            { id: 'letterDate', name: 'วันที่ / Date' },
            { id: 'patientName', name: 'ชื่อผู้ป่วย / Patient Name' },
            { id: 'doctorNameThai', name: 'ชื่อแพทย์ (ภาษาไทย)' },
            { id: 'doctorNameEnglish', name: 'Doctor\'s Name (English)' },
            { id: 'medicalLicense', name: 'เลขที่ใบประกอบวิชาชีพ' }
        ];
        let missingFieldsMessages = [];

        requiredStaticFields.forEach(fieldInfo => {
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

        const includeSyphilisActiveCheckbox = document.getElementById('includeSyphilisActive');
        if (includeSyphilisActiveCheckbox && includeSyphilisActiveCheckbox.checked) {
            const syphilisStartDateInput = document.getElementById('syphilisStartDate');
            if (!syphilisStartDateInput.value.trim()) {
                missingFieldsMessages.push("วันที่เริ่มการรักษาโรคซิฟิลิส / Syphilis Treatment Start Date");
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (syphilisStartDateInput.value.length < 10 || !isValidBEDate(syphilisStartDateInput.value)) {
                missingFieldsMessages.push(`วันที่เริ่มการรักษาโรคซิฟิลิส (รูปแบบไม่ถูกต้อง / Invalid format: ${syphilisStartDateInput.value})`);
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else {
                syphilisStartDateInput.style.borderColor = '';
            }
        }

        // Validation for Last Medicine Pickup Date if checkbox is checked
        const includeLastMedicinePickupCheckbox = document.getElementById('includeLastMedicinePickup');
        const lastMedicinePickupDateInput = document.getElementById('lastMedicinePickupDate');
        if (includeLastMedicinePickupCheckbox && includeLastMedicinePickupCheckbox.checked) {
            if (!lastMedicinePickupDateInput.value.trim()) {
                missingFieldsMessages.push("ผู้ป่วยรับยาครั้งสุดท้ายเมื่อ / Last medicine pick up on");
                lastMedicinePickupDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (lastMedicinePickupDateInput.value.length < 10 || !isValidBEDate(lastMedicinePickupDateInput.value)) {
                missingFieldsMessages.push(`ผู้ป่วยรับยาครั้งสุดท้ายเมื่อ (รูปแบบไม่ถูกต้อง / Invalid format: ${lastMedicinePickupDateInput.value})`);
                lastMedicinePickupDateInput.style.borderColor = 'red';
                isValid = false;
            } else {
                lastMedicinePickupDateInput.style.borderColor = '';
            }
        }


        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidFieldId = requiredStaticFields.find(f => missingFieldsMessages.some(m => m.includes(f.name)))?.id;
            if (firstInvalidFieldId) document.getElementById(firstInvalidFieldId)?.focus();
            else if (missingFieldsMessages.some(m => m.includes("Syphilis"))) document.getElementById('syphilisStartDate')?.focus();
            else if (missingFieldsMessages.some(m => m.includes("Last medicine pick up on"))) document.getElementById('lastMedicinePickupDate')?.focus();
            return;
        }

        new FormData(form).forEach((value, key) => {
            const element = form.elements[key];
            if (element && element.type === 'checkbox') return;
            if (element && typeof value === 'string') data[key] = value.trim();
            else data[key] = value;
        });

        const checkboxIds = [
            'includeRetroviral', 'includeSyphilisActive', 'includeHBV',
            'includeHCVActive', 'includeTreatedSyphilis', 'includeTreatedHCV',
            'includeTreatedTB', 'includeCompletedTPT', 'includeOtherHistory',
            'includeLastMedicinePickup', // MODIFIED: Added new checkbox
            'attachmentLabResults', 'attachmentOther',
            'includeTmxSmp'
        ];
        checkboxIds.forEach(id => {
            const cb = document.getElementById(id);
            if (cb) data[id] = cb.checked;
        });

        data.artMedications = [];
        if (data.includeRetroviral) {
            document.querySelectorAll('#artMedicationsContainer .medication-item').forEach(item => {
                const selectEl = item.querySelector('select[id^="artMedSelect-"]');
                const tabletsEl = item.querySelector('input[id^="artTablets-"]');
                const timeEl = item.querySelector('input[id^="artTime-"]');
                if (selectEl && tabletsEl && timeEl && selectEl.value) {
                    data.artMedications.push({
                        medication: selectEl.options[selectEl.selectedIndex].text,
                        value: selectEl.value,
                        tablets: tabletsEl.value,
                        time: timeEl.value
                    });
                }
            });
        }
        if (data.includeTmxSmp) {
            data.tmxSmpTablets = document.getElementById('tmxSmpTablets').value;
        }

        if (data.includeSyphilisActive) {
            data.syphilisStartDate = document.getElementById('syphilisStartDate').value;
            data.syphilisDose1Date = document.getElementById('syphilisDose1Date').textContent;
            data.syphilisDose2Date = document.getElementById('syphilisDose2Date').textContent;
            data.syphilisDose3Date = document.getElementById('syphilisDose3Date').textContent;
        }

        if (data.includeTreatedTB) {
            const sitesSelect = document.getElementById('treatedTBSitesSelect');
            const selectedSites = Array.from(sitesSelect.selectedOptions).map(opt => opt.value);
            let tbSitesArray = [];
            if (selectedSites.includes('Other')) {
                const otherText = document.getElementById('treatedTBSitesOther').value.trim();
                tbSitesArray = selectedSites.filter(s => s !== 'Other');
                if (otherText) tbSitesArray.push(...otherText.split(',').map(s => s.trim()).filter(s => s));
            } else {
                tbSitesArray = selectedSites;
            }
            data.treatedTBSites = tbSitesArray.join(', ');
        }

        if (data.includeCompletedTPT) {
            const tptSelect = document.getElementById('completedTPTMedication');
            data.completedTPTMedicationText = tptSelect.value === 'Other' ?
                document.getElementById('completedTPTMedicationOther').value : tptSelect.value;
        }

        // MODIFIED: Handle lastMedicinePickupDate and medicineDuration based on the new checkbox
        if (!data.includeLastMedicinePickup || !document.getElementById('lastMedicinePickupDate').value) {
            delete data.lastMedicinePickupDate;
        } else {
            data.lastMedicinePickupDate = document.getElementById('lastMedicinePickupDate').value;
        }

        if (!data.includeLastMedicinePickup || !document.getElementById('medicineDuration').value) {
            delete data.medicineDuration;
        } else {
            data.medicineDuration = document.getElementById('medicineDuration').value;
        }


        localStorage.setItem('referralDataForPrint', JSON.stringify(data));
        window.open('print-letter.html', '_blank');
    }
});