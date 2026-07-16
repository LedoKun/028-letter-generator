(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.ReferralData = api;
})(typeof window !== 'undefined' ? window : null, function () {
    const CHECKBOX_IDS = [
        'includeRetroviral',
        'includeSyphilisActive',
        'includeSuspectedMpox',
        'includeHBV',
        'includeHCVActive',
        'includeTreatedSyphilis',
        'includeTreatedHCV',
        'includeTreatedTB',
        'includeCompletedTPT',
        'includeOngoingTPT',
        'includeOtherHistory',
        'includeLastMedicinePickup',
        'includeReferralForAdmission',
        'attachmentLabResults',
        'attachmentOther',
        'includeTmxSmp'
    ];

    const MPOX_SYMPTOM_OPTIONS = [
        { id: 'mpoxSymptomRashLesions', value: 'rashLesions' },
        { id: 'mpoxSymptomFeverChills', value: 'feverChills' },
        { id: 'mpoxSymptomLymphadenopathy', value: 'lymphadenopathy' },
        { id: 'mpoxSymptomHeadache', value: 'headache' },
        { id: 'mpoxSymptomMyalgiaBackPain', value: 'myalgiaBackPain' },
        { id: 'mpoxSymptomFatigue', value: 'fatigue' },
        { id: 'mpoxSymptomRespiratory', value: 'respiratory' },
        { id: 'mpoxSymptomProctitis', value: 'proctitis' },
        { id: 'mpoxSymptomDysuria', value: 'dysuria' },
        { id: 'mpoxSymptomOther', value: 'other' }
    ];

    const MPOX_RISK_OPTIONS = [
        { id: 'mpoxRiskDirectContact', value: 'directContact' },
        { id: 'mpoxRiskIntimateContact', value: 'intimateContact' },
        { id: 'mpoxRiskSexualPartners', value: 'sexualPartners' },
        { id: 'mpoxRiskHouseholdCloseContact', value: 'householdCloseContact' },
        { id: 'mpoxRiskContaminatedItems', value: 'contaminatedItems' },
        { id: 'mpoxRiskOccupational', value: 'occupational' },
        { id: 'mpoxRiskAnimal', value: 'animal' },
        { id: 'mpoxRiskNoneKnown', value: 'noneKnown' },
        { id: 'mpoxRiskOther', value: 'other' }
    ];

    const BASE_VALUE_IDS = [
        'letterDate',
        'yearEra',
        'patientName',
        'dob',
        'nationalId',
        'passportNumber',
        'letterType',
        'doctorNameThai',
        'doctorNameEnglish',
        'medicalLicense',
        'additionalNotes'
    ];

    function getElement(form, id) {
        if (form.elements && typeof form.elements.namedItem === 'function') {
            const element = form.elements.namedItem(id);
            if (element) return element;
        }
        return form.ownerDocument ? form.ownerDocument.getElementById(id) : null;
    }

    function getValue(form, id) {
        const element = getElement(form, id);
        return element && typeof element.value !== 'undefined' ? String(element.value).trim() : '';
    }

    function getText(form, id) {
        const element = getElement(form, id);
        return element ? String(element.textContent || '').trim() : '';
    }

    function getSelectedText(form, id) {
        const element = getElement(form, id);
        if (!element || !element.options || element.selectedIndex < 0) return '';
        return String(element.options[element.selectedIndex].text || '').trim();
    }

    function copyValues(data, form, ids) {
        ids.forEach(id => {
            const value = getValue(form, id);
            if (value) data[id] = value;
        });
    }

    function collectCheckedValues(form, options) {
        return options
            .filter(option => {
                const element = getElement(form, option.id);
                return !!(element && element.checked);
            })
            .map(option => option.value);
    }

    function collectArtMedications(form) {
        return Array.from(form.querySelectorAll('#artMedicationsContainer .medication-item'))
            .map(item => {
                const medication = item.querySelector('select[id^="artMedSelect-"]');
                const tablets = item.querySelector('input[id^="artTablets-"]');
                const time = item.querySelector('input[id^="artTime-"]');
                if (!medication || !medication.value) return null;
                return {
                    medication: String(medication.options[medication.selectedIndex].text || '').trim(),
                    value: String(medication.value).trim(),
                    tablets: tablets ? String(tablets.value || '').trim() : '',
                    time: time ? String(time.value || '').trim() : ''
                };
            })
            .filter(Boolean);
    }

    function collectTpt(data, form, prefix) {
        const selectId = `${prefix}TPTMedication`;
        const otherId = `${prefix}TPTMedicationOther`;
        const selectedValue = getValue(form, selectId);
        const otherValue = getValue(form, otherId);
        data[selectId] = selectedValue;
        data[`${prefix}TPTMedicationText`] = selectedValue === 'Other'
            ? otherValue
            : getSelectedText(form, selectId);
        if (otherValue) data[otherId] = otherValue;
        copyValues(data, form, [`${prefix}TPTStartDate`, `${prefix}TPTNotes`]);
    }

    function normalizeDates(data, common, era) {
        const toBE = value => value
            ? common.convertDateString(value, era, common.ERA_BE)
            : '';
        const partialToBE = value => {
            if (!value) return '';
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return toBE(value);
            const match = value.match(/^(\d{2})\/(\d{4})$/);
            if (!match) return value;
            const year = parseInt(match[2], 10);
            if (Number.isNaN(year)) return value;
            return era === common.ERA_CE ? `${match[1]}/${year + 543}` : value;
        };

        [
            'letterDate',
            'dob',
            'firstDiagnosisDateRetro',
            'artStartDate',
            'initialCD4Date',
            'latestVLDate',
            'syphilisStartDate',
            'syphilisDose1Date',
            'syphilisDose2Date',
            'syphilisDose3Date',
            'treatedHCVCompletionDate',
            'treatedTBCompletionDate',
            'lastMedicinePickupDate'
        ].forEach(id => {
            if (data[id]) data[id] = toBE(data[id]);
        });
        ['completedTPTStartDate', 'ongoingTPTStartDate'].forEach(id => {
            if (data[id]) data[id] = partialToBE(data[id]);
        });
    }

    function collect(form, common) {
        const data = {};
        copyValues(data, form, BASE_VALUE_IDS);

        CHECKBOX_IDS.forEach(id => {
            const element = getElement(form, id);
            data[id] = !!(element && element.checked);
        });

        if (data.includeRetroviral) {
            copyValues(data, form, [
                'napId',
                'firstDiagnosisDateRetro',
                'artStartDate',
                'initialCD4',
                'initialCD4Percent',
                'initialCD4Date',
                'adherence',
                'latestVL',
                'latestVLDate',
                'retroviralNotes'
            ]);
            data.artMedications = collectArtMedications(form);
            if (data.includeTmxSmp) copyValues(data, form, ['tmxSmpTablets']);
        } else {
            data.includeTmxSmp = false;
        }

        if (data.includeSyphilisActive) {
            copyValues(data, form, ['syphilisStartDate', 'syphilisMedication', 'syphilisNotes']);
            data.syphilisMedicationText = getSelectedText(form, 'syphilisMedication');
            if (!data.syphilisMedication || data.syphilisMedication === 'Benzathine') {
                data.syphilisDose1Date = getText(form, 'syphilisDose1Date');
                data.syphilisDose2Date = getText(form, 'syphilisDose2Date');
                data.syphilisDose3Date = getText(form, 'syphilisDose3Date');
            } else {
                data.syphilisDuration = data.syphilisMedication === 'Doxycycline2Weeks' ? '14 days' : '28 days';
            }
        }

        if (data.includeSuspectedMpox) {
            copyValues(data, form, ['mpoxSymptomDurationDays']);
            data.mpoxSymptoms = collectCheckedValues(form, MPOX_SYMPTOM_OPTIONS);
            data.mpoxRiskFactors = collectCheckedValues(form, MPOX_RISK_OPTIONS);
            if (data.mpoxSymptoms.includes('other')) {
                copyValues(data, form, ['mpoxSymptomOtherText']);
            }
            if (data.mpoxRiskFactors.includes('other')) {
                copyValues(data, form, ['mpoxRiskOtherText']);
            }
        }

        if (data.includeTreatedHCV) {
            copyValues(data, form, ['treatedHCVMedication', 'treatedHCVCompletionDate']);
        }

        if (data.includeTreatedTB) {
            const sites = getElement(form, 'treatedTBSitesSelect');
            const selectedSites = sites
                ? Array.from(sites.selectedOptions).map(option => option.value)
                : [];
            const otherSites = getValue(form, 'treatedTBSitesOther')
                .split(',')
                .map(site => site.trim())
                .filter(Boolean);
            data.treatedTBSiteValues = selectedSites.filter(site => site !== 'Other');
            data.treatedTBSitesOther = selectedSites.includes('Other') ? otherSites.join(', ') : '';
            data.treatedTBSites = data.treatedTBSiteValues
                .concat(data.treatedTBSitesOther ? [data.treatedTBSitesOther] : [])
                .join(', ');
            copyValues(data, form, ['treatedTBMedication', 'treatedTBCompletionDate']);
        }

        if (data.includeCompletedTPT) collectTpt(data, form, 'completed');
        if (data.includeOngoingTPT) collectTpt(data, form, 'ongoing');
        if (data.includeOtherHistory) copyValues(data, form, ['otherMedicalHistory']);
        if (data.includeLastMedicinePickup) {
            copyValues(data, form, ['lastMedicinePickupDate', 'medicineDuration']);
        }
        if (data.attachmentOther) copyValues(data, form, ['attachmentOtherText']);

        data.doctorNameEnglish = String(data.doctorNameEnglish || '').toUpperCase();
        data.passportNumber = String(data.passportNumber || '').toUpperCase();

        const era = common.getEraFromForm(form);
        normalizeDates(data, common, era);
        data._yearEra = era;
        return data;
    }

    function validateMpox(data) {
        if (!data || !data.includeSuspectedMpox) return [];

        const errors = [];
        const duration = String(data.mpoxSymptomDurationDays || '').trim();
        const symptoms = Array.isArray(data.mpoxSymptoms) ? data.mpoxSymptoms : [];
        const riskFactors = Array.isArray(data.mpoxRiskFactors) ? data.mpoxRiskFactors : [];

        if (!duration) {
            errors.push({ fieldId: 'mpoxSymptomDurationDays', code: 'durationRequired' });
        } else if (!/^[1-9]\d*$/.test(duration)) {
            errors.push({ fieldId: 'mpoxSymptomDurationDays', code: 'durationInvalid' });
        }
        if (!symptoms.length) {
            errors.push({ fieldId: 'mpoxSymptomsGroup', code: 'symptomRequired' });
        }
        if (symptoms.includes('other') && !String(data.mpoxSymptomOtherText || '').trim()) {
            errors.push({ fieldId: 'mpoxSymptomOtherText', code: 'symptomOtherRequired' });
        }
        if (!riskFactors.length) {
            errors.push({ fieldId: 'mpoxRiskFactorsGroup', code: 'riskRequired' });
        }
        if (riskFactors.includes('noneKnown') && riskFactors.length > 1) {
            errors.push({ fieldId: 'mpoxRiskFactorsGroup', code: 'riskConflict' });
        }
        if (riskFactors.includes('other') && !String(data.mpoxRiskOtherText || '').trim()) {
            errors.push({ fieldId: 'mpoxRiskOtherText', code: 'riskOtherRequired' });
        }

        return errors;
    }

    return {
        CHECKBOX_IDS,
        MPOX_SYMPTOM_OPTIONS,
        MPOX_RISK_OPTIONS,
        collect,
        validateMpox
    };
});
