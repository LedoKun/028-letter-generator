document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Constants ---
    const ART_MEDICATION_OPTIONS = [
        { value: "DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE", text: "DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE" },
        { value: "DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE", text: "DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE" },
        { value: "DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR ALAFENAMIDE", text: "DOLUTEGRAVIR/LAMIVUDINE/TENOFOVIR ALAFENAMIDE" },
        { value: "DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR ALAFENAMIDE", text: "DOLUTEGRAVIR/EMTRICITABINE/TENOFOVIR ALAFENAMIDE" },
        { value: "EFAVIRENZ/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE", text: "EFAVIRENZ/LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE" },
        { value: "EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE", text: "EMTRICITABINE/TENOFOVIR DISOPROXIL FUMARATE" },
        { value: "LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE", text: "LAMIVUDINE/TENOFOVIR DISOPROXIL FUMARATE" }, // Added
        { value: "LAMIVUDINE/TENOFOVIR ALAFENAMIDE", text: "LAMIVUDINE/TENOFOVIR ALAFENAMIDE" }, // Added
        { value: "EFAVIRENZ", text: "EFAVIRENZ" },
        { value: "RILPIVIRINE", text: "RILPIVIRINE" },
        { value: "LOPINAVIR/RITONAVIR", text: "LOPINAVIR/RITONAVIR" },
        { value: "DOLUTEGRAVIR", text: "DOLUTEGRAVIR" },
        { value: "LAMIVUDINE (150 mg)", text: "LAMIVUDINE (150 mg)" }, // Added
        { value: "LAMIVUDINE (300 mg)", text: "LAMIVUDINE (300 mg)" }, // Added
        { value: "ABACAVIR", text: "ABACAVIR" }, // Added
        { value: "DARUNAVIR", text: "DARUNAVIR" }, // Added
        { value: "RITONAVIR", text: "RITONAVIR" }, // Added
        { value: "DOXYCYCLINE", text: "DOXYCYCLINE" },
        { value: "AZITHROMYCIN", text: "AZITHROMYCIN" },
        { value: "OTHER", text: "OTHER (SPECIFY)" }
    ];
    let artMedicationCounter = 0;

    // --- Initialize Form ---
    initializeDateInputs();
    initializeSalutationField();
    initializeNationalityField();
    loadDoctorInfo();
    initializeArtMedications();
    setupConditionalMedicationSection();
    handleFormSubmitOnEnter();
    document.getElementById('previewButton').addEventListener('click', previewCertificate);
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    autoFocusPatientName();

    ['patientName', 'doctorNameEnglish', 'otherNationality', 'otherSalutation', 'passportNumber'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () { this.value = this.value.toUpperCase(); });
        }
    });

    // Ensure doctorNameEnglish input itself still uppercases live for immediate UI feedback
    const doctorNameEnglishCertInput = document.getElementById('doctorNameEnglish');
    if (doctorNameEnglishCertInput) {
        doctorNameEnglishCertInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // --- Helper Functions ---
    function autoFocusPatientName() {
        const patientNameInput = document.getElementById('patientName');
        if (patientNameInput) {
            patientNameInput.focus();
        }
    }

    function initializeDateInputs() {
        const form = document.getElementById('certificateForm');
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

    function initializeSalutationField() {
        const salutationSelect = document.getElementById('salutation');
        const otherSalutationInput = document.getElementById('otherSalutation');
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
                }
            });
        }
    }

    function initializeNationalityField() {
        const nationalitySelect = document.getElementById('nationality');
        const otherNationalityInput = document.getElementById('otherNationality');
        if (nationalitySelect && otherNationalityInput) {
            nationalitySelect.addEventListener('change', function () {
                if (this.value === 'OTHER') {
                    otherNationalityInput.classList.remove('hidden-field');
                    otherNationalityInput.required = true;
                    otherNationalityInput.focus();
                } else {
                    otherNationalityInput.classList.add('hidden-field');
                    otherNationalityInput.required = false;
                    otherNationalityInput.value = '';
                }
            });
        }
    }

    function setupConditionalMedicationSection() {
        const checkbox = document.getElementById('includeMedications');
        const detailsDiv = document.getElementById('medicationsDetails');
        if (checkbox && detailsDiv) {
            const updateVisibility = () => {
                const isChecked = checkbox.checked;
                detailsDiv.style.display = isChecked ? 'block' : 'none';
                const medItemElements = detailsDiv.querySelectorAll('.medication-item select, .medication-item input, .medication-item button, #addArtMedication');
                medItemElements.forEach(input => input.disabled = !isChecked);

                if (isChecked) { // If main checkbox is checked, re-evaluate individual "Other" fields
                    document.querySelectorAll('#artMedicationsContainer .medication-item').forEach(item => {
                        const selectEl = item.querySelector('select[id^="artMedSelect-"]');
                        const otherInputEl = item.querySelector('input[id^="artMedOther-"]');
                        if (selectEl && otherInputEl) {
                            otherInputEl.disabled = (selectEl.value !== 'OTHER');
                        }
                    });
                }
            };
            checkbox.addEventListener('change', updateVisibility);
            updateVisibility();
        }
    }

    function createArtMedicationInputs(idSuffix) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('medication-item', 'grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-2', 'items-start'); // items-start for better alignment
        itemDiv.id = `artMedItem-${idSuffix}`;

        const medDiv = document.createElement('div');
        medDiv.classList.add('md:col-span-2'); // Container for select and other input

        const medLabel = document.createElement('label');
        medLabel.htmlFor = `artMedSelect-${idSuffix}`;
        medLabel.textContent = `ยา / Medication:`;
        medLabel.classList.add('block', 'text-xs', 'font-medium', 'thai-font');
        medDiv.appendChild(medLabel);

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
        medDiv.appendChild(medSelect);

        const otherMedInput = document.createElement('input');
        otherMedInput.type = 'text';
        otherMedInput.id = `artMedOther-${idSuffix}`;
        otherMedInput.name = `artMedOther-${idSuffix}`;
        otherMedInput.placeholder = "SPECIFY MEDICATION (ALL CAPS)";
        otherMedInput.classList.add('mt-2', 'block', 'w-full', 'rounded-md', 'shadow-sm', 'py-1.5', 'px-2', 'text-sm', 'hidden-field'); // Added mt-2 for spacing
        otherMedInput.style.textTransform = 'uppercase';
        otherMedInput.addEventListener('input', function () { // Live uppercase
            this.value = this.value.toUpperCase();
        });
        medDiv.appendChild(otherMedInput);

        medSelect.addEventListener('change', function () {
            if (this.value === 'OTHER') {
                otherMedInput.classList.remove('hidden-field');
                otherMedInput.required = true; // Make it required for validation
                otherMedInput.disabled = false;
                otherMedInput.focus();
            } else {
                otherMedInput.classList.add('hidden-field');
                otherMedInput.required = false;
                otherMedInput.disabled = true;
                otherMedInput.value = ''; // Clear value when hidden
                otherMedInput.style.borderColor = ''; // Reset border color
            }
        });
        // Ensure other input is disabled if parent checkbox unchecks and medselect is OTHER
        otherMedInput.disabled = true; // Initially disabled, enabled by select change or setupConditionalMedicationSection


        const removeBtnDiv = document.createElement('div');
        removeBtnDiv.classList.add('flex', 'items-end', 'h-full'); // Align button to bottom
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'ลบ';
        removeBtn.classList.add('text-red-400', 'hover:text-red-300', 'text-xs', 'thai-font', 'py-1', 'px-2', 'border', 'border-red-400', 'rounded', 'w-full', 'md:w-auto', 'mt-2', 'md:mt-0'); // Adjusted margin
        removeBtn.onclick = function () { itemDiv.remove(); };
        removeBtnDiv.appendChild(removeBtn);

        itemDiv.appendChild(medDiv);
        itemDiv.appendChild(removeBtnDiv);
        return itemDiv;
    }

    function addArtMedicationToList() {
        artMedicationCounter++;
        const artContainer = document.getElementById('artMedicationsContainer');
        if (artContainer) {
            artContainer.appendChild(createArtMedicationInputs(artMedicationCounter));
            // Re-evaluate disabled states for "Other" fields based on main checkbox
            const includeMedsCheckbox = document.getElementById('includeMedications');
            if (includeMedsCheckbox && !includeMedsCheckbox.checked) {
                const newItemInputs = artContainer.lastChild.querySelectorAll('select, input, button');
                newItemInputs.forEach(ni => ni.disabled = true);
            } else if (includeMedsCheckbox && includeMedsCheckbox.checked) {
                const newItemSelect = artContainer.lastChild.querySelector('select');
                const newItemOtherInput = artContainer.lastChild.querySelector('input[id^="artMedOther-"]');
                if (newItemSelect && newItemOtherInput) {
                    newItemOtherInput.disabled = (newItemSelect.value !== 'OTHER');
                }
            }
        }
    }

    function initializeArtMedications() {
        const addButton = document.getElementById('addArtMedication');
        if (addButton) {
            addButton.addEventListener('click', addArtMedicationToList);
        }
        const artContainer = document.getElementById('artMedicationsContainer');
        if (artContainer && artContainer.children.length === 0) {
            addArtMedicationToList();
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
            sharedInfo = {}; // Reset if parsing fails
        }

        sharedInfo.sharedDoctorNameEnglish = document.getElementById('doctorNameEnglish').value.toUpperCase(); // Ensures uppercase
        sharedInfo.sharedMedicalLicense = document.getElementById('medicalLicense').value;
        // sharedInfo.sharedDoctorNameThai is preserved if set by the referral form

        localStorage.setItem('sharedDoctorInfo', JSON.stringify(sharedInfo));
    }

    function loadDoctorInfo() {
        const savedInfo = localStorage.getItem('sharedDoctorInfo');
        if (savedInfo) {
            try {
                const doctorInfo = JSON.parse(savedInfo);
                document.getElementById('doctorNameEnglish').value = doctorInfo.sharedDoctorNameEnglish || '';
                document.getElementById('medicalLicense').value = doctorInfo.sharedMedicalLicense || '';
            } catch (e) {
                console.error("Error parsing sharedDoctorInfo:", e);
                document.getElementById('doctorNameEnglish').value = '';
                document.getElementById('medicalLicense').value = '';
            }
        }
        // Attach change listeners
        const doctorNameEnglishEl = document.getElementById('doctorNameEnglish');
        const medicalLicenseEl = document.getElementById('medicalLicense');

        if (doctorNameEnglishEl) {
            doctorNameEnglishEl.addEventListener('change', saveDoctorInfo);
        }
        if (medicalLicenseEl) {
            medicalLicenseEl.addEventListener('change', saveDoctorInfo);
        }
    }

    function handleFormSubmitOnEnter() {
        const form = document.getElementById('certificateForm');
        if (form) {
            form.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    const activeElement = document.activeElement;
                    // Allow Enter (and Shift+Enter) inside textareas for new lines
                    if (activeElement && activeElement.tagName === 'TEXTAREA') {
                        return; // don't intercept
                    }
                    // For non-button inputs, Enter triggers preview
                    if (activeElement && activeElement.type !== 'button' && activeElement.type !== 'submit') {
                        event.preventDefault();
                        previewCertificate();
                    }
                }
            });
        }
    }

    function previewCertificate() {
        const form = document.getElementById('certificateForm');
        const data = {};
        let isValid = true;
        let missingFieldsMessages = [];

        const requiredFields = [
            { id: 'letterDate', name: 'Certificate Date' },
            { id: 'patientName', name: 'Patient Full Name' },
            { id: 'dob', name: 'Date of Birth' },
            { id: 'nationality', name: 'Nationality' },
            { id: 'doctorNameEnglish', name: 'Doctor\'s Name (English)' },
            { id: 'medicalLicense', name: 'Medical License No.' }
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
                    const era = window.Common.getEraFromForm('certificateForm');
                    const ok = !!window.Common.parseDate(element.value, era);
                    if (!ok) {
                        missingFieldsMessages.push(`${fieldInfo.name} (Invalid format: ${element.value})`);
                        element.style.borderColor = 'red';
                        isValid = false;
                    }
                }
            }
        });

        const salutationSelect = document.getElementById('salutation');
        if (salutationSelect && salutationSelect.value === 'OTHER') {
            const otherSalutationInput = document.getElementById('otherSalutation');
            if (!otherSalutationInput || !otherSalutationInput.value.trim()) {
                missingFieldsMessages.push('Salutation (Other)');
                if (otherSalutationInput) otherSalutationInput.style.borderColor = 'red';
                isValid = false;
            } else if (otherSalutationInput) {
                otherSalutationInput.style.borderColor = '';
            }
        }

        const nationalitySelect = document.getElementById('nationality');
        if (nationalitySelect && nationalitySelect.value === 'OTHER') {
            const otherNationalityInput = document.getElementById('otherNationality');
            if (!otherNationalityInput || !otherNationalityInput.value.trim()) {
                missingFieldsMessages.push('Nationality (Other)');
                if (otherNationalityInput) otherNationalityInput.style.borderColor = 'red';
                isValid = false;
            } else if (otherNationalityInput) {
                otherNationalityInput.style.borderColor = '';
            }
        }

        data.includeMedications = document.getElementById('includeMedications').checked;
        data.artMedications = [];

        if (data.includeMedications) {
            const medItems = document.querySelectorAll('#artMedicationsContainer .medication-item');
            if (medItems.length === 0) {
                missingFieldsMessages.push('Medications (at least 1)');
                isValid = false;
                const artContainer = document.getElementById('artMedicationsContainer');
                if (artContainer) artContainer.style.border = '1px solid red';
            } else {
                medItems.forEach((item, index) => {
                    const selectEl = item.querySelector('select[id^="artMedSelect-"]');
                    let medicationName = '';
                    selectEl.style.borderColor = ''; // Reset border

                    if (selectEl && selectEl.value) {
                        if (selectEl.value === 'OTHER') {
                            const otherInputEl = item.querySelector('input[id^="artMedOther-"]');
                            otherInputEl.style.borderColor = ''; // Reset border
                            if (otherInputEl && otherInputEl.value.trim()) {
                                medicationName = otherInputEl.value.trim().toUpperCase();
                            } else {
                                missingFieldsMessages.push(`Medication ${index + 1} (Specify Other Name)`);
                                isValid = false;
                                if (otherInputEl) otherInputEl.style.borderColor = 'red';
                            }
                        } else {
                            medicationName = selectEl.options[selectEl.selectedIndex].text.toUpperCase();
                        }
                        if (medicationName) {
                            data.artMedications.push({ medication: medicationName });
                        }
                    } else if (selectEl) { // Case where select element exists but no value selected (should not happen with default)
                        missingFieldsMessages.push(`Medication ${index + 1} (Not selected)`);
                        isValid = false;
                        selectEl.style.borderColor = 'red';
                    }
                });
                const artContainer = document.getElementById('artMedicationsContainer');
                if (artContainer) artContainer.style.border = ''; // Reset border if all items are valid
            }
        }


        if (!isValid) {
            alert(`Please complete all required fields correctly:\n- ${missingFieldsMessages.join('\n- ')}`);
            // Focus logic can be improved to find the first actual invalid medication item
            const firstInvalidField = requiredFields.find(f => missingFieldsMessages.some(m => m.includes(f.name)));
            if (firstInvalidField) document.getElementById(firstInvalidField.id)?.focus();
            else if (missingFieldsMessages.some(m => m.includes("Salutation (Other)"))) document.getElementById('otherSalutation')?.focus();
            else if (missingFieldsMessages.some(m => m.includes("Nationality (Other)"))) document.getElementById('otherNationality')?.focus();
            // Could add focusing for first invalid medication item here
            return;
        }

        new FormData(form).forEach((value, key) => {
            const element = form.elements[key];
            // Skip individual medication fields as they are handled separately above
            if (key.startsWith('artMedSelect-') || key.startsWith('artMedOther-')) return;
            if (element && element.type === 'checkbox' && key !== 'includeMedications') return;

            const fieldsToUppercase = ['patientName', 'doctorNameEnglish', 'otherNationality', 'otherSalutation', 'passportNumber'];
            if (fieldsToUppercase.includes(key)) {
                data[key] = value.trim().toUpperCase();
            } else if (element && typeof value === 'string') {
                data[key] = value.trim();
            } else {
                data[key] = value;
            }
        });

        if (data.salutation === 'OTHER' && data.otherSalutation) {
            data.salutation = data.otherSalutation;
        } else if (data.salutation === 'NONE') {
            data.salutation = '';
        } else if (data.salutation) {
            data.salutation = data.salutation.toUpperCase();
        }

        if (data.nationality === 'OTHER' && data.otherNationality) {
            data.nationality = data.otherNationality;
        } else if (data.nationality) {
            data.nationality = data.nationality.toUpperCase();
        }

        // artMedications array already populated correctly above

        data.doctorNameEnglish = document.getElementById('doctorNameEnglish').value.toUpperCase();
        data.passportNumber = document.getElementById('passportNumber').value.toUpperCase();
        data.additionalNotes = (document.getElementById('additionalNotes')?.value || '').trim();

        // Normalize all dates to CE for certificate
        const era = window.Common.getEraFromForm('certificateForm');
        const toCE = (v) => v ? window.Common.convertDateString(v, era, window.Common.ERA_CE) : '';
        data.letterDate = toCE(data.letterDate);
        data.dob = toCE(data.dob);
        data._yearEra = era;

        localStorage.setItem('certificateDataForPrint', JSON.stringify(data));
        window.open('print-certificate.html', '_blank');
    }
});
