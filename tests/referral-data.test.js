const test = require('node:test');
const assert = require('node:assert/strict');

const ReferralData = require('../public/referral/referral-data.js');

function field(value = '', checked = false) {
    return { value, checked };
}

function select(value, text, selectedValues = []) {
    const options = [{ value, text }];
    return {
        value,
        options,
        selectedIndex: 0,
        selectedOptions: selectedValues.map(selectedValue => ({ value: selectedValue }))
    };
}

function artItem(medication, medicationText, tablets, time) {
    const elements = {
        'select[id^="artMedSelect-"]': select(medication, medicationText),
        'input[id^="artTablets-"]': field(tablets),
        'input[id^="artTime-"]': field(time)
    };
    return {
        querySelector(selector) {
            return elements[selector] || null;
        }
    };
}

function createForm(elements, artItems = []) {
    return {
        elements: {
            namedItem(id) {
                return elements[id] || null;
            }
        },
        ownerDocument: {
            getElementById(id) {
                return elements[id] || null;
            }
        },
        querySelectorAll(selector) {
            return selector === '#artMedicationsContainer .medication-item' ? artItems : [];
        }
    };
}

const common = {
    ERA_BE: 'BE',
    ERA_CE: 'CE',
    getEraFromForm(form) {
        return form.elements.namedItem('yearEra').value;
    },
    convertDateString(value, fromEra, toEra) {
        const [day, month, yearText] = value.split('/');
        let year = Number(yearText);
        if (fromEra === 'BE') year -= 543;
        if (toEra === 'BE') year += 543;
        return `${day}/${month}/${year}`;
    }
};

function fullElements() {
    const elements = {
        letterDate: field('16/07/2026'),
        yearEra: field('CE'),
        patientName: field('ผู้ป่วย ทดสอบ'),
        dob: field('01/01/1990'),
        nationalId: field('1-2345-67890-12-3'),
        passportNumber: field('ab1234'),
        letterType: field('referralForCare'),
        doctorNameThai: field('นพ. ทดสอบ ระบบ'),
        doctorNameEnglish: field('test doctor'),
        medicalLicense: field('12345'),
        additionalNotes: field('ติดตามผลตามดุลยพินิจ'),
        includeRetroviral: field('', true),
        includeSyphilisActive: field('', true),
        includeHBV: field('', true),
        includeHCVActive: field('', true),
        includeTreatedSyphilis: field('', true),
        includeTreatedHCV: field('', true),
        includeTreatedTB: field('', true),
        includeCompletedTPT: field('', true),
        includeOngoingTPT: field('', true),
        includeOtherHistory: field('', true),
        includeLastMedicinePickup: field('', true),
        includeReferralForAdmission: field('', true),
        attachmentLabResults: field('', true),
        attachmentOther: field('', true),
        includeTmxSmp: field('', true),
        napId: field('1234-567890'),
        firstDiagnosisDateRetro: field('02/02/2020'),
        artStartDate: field('03/03/2020'),
        initialCD4: field('12'),
        initialCD4Percent: field('1%'),
        initialCD4Date: field('04/04/2020'),
        adherence: field('>95%'),
        latestVL: field('<20'),
        latestVLDate: field('05/05/2026'),
        retroviralNotes: field('รับประทานยาสม่ำเสมอ'),
        tmxSmpTablets: field('2'),
        syphilisStartDate: field('06/06/2026'),
        syphilisMedication: select('Benzathine', 'Benzathine penicillin G 2.4 million units IM'),
        syphilisNotes: field('ติดตาม RPR'),
        syphilisDose1Date: { textContent: '06/06/2026' },
        syphilisDose2Date: { textContent: '13/06/2026' },
        syphilisDose3Date: { textContent: '20/06/2026' },
        treatedHCVMedication: field('SOF/VEL'),
        treatedHCVCompletionDate: field('07/07/2024'),
        treatedTBSitesSelect: select('', '', ['Pulmonary', 'Other']),
        treatedTBSitesOther: field('Lymph nodes'),
        treatedTBMedication: field('2HRZE/4HR'),
        treatedTBCompletionDate: field('08/08/2023'),
        completedTPTMedication: select('Other', 'Other'),
        completedTPTMedicationOther: field('3HR'),
        completedTPTStartDate: field('09/2022'),
        completedTPTNotes: field('ครบตามแผน'),
        ongoingTPTMedication: select('3HP', '3HP'),
        ongoingTPTMedicationOther: field('stale value'),
        ongoingTPTStartDate: field('09/09/2025'),
        ongoingTPTNotes: field('อยู่ระหว่างติดตาม'),
        otherMedicalHistory: field('Dyslipidemia'),
        lastMedicinePickupDate: field('10/07/2026'),
        medicineDuration: field('60'),
        attachmentOtherText: field('Treatment record')
    };
    return elements;
}

test('collects every selected referral section and normalizes CE dates to BE', () => {
    const form = createForm(fullElements(), [
        artItem('TDF/3TC/DTG', 'TDF/3TC/DTG', '1', '20:00'),
        artItem('DTG50', 'DTG (50mg)', '1', '')
    ]);

    const data = ReferralData.collect(form, common);

    assert.equal(data.letterDate, '16/07/2569');
    assert.equal(data.firstDiagnosisDateRetro, '02/02/2563');
    assert.equal(data.syphilisDose3Date, '20/06/2569');
    assert.equal(data.completedTPTStartDate, '09/2565');
    assert.equal(data.ongoingTPTStartDate, '09/09/2568');
    assert.equal(data.passportNumber, 'AB1234');
    assert.equal(data.doctorNameEnglish, 'TEST DOCTOR');
    assert.equal(data.includeHBV, true);
    assert.equal(data.includeHCVActive, true);
    assert.equal(data.includeTreatedSyphilis, true);
    assert.deepEqual(data.artMedications, [
        { medication: 'TDF/3TC/DTG', value: 'TDF/3TC/DTG', tablets: '1', time: '20:00' },
        { medication: 'DTG (50mg)', value: 'DTG50', tablets: '1', time: '' }
    ]);
    assert.equal(data.tmxSmpTablets, '2');
    assert.equal(data.treatedTBSites, 'Pulmonary, Lymph nodes');
    assert.equal(data.completedTPTMedicationText, '3HR');
    assert.equal(data.ongoingTPTMedicationText, '3HP');
    assert.equal(data.attachmentOtherText, 'Treatment record');
});

test('omits values belonging to unchecked sections', () => {
    const elements = fullElements();
    [
        'includeRetroviral',
        'includeSyphilisActive',
        'includeTreatedHCV',
        'includeTreatedTB',
        'includeCompletedTPT',
        'includeOngoingTPT',
        'includeOtherHistory',
        'includeLastMedicinePickup',
        'attachmentOther'
    ].forEach(id => {
        elements[id].checked = false;
    });

    const data = ReferralData.collect(
        createForm(elements, [artItem('TDF/3TC/DTG', 'TDF/3TC/DTG', '1', '20:00')]),
        common
    );

    assert.equal(data.includeTmxSmp, false);
    assert.equal(data.napId, undefined);
    assert.equal(data.artMedications, undefined);
    assert.equal(data.syphilisStartDate, undefined);
    assert.equal(data.treatedHCVMedication, undefined);
    assert.equal(data.treatedTBSites, undefined);
    assert.equal(data.completedTPTMedicationText, undefined);
    assert.equal(data.ongoingTPTMedicationText, undefined);
    assert.equal(data.otherMedicalHistory, undefined);
    assert.equal(data.lastMedicinePickupDate, undefined);
    assert.equal(data.attachmentOtherText, undefined);
});
