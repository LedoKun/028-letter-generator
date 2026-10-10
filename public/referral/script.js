document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Constants ---
    const ART_MEDICATION_OPTIONS = [
        // Triple-Drug Regimens
        { value: "TDF/3TC/DTG", text: "TDF/3TC/DTG" },        // DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TAF/3TC/DTG", text: "TAF/3TC/DTG" },        // DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR ALAFENAMIDE
        { value: "TAF/FTC/DTG", text: "TAF/FTC/DTG" },        // DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR ALAFENAMIDE
        { value: "TDF/3TC/EFV", text: "TDF/3TC/EFV (600mg)" },// EFAVIRENZ/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE

        // Double-Drug NRTI Backbones
        { value: "TDF/FTC", text: "TDF/FTC" },            // EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TDF/3TC", text: "TDF/3TC" },            // LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE
        { value: "TAF/FTC", text: "TAF/FTC" },            // EMTRICITABINE/TENOFOVIR ALAFENAMIDE
        { value: "TAF/3TC", text: "TAF/3TC" },            // LAMIVUDINE/TENOFOVIR ALAFENAMIDE
        { value: "AZT/3TC300/150", text: "AZT/3TC (300mg/150mg)" },// ZIDOVUDINE/LAMIVUDINE

        // Individual Components
        { value: "EFV200", text: "EFV (200mg)" },        // EFAVIRENZ
        { value: "RPV", text: "RPV" },                // RILPIVIRINE
        { value: "LPV/r200/50", text: "LPV/r (200mg/50mg)" }, // LOPINAVIR/RITONAVIR (200mg/50mg)
        { value: "DTG50", text: "DTG (50mg)" },         // DOLUTEGRAVIR
        { value: "3TC150", text: "3TC (150mg)" },        // LAMIVUDINE (150 mg)
        { value: "ABC300", text: "ABC (300mg)" },        // ABACAVIR
        { value: "DRV", text: "DRV" },                // DARUNAVIR
        { value: "RTV50", text: "RTV (50mg)" }          // RITONAVIR
    ];
    let artMedicationCounter = 0;

    // --- Initialize Form ---
    initializeDateInputs();
    initializeNationalIdInput();
    initializeNapIdInput();
    initializePassportInput();
    setupConditionalSections();
    setupMpoxOptions();
    setupTreatedTBSitesLogic();
    setupTPTMedicationLogic();
    setupLastMedicinePickupToggle();
    window.Common.loadDoctorInfo('doctorNameThai', 'doctorNameEnglish', 'medicalLicense');
    initializeArtMedications();
    initializeTmxSmpCheckbox();
    initializeOtherMedications();
    window.Common.handleFormSubmitOnEnter('referralForm', saveLetter);
    document.getElementById('printButton').addEventListener('click', printLetter);
    document.getElementById('saveButton').addEventListener('click', saveLetter);
    window.Common.renderDocTabs('referral');
    window.Common.setupLanguageToggle('referralForm');
    window.Common.syncPatientFields({
        patientName: 'patientName',
        dob: 'dob',
        nationalId: 'nationalId',
        passportNumber: 'passportNumber'
    });
    window.Common.setupClearFormButtons('referralForm');
    window.Common.setupPdfPreview({
        formId: 'referralForm',
        collectData: collectReferralData,
        buildPayload: data => ({
            type: 'Referral-Letter',
            patientName: data.patientName,
            language: data.language,
            content: window.PdfTemplates.buildReferral(data)
        })
    });

    window.Common.autoFocusPatientName();

    const doctorNameEnglishInputReferral = document.getElementById('doctorNameEnglish');
    if (doctorNameEnglishInputReferral) {
        doctorNameEnglishInputReferral.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }





    function initializeDateInputs() {
        document.querySelectorAll('.date-input').forEach(input => {
            window.Common.attachSmartDate(input);
        });
        document.querySelectorAll('.month-year-input').forEach(input => {
            window.Common.attachMonthYearAutoFormat(input, () => window.Common.detectEraFromValue(input.value));
            window.Common.attachEraBadge(input);
        });
        const letterDateInput = document.getElementById('letterDate');
        window.Common.setTodayIfEmpty(letterDateInput, window.Common.ERA_CE);
    }



    function initializeNationalIdInput() {
        const nationalIdInput = document.getElementById('nationalId');
        if (nationalIdInput) nationalIdInput.addEventListener('input', window.Common.autoFormatNationalId);
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
            { checkboxId: 'includeSuspectedMpox', detailsId: 'suspectedMpoxDetails', callback: updateMpoxNestedControls },
            { checkboxId: 'includeTreatedHCV', detailsId: 'treatedHCVDetails' },
            { checkboxId: 'includeTreatedTB', detailsId: 'treatedTBDetails' },
            { checkboxId: 'includeCompletedTPT', detailsId: 'completedTPTDetails' },
            { checkboxId: 'includeOngoingTPT', detailsId: 'ongoingTPTDetails' },
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
                        if (toggle.checkboxId === 'includeCompletedTPT' || toggle.checkboxId === 'includeOngoingTPT') {
                            const tptPrefix = toggle.checkboxId === 'includeCompletedTPT' ? 'completed' : 'ongoing';
                            const tptMedSelect = document.getElementById(`${tptPrefix}TPTMedication`);
                            const tptMedOther = document.getElementById(`${tptPrefix}TPTMedicationOther`);
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

        const syphilisMedicationSelect = document.getElementById('syphilisMedication');
        if (syphilisMedicationSelect) {
            syphilisMedicationSelect.addEventListener('change', calculateSyphilisSchedule);
        }
    }

    function updateMpoxNestedControls() {
        const parentCheckbox = document.getElementById('includeSuspectedMpox');
        if (!parentCheckbox) return;

        [
            { checkboxId: 'mpoxSymptomOther', inputId: 'mpoxSymptomOtherText' },
            { checkboxId: 'mpoxRiskOther', inputId: 'mpoxRiskOtherText' }
        ].forEach(({ checkboxId, inputId }) => {
            const checkbox = document.getElementById(checkboxId);
            const input = document.getElementById(inputId);
            if (!checkbox || !input) return;
            const active = parentCheckbox.checked && checkbox.checked;
            input.style.display = active ? 'block' : 'none';
            input.disabled = !active;
        });
    }

    function setupMpoxOptions() {
        const parentCheckbox = document.getElementById('includeSuspectedMpox');
        const symptomOther = document.getElementById('mpoxSymptomOther');
        const riskOptions = window.ReferralData.MPOX_RISK_OPTIONS
            .map(option => document.getElementById(option.id))
            .filter(Boolean);
        const noKnownRisk = document.getElementById('mpoxRiskNoneKnown');
        if (!parentCheckbox || !noKnownRisk) return;

        if (symptomOther) symptomOther.addEventListener('change', updateMpoxNestedControls);
        riskOptions.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox === noKnownRisk && checkbox.checked) {
                    riskOptions.forEach(option => {
                        if (option !== noKnownRisk) option.checked = false;
                    });
                } else if (checkbox.checked) {
                    noKnownRisk.checked = false;
                }
                document.getElementById('mpoxRiskFactorsGroup').style.borderColor = '';
                updateMpoxNestedControls();
            });
        });
        window.ReferralData.MPOX_SYMPTOM_OPTIONS.forEach(option => {
            const checkbox = document.getElementById(option.id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    document.getElementById('mpoxSymptomsGroup').style.borderColor = '';
                });
            }
        });
        parentCheckbox.addEventListener('change', updateMpoxNestedControls);
        updateMpoxNestedControls();
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
        tabletsLabel.textContent = `จำนวนเม็ด / Tablets:`;
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
        timeLabel.textContent = `เวลาให้ยา / Administration time (24-hour):`;
        timeLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.title = '24-hour time, e.g., 09:30';
        timeInput.id = `artTime-${idSuffix}`;
        timeInput.name = `artTime-${idSuffix}`;
        timeInput.classList.add('time-input', 'mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        window.Common.attachTimeAutoFormat(timeInput);
        timeDiv.appendChild(timeLabel);
        timeDiv.appendChild(timeInput);

        const removeBtnDiv = document.createElement('div');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'ลบ / Remove';
        removeBtn.classList.add('btn-danger', 'thai-font');
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


    function createOtherMedicationInputs(idSuffix) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('medication-item', 'grid', 'grid-cols-1', 'md:grid-cols-5', 'gap-2', 'items-end');
        itemDiv.id = `otherMedItem-${idSuffix}`;

        const nameDiv = document.createElement('div');
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = `otherMedName-${idSuffix}`;
        nameLabel.textContent = 'ชื่อยา / Medication Name:';
        nameLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `otherMedName-${idSuffix}`;
        nameInput.name = `otherMedName-${idSuffix}`;
        nameInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        nameDiv.appendChild(nameLabel);
        nameDiv.appendChild(nameInput);

        const strengthDiv = document.createElement('div');
        const strengthLabel = document.createElement('label');
        strengthLabel.htmlFor = `otherMedStrength-${idSuffix}`;
        strengthLabel.textContent = 'ความแรง / Strength (e.g., mg):';
        strengthLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const strengthInput = document.createElement('input');
        strengthInput.type = 'text';
        strengthInput.id = `otherMedStrength-${idSuffix}`;
        strengthInput.name = `otherMedStrength-${idSuffix}`;
        strengthInput.placeholder = 'e.g., 400 mg';
        strengthInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        strengthDiv.appendChild(strengthLabel);
        strengthDiv.appendChild(strengthInput);

        const scheduleDiv = document.createElement('div');
        const scheduleLabel = document.createElement('label');
        scheduleLabel.htmlFor = `otherMedSchedule-${idSuffix}`;
        scheduleLabel.textContent = 'วิธีรับประทาน / Schedule:';
        scheduleLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const scheduleSelect = document.createElement('select');
        scheduleSelect.id = `otherMedSchedule-${idSuffix}`;
        scheduleSelect.name = `otherMedSchedule-${idSuffix}`;
        ['', 'OD', 'BID', 'TID', 'QID', 'PRN'].forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val || 'เลือก / Select';
            scheduleSelect.appendChild(option);
        });
        scheduleSelect.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        scheduleDiv.appendChild(scheduleLabel);
        scheduleDiv.appendChild(scheduleSelect);

        const qtyDiv = document.createElement('div');
        const qtyLabel = document.createElement('label');
        qtyLabel.htmlFor = `otherMedQty-${idSuffix}`;
        qtyLabel.textContent = 'จำนวน (เม็ด/ขวด/หน่วย) / Quantity (tablets/bottles/units):';
        qtyLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.id = `otherMedQty-${idSuffix}`;
        qtyInput.name = `otherMedQty-${idSuffix}`;
        qtyInput.placeholder = 'เช่น 28 / e.g., 28';
        qtyInput.min = '0';
        qtyInput.classList.add('mt-1', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm');
        qtyDiv.appendChild(qtyLabel);
        qtyDiv.appendChild(qtyInput);

        const removeBtnDiv = document.createElement('div');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'ลบ / Remove';
        removeBtn.classList.add('btn-danger', 'thai-font');
        removeBtn.onclick = function () { itemDiv.remove(); };
        removeBtnDiv.appendChild(removeBtn);

        itemDiv.appendChild(nameDiv);
        itemDiv.appendChild(strengthDiv);
        itemDiv.appendChild(scheduleDiv);
        itemDiv.appendChild(qtyDiv);
        itemDiv.appendChild(removeBtnDiv);
        return itemDiv;
    }

    function initializeOtherMedications() {
        const addButton = document.getElementById('addOtherMedication');
        if (addButton) {
            addButton.addEventListener('click', function () {
                const container = document.getElementById('otherMedicationsContainer');
                if (container) container.appendChild(createOtherMedicationInputs(Date.now()));
            });
        }
    }


    function calculateSyphilisSchedule() {
        const startDateInput = document.getElementById('syphilisStartDate');
        const dose1DateEl = document.getElementById('syphilisDose1Date');
        const dose2DateEl = document.getElementById('syphilisDose2Date');
        const dose3DateEl = document.getElementById('syphilisDose3Date');

        const medicationSelect = document.getElementById('syphilisMedication');
        const benzathineSchedule = document.getElementById('syphilisBenzathineSchedule');
        const doxycyclineDuration = document.getElementById('syphilisDoxycyclineDuration');
        const durationText = document.getElementById('syphilisDurationText');

        if (!startDateInput || !dose1DateEl || !dose2DateEl || !dose3DateEl) return;

        const syphilisActiveCheckbox = document.getElementById('includeSyphilisActive');
        if (!syphilisActiveCheckbox || !syphilisActiveCheckbox.checked) {
            dose1DateEl.textContent = '';
            dose2DateEl.textContent = '';
            dose3DateEl.textContent = '';
            startDateInput.style.borderColor = '';
            return;
        }

        const medValue = medicationSelect ? medicationSelect.value : 'Benzathine';

        if (medValue === 'Benzathine') {
            if (benzathineSchedule) benzathineSchedule.style.display = 'block';
            if (doxycyclineDuration) doxycyclineDuration.style.display = 'none';
        } else {
            if (benzathineSchedule) benzathineSchedule.style.display = 'none';
            if (doxycyclineDuration) doxycyclineDuration.style.display = 'block';
            if (durationText) {
                durationText.textContent = medValue === 'Doxycycline2Weeks'
                    ? '14 วัน / 14 days'
                    : '28 วัน / 28 days';
            }
        }

        const era = window.Common.detectEraFromValue(startDateInput.value);
        const startDate = window.Common.parseDate(startDateInput.value, era);

        if (!startDate) {
            dose1DateEl.textContent = '';
            dose2DateEl.textContent = '';
            dose3DateEl.textContent = '';
            if (startDateInput.value.length > 0 && startDateInput.value.length < 10) startDateInput.style.borderColor = 'red';
            else if (startDateInput.value.length === 10 && !window.Common.parseDate(startDateInput.value, era)) startDateInput.style.borderColor = 'red';
            else startDateInput.style.borderColor = '';
            return;
        }
        startDateInput.style.borderColor = '';

        if (medValue === 'Benzathine') {
            dose1DateEl.textContent = window.Common.formatDate(new Date(startDate), era);
            const dose2Date = new Date(startDate);
            dose2Date.setDate(startDate.getDate() + 7);
            dose2DateEl.textContent = window.Common.formatDate(dose2Date, era);
            const dose3Date = new Date(startDate);
            dose3Date.setDate(startDate.getDate() + 14);
            dose3DateEl.textContent = window.Common.formatDate(dose3Date, era);
        }
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
        const setupMedicationOther = (prefix) => {
            const tptMedicationSelect = document.getElementById(`${prefix}TPTMedication`);
            const tptMedicationOtherInput = document.getElementById(`${prefix}TPTMedicationOther`);
            const parentCheckbox = document.getElementById(`include${prefix[0].toUpperCase()}${prefix.slice(1)}TPT`);
            if (!tptMedicationSelect || !tptMedicationOtherInput || !parentCheckbox) return;

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
        };
        setupMedicationOther('completed');
        setupMedicationOther('ongoing');
    }

    function setupLastMedicinePickupToggle() {
        const checkbox = document.getElementById('includeLastMedicinePickup');
        const detailsDiv = document.getElementById('lastMedicinePickupDetails');
        const dateInput = document.getElementById('lastMedicinePickupDate');
        const durationInput = document.getElementById('medicineDuration');
        const retroviralCheckbox = document.getElementById('includeRetroviral');

        if (checkbox && detailsDiv && dateInput && durationInput && retroviralCheckbox) {
            const toggleFields = () => {
                const active = retroviralCheckbox.checked && checkbox.checked;
                checkbox.disabled = !retroviralCheckbox.checked;
                detailsDiv.style.opacity = active ? '1' : '0.5';
                dateInput.disabled = !active;
                durationInput.disabled = !active;
                if (active) {
                    if (!dateInput.value) {
                        dateInput.value = window.Common.formatDate(new Date(), window.Common.ERA_CE);
                    }
                    // durationInput already defaults to 60 from HTML
                } else {
                    dateInput.style.borderColor = '';
                }
            };
            checkbox.addEventListener('change', function () {
                toggleFields();
                if (retroviralCheckbox.checked && this.checked) dateInput.focus();
            });
            retroviralCheckbox.addEventListener('change', toggleFields);
            toggleFields();
        }
    }



    function collectReferralData() {
        const form = document.getElementById('referralForm');
        const language = document.getElementById('language')?.value || 'th';
        let isValid = true;
        const missingFieldsMessages = [];

        const requiredStaticFields = [
            { id: 'letterDate', name: 'วันที่ / Date' },
            { id: 'patientName', name: 'ชื่อผู้ป่วย / Patient Name' },
            { id: language === 'th' ? 'doctorNameThai' : 'doctorNameEnglish', name: language === 'th' ? 'ชื่อแพทย์' : 'Doctor\'s name' }
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
                    const ok = !!window.Common.parseDateAuto(element.value);
                    if (!ok) {
                        missingFieldsMessages.push(`${fieldInfo.name} (รูปแบบไม่ถูกต้อง / Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        const optionalDateFields = ['dob', 'firstDiagnosisDateRetro', 'initialCD4Date', 'latestVLDate', 'artStartDate',
            'treatedHCVCompletionDate', 'treatedTBCompletionDate'];
        optionalDateFields.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value.trim()) {
                const ok = !!window.Common.parseDateAuto(el.value);
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

        const monthYearFields = ['completedTPTStartDate', 'ongoingTPTStartDate'];
        monthYearFields.forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.value.trim()) {
                if (el) el.style.borderColor = '';
                return;
            }
            const value = el.value.trim();
            if (!window.Common.parseMonthYearAuto(value)) {
                missingFieldsMessages.push(`${el.labels[0] ? el.labels[0].textContent.split(' /')[0].trim() : id} (รูปแบบไม่ถูกต้อง / Invalid format: ${value})`);
                el.style.borderColor = 'red';
                isValid = false;
            } else {
                el.style.borderColor = '';
            }
        });

        document.querySelectorAll('#artMedicationsContainer input[id^="artTime-"]').forEach(el => {
            if (!el.value.trim()) {
                el.style.borderColor = '';
                return;
            }
            el.value = window.Common.formatTimeInputValue(el.value, true);
            if (!window.Common.parseTime24(el.value)) {
                missingFieldsMessages.push(`เวลาให้ยา ART (รูปแบบไม่ถูกต้อง / Invalid 24-hour time: ${el.value})`);
                el.style.borderColor = 'red';
                isValid = false;
            } else {
                el.style.borderColor = '';
            }
        });


        const includeSyphilisActiveCheckbox = document.getElementById('includeSyphilisActive');
        if (includeSyphilisActiveCheckbox && includeSyphilisActiveCheckbox.checked) {
            const syphilisStartDateInput = document.getElementById('syphilisStartDate');
            if (!syphilisStartDateInput.value.trim()) {
                missingFieldsMessages.push("วันที่เริ่มการรักษาซิฟิลิส / Syphilis treatment start date");
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (syphilisStartDateInput.value.length < 10 || !window.Common.parseDateAuto(syphilisStartDateInput.value)) {
                missingFieldsMessages.push(`วันที่เริ่มการรักษาโรคซิฟิลิส (รูปแบบไม่ถูกต้อง / Invalid format: ${syphilisStartDateInput.value})`);
                syphilisStartDateInput.style.borderColor = 'red';
                isValid = false;
            } else {
                syphilisStartDateInput.style.borderColor = '';
            }
        }

        const includeLastMedicinePickupCheckbox = document.getElementById('includeLastMedicinePickup');
        const lastMedicinePickupDateInput = document.getElementById('lastMedicinePickupDate');
        const includeRetroviralCheckbox = document.getElementById('includeRetroviral');
        if (includeRetroviralCheckbox?.checked && includeLastMedicinePickupCheckbox?.checked) {
            if (!lastMedicinePickupDateInput.value.trim()) {
                missingFieldsMessages.push("วันที่รับยาครั้งล่าสุด / Last medication pickup date");
                lastMedicinePickupDateInput.style.borderColor = 'red';
                isValid = false;
            } else if (lastMedicinePickupDateInput.value.trim()) {
                const ok = !!window.Common.parseDateAuto(lastMedicinePickupDateInput.value);
                if (!ok) {
                    missingFieldsMessages.push(`วันที่รับยาครั้งล่าสุด (รูปแบบไม่ถูกต้อง / Invalid format: ${lastMedicinePickupDateInput.value})`);
                    lastMedicinePickupDateInput.style.borderColor = 'red';
                    isValid = false;
                } else {
                    lastMedicinePickupDateInput.style.borderColor = '';
                }
            } else {
                lastMedicinePickupDateInput.style.borderColor = '';
            }
        }

        const data = window.ReferralData.collect(form, window.Common);
        const mpoxValidationMessages = {
            durationRequired: 'ระยะเวลาตั้งแต่เริ่มมีอาการของโรคฝีดาษวานร / Duration since mpox symptom onset',
            durationInvalid: 'ระยะเวลาตั้งแต่เริ่มมีอาการของโรคฝีดาษวานร (กรอกเป็นจำนวนเต็มมากกว่า 0 / Enter a whole number greater than 0)',
            symptomRequired: 'อาการสำคัญของโรคฝีดาษวานรอย่างน้อย 1 รายการ / At least one presenting symptom',
            symptomOtherRequired: 'รายละเอียดอาการอื่น ๆ ของโรคฝีดาษวานร / Other mpox symptom details',
            riskRequired: 'ข้อมูลความเสี่ยงตามที่ผู้ป่วยให้ประวัติอย่างน้อย 1 รายการ / At least one patient-reported risk factor',
            riskConflict: 'ไม่สามารถเลือก “ผู้ป่วยไม่ให้ประวัติความเสี่ยง” ร่วมกับรายการอื่น / “None reported” cannot be selected with another risk factor',
            riskOtherRequired: 'รายละเอียดข้อมูลความเสี่ยงอื่น ๆ / Other patient-reported risk factor details'
        };
        [
            'mpoxSymptomDurationDays',
            'mpoxSymptomsGroup',
            'mpoxSymptomOtherText',
            'mpoxRiskFactorsGroup',
            'mpoxRiskOtherText'
        ].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.borderColor = '';
        });
        window.ReferralData.validateMpox(data).forEach(error => {
            missingFieldsMessages.push(mpoxValidationMessages[error.code] || error.code);
            const element = document.getElementById(error.fieldId);
            if (element) element.style.borderColor = 'red';
            isValid = false;
        });

        return { data, isValid, missingFieldsMessages };
    }

    function referralPayload() {
        const { data, isValid, missingFieldsMessages } = collectReferralData();
        if (!isValid) {
            alert(`กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง:\n- ${missingFieldsMessages.join('\n- ')}`);
            const firstInvalidField = Array.from(document.querySelectorAll('[style*="border-color: red"]'))[0];
            if (firstInvalidField) {
                const focusTarget = firstInvalidField.matches('input, select, textarea, button')
                    ? firstInvalidField
                    : firstInvalidField.querySelector('input, select, textarea, button');
                if (focusTarget) focusTarget.focus();
            }
            return null;
        }
        return {
            type: 'Referral-Letter',
            patientName: data.patientName,
            language: data.language,
            content: window.PdfTemplates.buildReferral(data)
        };
    }

    async function saveLetter() {
        const payload = referralPayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.save(payload);
        } catch (error) {
            console.error('Error generating referral letter PDF:', error);
            alert('Unable to generate PDF. Please check the console for details.');
        }
    }

    async function printLetter() {
        const payload = referralPayload();
        if (!payload) return;
        try {
            await window.PdfGenerator.print(payload);
        } catch (error) {
            console.error('Error printing referral letter PDF:', error);
            alert('Unable to print PDF. Please check the console for details.');
        }
    }

});
