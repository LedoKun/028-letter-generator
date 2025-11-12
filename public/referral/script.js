document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Constants ---
    const ART_MEDICATION_OPTIONS = [
        // Triple-Drug Regimens
        { value: "TDF/3TC/DTG", text: "TDF/3TC/DTG" },        // DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TAF/3TC/DTG", text: "TAF/3TC/DTG" },        // DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR ALAFENAMIDE
        { value: "TAF/FTC/DTG", text: "TAF/FTC/DTG" },        // DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR ALAFENAMIDE
        { value: "TDF/3TC/EFV", text: "TDF/3TC/EFV (600mg)" },// EFAVIRENZ/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE
    
        // Double-Drug NRTI Backbones
        { value: "TDF/FTC",     text: "TDF/FTC" },            // EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TDF/3TC",     text: "TDF/3TC" },            // LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TAF/FTC",     text: "TAF/FTC" },            // EMTRICITABINE/TENOFOVIR ALAFENAMIDE
        { value: "TAF/3TC",     text: "TAF/3TC" },            // LAMIVUDINE/TENOFOVIR ALAFENAMIDE
        { value: "AZT/3TC300/150",     text: "AZT/3TC (300mg/150mg)" },// ZIDOVUDINE/LAMIVUDINE
    
        // Individual Components
        { value: "EFV200",      text: "EFV (200mg)" },        // EFAVIRENZ
        { value: "RPV",         text: "RPV" },                // RILPIVIRINE
        { value: "LPV/r200/50", text: "LPV/r (200mg/50mg)" }, // LOPINAVIR/RITONAVIR (200mg/50mg)
        { value: "DTG50",       text: "DTG (50mg)" },         // DOLUTEGRAVIR
        { value: "3TC150",      text: "3TC (150mg)" },        // LAMIVUDINE (150 mg)
        { value: "ABC300",      text: "ABC (300mg)" },        // ABACAVIR
        { value: "DRV",         text: "DRV" },                // DARUNAVIR
        { value: "RTV50",       text: "RTV (50mg)" }          // RITONAVIR
    ];
    let artMedicationCounter = 0;

    // --- Initialize Form ---
    initializeDateInputs();
    initializeNationalIdInput();
    initializeNapIdInput();
    initializePassportInput();
    setupConditionalSections();
    setupTreatedTBSitesLogic();
    setupTPTMedicationLogic();
    setupLastMedicinePickupToggle();
    loadDoctorInfo();
    initializeArtMedications();
    initializeTmxSmpCheckbox();
    handleFormSubmitOnEnter();
    document.getElementById('previewButton').addEventListener('click', previewLetter);

    autoFocusPatientName();

    const doctorNameEnglishInputReferral = document.getElementById('doctorNameEnglish');
    if (doctorNameEnglishInputReferral) {
        doctorNameEnglishInputReferral.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    function autoFocusPatientName() {
        const patientNameInput = document.getElementById('patientName');
        if (patientNameInput) {
            patientNameInput.focus();
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
        const form = document.getElementById('referralForm');
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
                calculateSyphilisSchedule();
            };
            eraSelect.addEventListener('change', onEraChange);
            window.Common.updateDateLabelsForEra(form, getEra());
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
        input.maxLength = 17; // 1-2345-67890-12-3
    }

    function initializeNationalIdInput() {
        const nationalIdInput = document.getElementById('nationalId');
        if (nationalIdInput) nationalIdInput.addEventListener('input', autoFormatNationalId);
    }

    function autoFormatNapId(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        if (value.length > 20) value = value.slice(0, 20); // Max 20 digits for XXXX-XXXXXX
        let formattedValue = '';
        if (value.length > 0) formattedValue += value.slice(0, 4);
        if (value.length >= 5) formattedValue += '-' + value.slice(4, 20);
        input.value = formattedValue;
        input.maxLength = 20; // XXXX-XXXXXX
    }

    function initializeNapIdInput() {
        const napIdInput = document.getElementById('napId');
        if (napIdInput) napIdInput.addEventListener('input', autoFormatNapId);
    }

    // --- Function to initialize Passport Number input to uppercase ---
    function initializePassportInput() {
        const passportInput = document.getElementById('passportNumber');
        if (passportInput) {
            passportInput.addEventListener('input', function () {
                this.value = this.value.toUpperCase();
            });
        }
    }
    // --- End of Passport Number input function ---

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
                    const inputsToToggle = detailsDiv.querySelectorAll('input, select, textarea, button');
                    inputsToToggle.forEach(input => input.disabled = !checkbox.checked);

                    if (checkbox.checked) {
                        // Special handling for nested conditional elements if any
                        if (toggle.checkboxId === 'includeRetroviral') {
                            const tmxCheckbox = document.getElementById('includeTmxSmp');
                            if (tmxCheckbox) document.getElementById('tmxSmpTabletsDiv').style.display = tmxCheckbox.checked ? 'flex' : 'none';
                            document.getElementById('tmxSmpTablets').disabled = !tmxCheckbox.checked;
                        }
                        if (toggle.checkboxId === 'includeTreatedTB') {
                            const sitesSelect = document.getElementById('treatedTBSitesSelect');
                            const sitesOtherInput = document.getElementById('treatedTBSitesOther');
                            if (sitesSelect && sitesOtherInput) sitesOtherInput.style.display = Array.from(sitesSelect.selectedOptions).map(opt => opt.value).includes('Other') ? 'block' : 'none';
                        }
                        if (toggle.checkboxId === 'includeCompletedTPT') {
                            const tptMedSelect = document.getElementById('completedTPTMedication');
                            const tptMedOther = document.getElementById('completedTPTMedicationOther');
                            if (tptMedSelect && tptMedOther) tptMedOther.style.display = tptMedSelect.value === 'Other' ? 'block' : 'none';
                        }
                        if (toggle.callback) toggle.callback();
                    }
                };
                checkbox.addEventListener('change', updateVisibility);
                updateVisibility();
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
        itemDiv.classList.add('medication-item', 'grid', 'grid-cols-1', 'md:grid-cols-4', 'gap-2', 'items-end');
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
        timeLabel.textContent = `เวลา / Time (HH:MM, 24-hour):`;
        timeLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.step = '60'; // minutes precision, 24-hour display in most browsers
        timeInput.id = `artTime-${idSuffix}`;
        timeInput.name = `artTime-${idSuffix}`;
        timeInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        timeDiv.appendChild(timeLabel);
        timeDiv.appendChild(timeInput);

        const removeBtnDiv = document.createElement('div');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'ลบ';
        removeBtn.classList.add('text-red-400', 'hover:text-red-300', 'text-xs', 'thai-font', 'py-1', 'px-2', 'border', 'border-red-400', 'rounded', 'w-full', 'md:w-auto');
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
        const newItem = createArtMedicationInputs(artMedicationCounter);
        const retroviralCheckbox = document.getElementById('includeRetroviral');
        if (retroviralCheckbox && !retroviralCheckbox.checked) {
            newItem.querySelectorAll('select, input, button').forEach(el => el.disabled = true);
        }
        artContainer.appendChild(newItem);
    }

    function initializeArtMedications() {
        document.getElementById('addArtMedication').addEventListener('click', addArtMedicationToList);
        const artContainer = document.getElementById('artMedicationsContainer');
        if (artContainer.children.length <= 1) { // Ensure at least one item, assuming the container might have a placeholder <p>
            addArtMedicationToList();
        }
    }

    function initializeTmxSmpCheckbox() {
        const checkbox = document.getElementById('includeTmxSmp');
        const tabletsDiv = document.getElementById('tmxSmpTabletsDiv');
        const tabletsInput = document.getElementById('tmxSmpTablets');
        const retroviralCheckbox = document.getElementById('includeRetroviral');

        if (checkbox && tabletsDiv && tabletsInput && retroviralCheckbox) {
            const updateVisibility = () => {
                const isRetroviralChecked = retroviralCheckbox.checked;
                const isTmxSmpChecked = checkbox.checked;

                checkbox.disabled = !isRetroviralChecked;

                if (isRetroviralChecked && isTmxSmpChecked) {
                    tabletsDiv.style.display = 'flex';
                    tabletsInput.disabled = false;
                } else {
                    tabletsDiv.style.display = 'none';
                    tabletsInput.disabled = true;
                    if (!isTmxSmpChecked) tabletsInput.value = '';
                }
            };
            checkbox.addEventListener('change', updateVisibility);
            retroviralCheckbox.addEventListener('change', updateVisibility);
            updateVisibility();
        }
    }


    function calculateSyphilisSchedule() {
        const startDateInput = document.getElementById('syphilisStartDate');
        const dose1DateEl = document.getElementById('syphilisDose1Date');
        const dose2DateEl = document.getElementById('syphilisDose2Date');
        const dose3DateEl = document.getElementById('syphilisDose3Date');

        if (!startDateInput || !dose1DateEl || !dose2DateEl || !dose3DateEl) return;

        const syphilisActiveCheckbox = document.getElementById('includeSyphilisActive');
        if (!syphilisActiveCheckbox || !syphilisActiveCheckbox.checked) {
            dose1DateEl.textContent = 'N/A';
            dose2DateEl.textContent = 'N/A';
            dose3DateEl.textContent = 'N/A';
            startDateInput.style.borderColor = '';
            return;
        }

        const startDate = window.Common.parseDate(startDateInput.value, window.Common.getEraFromForm('referralForm'));

        if (!startDate) {
            dose1DateEl.textContent = 'N/A';
            dose2DateEl.textContent = 'N/A';
            dose3DateEl.textContent = 'N/A';
            if (startDateInput.value.length > 0 && startDateInput.value.length < 10) startDateInput.style.borderColor = 'red';
            else if (startDateInput.value.length === 10 && !window.Common.parseDate(startDateInput.value, window.Common.getEraFromForm('referralForm'))) startDateInput.style.borderColor = 'red';
            else startDateInput.style.borderColor = '';
            return;
        }
        startDateInput.style.borderColor = '';

        dose1DateEl.textContent = window.Common.formatDate(new Date(startDate), window.Common.getEraFromForm('referralForm'));
        const dose2Date = new Date(startDate);
        dose2Date.setDate(startDate.getDate() + 7);
        dose2DateEl.textContent = window.Common.formatDate(dose2Date, window.Common.getEraFromForm('referralForm'));
        const dose3Date = new Date(startDate);
        dose3Date.setDate(startDate.getDate() + 14);
        dose3DateEl.textContent = window.Common.formatDate(dose3Date, window.Common.getEraFromForm('referralForm'));
    }

    function setupTreatedTBSitesLogic() {
        const sitesSelect = document.getElementById('treatedTBSitesSelect');
        const sitesOtherInput = document.getElementById('treatedTBSitesOther');
        const parentCheckbox = document.getElementById('includeTreatedTB');
        if (sitesSelect && sitesOtherInput && parentCheckbox) {
            const updateOtherVisibility = () => {
                if (!parentCheckbox.checked) {
                    sitesOtherInput.style.display = 'none';
                    sitesOtherInput.value = '';
                    return;
                }
                const selectedOptions = Array.from(sitesSelect.selectedOptions).map(opt => opt.value);
                sitesOtherInput.style.display = selectedOptions.includes('Other') ? 'block' : 'none';
                sitesOtherInput.disabled = !selectedOptions.includes('Other');
                if (!selectedOptions.includes('Other')) sitesOtherInput.value = '';
            };
            sitesSelect.addEventListener('change', updateOtherVisibility);
            updateOtherVisibility();
        }
    }

    function setupTPTMedicationLogic() {
        const tptMedicationSelect = document.getElementById('completedTPTMedication');
        const tptMedicationOtherInput = document.getElementById('completedTPTMedicationOther');
        const parentCheckbox = document.getElementById('includeCompletedTPT');

        if (tptMedicationSelect && tptMedicationOtherInput && parentCheckbox) {
            const updateOtherVisibility = () => {
                if (!parentCheckbox.checked) {
                    tptMedicationOtherInput.style.display = 'none';
                    tptMedicationOtherInput.value = '';
                    return;
                }
                tptMedicationOtherInput.style.display = tptMedicationSelect.value === 'Other' ? 'block' : 'none';
                tptMedicationOtherInput.disabled = tptMedicationSelect.value !== 'Other';
                if (tptMedicationSelect.value !== 'Other') tptMedicationOtherInput.value = '';
            };
            tptMedicationSelect.addEventListener('change', updateOtherVisibility);
            updateOtherVisibility();
        }
    }

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
                    if (!dateInput.value) {
                        dateInput.value = JSDateToBE(new Date());
                    }
                    // durationInput already defaults to 60 from HTML
                } else {
                    dateInput.style.borderColor = '';
                }
            };
            checkbox.addEventListener('change', function () {
                toggleFields(this.checked);
                if (this.checked) dateInput.focus();
            });
            toggleFields(checkbox.checked); // Initial state
        }
    }

    function saveDoctorInfo() {
        let sharedInfo = {};
        try {
            const existingInfo = localStorage.getItem('sharedDoctorInfo');
            if (existingInfo) {
                sharedInfo = JSON.parse(existingInfo);
            }
        } catch (e) {
            console.error("Error reading sharedDoctorInfo for update:", e);
            sharedInfo = {};
        }

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
        const doctorNameThaiEl = document.getElementById('doctorNameThai');
        const doctorNameEnglishEl = document.getElementById('doctorNameEnglish');
        const medicalLicenseEl = document.getElementById('medicalLicense');

        if (doctorNameThaiEl) doctorNameThaiEl.addEventListener('change', saveDoctorInfo);
        if (doctorNameEnglishEl) doctorNameEnglishEl.addEventListener('change', saveDoctorInfo);
        if (medicalLicenseEl) medicalLicenseEl.addEventListener('change', saveDoctorInfo);
    }

    function handleFormSubmitOnEnter() {
        document.getElementById('referralForm').addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                const activeElement = document.activeElement;

                if (activeElement && activeElement.tagName === 'TEXTAREA') {
                    // For TEXTAREA elements, allow all Enter key combinations (Enter, Ctrl+Enter, Shift+Enter)
                    // to perform their default action (typically inserting a newline).
                    // We stop this specific event handler from proceeding to submit the form.
                    return;
                }

                // If the active element is NOT a TEXTAREA (where we returned above),
                // AND it's not a button or submit type input:
                if (activeElement && activeElement.type !== 'button' && activeElement.type !== 'submit') {
                    event.preventDefault(); // Prevent default action (like native form submission on Enter for some inputs)
                    previewLetter();        // Call our custom preview/submit function
                }
                // If it's a button or submit input, Enter will trigger its default click/submit action.
            }
        });
    }

    function previewLetter() {
        const form = document.getElementById('referralForm');
        const data = {};
        let isValid = true;
        let missingFieldsMessages = [];

        const requiredStaticFields = [
            { id: 'letterDate', name: 'วันที่ / Date' },
            { id: 'patientName', name: 'ชื่อผู้ป่วย / Patient Name' },
            { id: 'doctorNameThai', name: 'ชื่อแพทย์ (ภาษาไทย)' },
            { id: 'medicalLicense', name: 'เลขที่ใบประกอบวิชาชีพ' }
        ];

        requiredStaticFields.forEach(fieldInfo => {
            const element = document.getElementById(fieldInfo.id);
            if (!element || !element.value?.trim()) {
                missingFieldsMessages.push(fieldInfo.name);
                if (element) element.style.borderColor = 'red';
                isValid = false;
            } else if (element) {
                element.style.borderColor = '';
                if (element.classList.contains('date-input') && element.value.length > 0) {
                    const era = window.Common.getEraFromForm('referralForm');
                    const ok = !!window.Common.parseDate(element.value, era);
                    if (!ok) {
                        missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        const optionalDateFields = ['dob', 'firstDiagnosisDateRetro', 'initialCD4Date', 'latestVLDate', 'artStartDate',
            'treatedHCVCompletionDate', 'treatedTBCompletionDate', 'completedTPTCompletionDate'];
        optionalDateFields.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value.trim()) {
                const era = window.Common.getEraFromForm('referralForm');
                const ok = !!window.Common.parseDate(el.value, era);
                if (!ok) {
                    missingFieldsMessages.push(`${el.labels[0] ? el.labels[0].textContent.split(' (')[0].split(' /')[0].trim() : id} (รูปแบบไม่ถูกต้อง / Invalid format: ${el.value})`);
                    el.style.borderColor = 'red';
                    isValid = false;
                } else {
                    el.style.borderColor = '';
                }
            } else if (el) {
                el.style.borderColor = '';
            }
        });


        const includeSyphilisActiveCheckbox = document.getElementById('includeSyphilisActive');
        if (includeSyphilisActiveCheckbox && includeSyphilisActiveCheckbox.checked) {
            const syphilisStartDateInput = document.getElementById('syphilisStartDate');
            if (!syphilisStartDateInput.value.trim()) {
                missingFieldsMessages.push("วันที่เริ่มการรักษาโรคซิฟิลิส / Syphilis Treatment Start Date");
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (syphilisStartDateInput.value.length < 10 || !window.Common.parseDate(syphilisStartDateInput.value, window.Common.getEraFromForm('referralForm'))) {
                missingFieldsMessages.push(`วันที่เริ่มการรักษาโรคซิฟิลิส (รูปแบบไม่ถูกต้อง / Invalid format: ${syphilisStartDateInput.value})`);
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else {
                syphilisStartDateInput.style.borderColor = '';
            }
        }

        const includeLastMedicinePickupCheckbox = document.getElementById('includeLastMedicinePickup');
        const lastMedicinePickupDateInput = document.getElementById('lastMedicinePickupDate');
        if (includeLastMedicinePickupCheckbox && includeLastMedicinePickupCheckbox.checked) {
            if (!lastMedicinePickupDateInput.value.trim()) { // Only require date if checkbox is checked AND no duration is specified as an alternative.
                // If only duration is filled, date is not strictly required.
                // The print template handles showing duration only if date is missing.
                // For validation, let's require it if the checkbox is checked AND the user intends to provide a date.
                // This logic might need refinement based on how strictly "last pickup date" is enforced.
                // For now, if checked and empty, mark as error.
                missingFieldsMessages.push("ผู้ป่วยรับยาครั้งสุดท้ายเมื่อ / Last medicine pick up on");
                lastMedicinePickupDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (lastMedicinePickupDateInput.value.trim()) {
                const era = window.Common.getEraFromForm('referralForm');
                const ok = !!window.Common.parseDate(lastMedicinePickupDateInput.value, era);
                if (!ok) {
                    missingFieldsMessages.push(`ผู้ป่วยรับยาครั้งสุดท้ายเมื่อ (รูปแบบไม่ถูกต้อง / Invalid format: ${lastMedicinePickupDateInput.value})`);
                    lastMedicinePickupDateInput.style.borderColor = 'red';
                    isValid = false;
                } else {
                    lastMedicinePickupDateInput.style.borderColor = '';
                }
            } else {
                lastMedicinePickupDateInput.style.borderColor = '';
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
            if (key.startsWith('artMedSelect-') || key.startsWith('artTablets-') || key.startsWith('artTime-')) return;

            if (element && element.type === 'checkbox') return;
            if (element && typeof value === 'string') data[key] = value.trim();
            else data[key] = value;
        });

        data.doctorNameEnglish = (data.doctorNameEnglish || '').toUpperCase();
        data.passportNumber = (data.passportNumber || '').toUpperCase(); // Ensure passport number is collected as uppercase too


        const checkboxIds = [
            'includeRetroviral', 'includeSyphilisActive', 'includeHBV',
            'includeHCVActive', 'includeTreatedSyphilis', 'includeTreatedHCV',
            'includeTreatedTB', 'includeCompletedTPT', 'includeOtherHistory',
            'includeLastMedicinePickup', 'attachmentLabResults', 'attachmentOther',
            'includeTmxSmp', 'includeReferralForAdmission'
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
        if (data.includeRetroviral && data.includeTmxSmp) {
            data.tmxSmpTablets = document.getElementById('tmxSmpTablets').value;
        } else {
            delete data.tmxSmpTablets;
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
            const tptOtherInput = document.getElementById('completedTPTMedicationOther');
            data.completedTPTMedicationText = tptSelect.value === 'Other' ?
                tptOtherInput.value : tptSelect.options[tptSelect.selectedIndex].text;
            data.completedTPTMedicationOther = tptOtherInput.value;
        }


        if (!data.includeLastMedicinePickup || !document.getElementById('lastMedicinePickupDate').value.trim()) {
            delete data.lastMedicinePickupDate;
        } else {
            data.lastMedicinePickupDate = document.getElementById('lastMedicinePickupDate').value;
        }

        if (!data.includeLastMedicinePickup || !document.getElementById('medicineDuration').value.trim()) {
            delete data.medicineDuration;
        } else {
            data.medicineDuration = document.getElementById('medicineDuration').value;
        }

        if (!data.attachmentOther || !data.attachmentOtherText?.trim()) {
            delete data.attachmentOtherText;
        }


        // Normalize all date fields to BE (letter displays BE (CE))
        const era = window.Common.getEraFromForm('referralForm');
        const toBE = (v) => v ? window.Common.convertDateString(v, era, window.Common.ERA_BE) : '';
        const dateKeys = ['letterDate', 'dob', 'firstDiagnosisDateRetro', 'artStartDate', 'initialCD4Date', 'latestVLDate',
            'treatedHCVCompletionDate', 'treatedTBCompletionDate', 'completedTPTCompletionDate', 'lastMedicinePickupDate'];
        dateKeys.forEach(k => { if (data[k]) data[k] = toBE(data[k]); });
        if (data.includeSyphilisActive && data.syphilisStartDate) data.syphilisStartDate = toBE(data.syphilisStartDate);
        data._yearEra = era;

        data.additionalNotes = (document.getElementById('additionalNotes')?.value || '').trim();
        localStorage.setItem('referralDataForPrint', JSON.stringify(data));
        window.open('print-letter.html', '_blank');
    }
});
