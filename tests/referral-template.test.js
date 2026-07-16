const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../public/shared/pdf-generator.js');
require('../public/shared/pdf-templates.js');

const buildReferral = global.window.PdfTemplates.buildReferral;

function textValue(value) {
    if (value === null || typeof value === 'undefined') return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(textValue).join('');
    if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'text')) {
        return textValue(value.text);
    }
    return '';
}

function paragraphTexts(node, result = []) {
    if (node === null || typeof node === 'undefined') return result;
    if (Array.isArray(node)) {
        node.forEach(item => paragraphTexts(item, result));
        return result;
    }
    if (typeof node !== 'object') return result;
    if (Object.prototype.hasOwnProperty.call(node, 'text')) result.push(textValue(node.text));
    if (node.stack) paragraphTexts(node.stack, result);
    if (node.ul) paragraphTexts(node.ul, result);
    return result;
}

function fullReferralData() {
    return {
        letterType: 'referralForCare',
        letterDate: '16/07/2569',
        patientName: 'ผู้ป่วย ทดสอบ',
        dob: '01/01/2533',
        nationalId: '1-2345-67890-12-3',
        passportNumber: 'AB1234',
        includeRetroviral: true,
        napId: '1234-567890',
        firstDiagnosisDateRetro: '02/02/2563',
        artStartDate: '03/03/2563',
        initialCD4: '12',
        initialCD4Percent: '1%',
        initialCD4Date: '04/04/2563',
        adherence: '>95%',
        latestVL: '<20',
        latestVLDate: '05/05/2569',
        artMedications: [
            { medication: 'TDF/3TC/DTG', tablets: '1', time: '20:00' }
        ],
        includeTmxSmp: true,
        tmxSmpTablets: '2',
        retroviralNotes: 'รับประทานยาสม่ำเสมอ',
        includeSyphilisActive: true,
        syphilisStartDate: '06/06/2569',
        syphilisMedication: 'Benzathine',
        syphilisMedicationText: 'Benzathine penicillin G 2.4 million units IM',
        syphilisDose1Date: '06/06/2569',
        syphilisDose2Date: '13/06/2569',
        syphilisDose3Date: '20/06/2569',
        syphilisNotes: 'ติดตาม RPR',
        includeSuspectedMpox: true,
        mpoxSymptomDurationDays: '4',
        mpoxSymptoms: ['rashLesions', 'feverChills', 'proctitis', 'other'],
        mpoxSymptomOtherText: 'คลื่นไส้',
        mpoxRiskFactors: ['intimateContact', 'sexualPartners', 'other'],
        mpoxRiskOtherText: 'สัมผัสผู้ป่วยระหว่างเดินทาง',
        includeHBV: true,
        includeHCVActive: true,
        includeTreatedSyphilis: true,
        includeTreatedHCV: true,
        treatedHCVMedication: 'SOF/VEL',
        treatedHCVCompletionDate: '07/07/2567',
        includeTreatedTB: true,
        treatedTBSites: 'Pulmonary, Lymph nodes',
        treatedTBMedication: '2HRZE/4HR',
        treatedTBCompletionDate: '08/08/2566',
        includeCompletedTPT: true,
        completedTPTMedicationText: '3HR',
        completedTPTStartDate: '09/2565',
        completedTPTNotes: 'ครบตามแผน',
        includeOngoingTPT: true,
        ongoingTPTMedicationText: '3HP',
        ongoingTPTStartDate: '09/2568',
        ongoingTPTNotes: 'อยู่ระหว่างติดตาม',
        includeOtherHistory: true,
        otherMedicalHistory: 'Dyslipidemia',
        includeLastMedicinePickup: true,
        lastMedicinePickupDate: '10/07/2569',
        medicineDuration: '60',
        attachmentLabResults: true,
        attachmentOther: true,
        attachmentOtherText: 'Treatment record',
        includeReferralForAdmission: true,
        doctorNameThai: 'นพ. ทดสอบ ระบบ',
        doctorNameEnglish: 'TEST DOCTOR',
        medicalLicense: '12345',
        additionalNotes: 'ติดตามผลตามดุลยพินิจ'
    };
}

test('renders all selected conditions with concise clinical wording', () => {
    const paragraphs = paragraphTexts(buildReferral(fullReferralData()));
    const output = paragraphs.join('\n');

    assert.match(output, /Retroviral infection/);
    assert.match(output, /ผลตรวจ HIV VL ล่าสุด \/ Latest HIV VL/);
    assert.match(output, /HBV co-infection/);
    assert.match(output, /สงสัยโรคฝีดาษวานร \/ Suspected mpox/);
    assert.match(output, /เริ่มมีอาการ 4 วันก่อนส่งต่อ/);
    assert.match(output, /ผื่น ตุ่ม หรือแผลบริเวณผิวหนังหรือเยื่อบุ/);
    assert.match(output, /ปวดบริเวณทวารหนักหรือมีอาการเข้าได้กับ proctitis/);
    assert.match(output, /อาการอื่น ๆ: คลื่นไส้/);
    assert.match(output, /ผู้ป่วยให้ประวัติว่ามีเพศสัมพันธ์กับผู้ที่สงสัยว่าเป็น mpox/);
    assert.match(output, /มีเพศสัมพันธ์กับคู่นอนหลายราย/);
    assert.match(output, /The patient reported sexual intercourse with a suspected mpox case/);
    assert.match(output, /สัมผัสผู้ป่วยระหว่างเดินทาง/);
    assert.doesNotMatch(output, /epidemiologic exposure/i);
    assert.doesNotMatch(output, /21 days before symptom onset/i);
    assert.match(output, /Untreated HCV co-infection/);
    assert.match(output, /Treated syphilis/);
    assert.match(output, /Treated HCV/);
    assert.match(output, /Treated TB/);
    assert.match(output, /Completed TPT/);
    assert.match(output, /Ongoing TPT/);
    assert.match(output, /Pulmonary, Lymph nodes/);
    assert.match(output, /Treatment record/);
    assert.match(output, /ผู้ป่วยได้รับยาครั้งล่าสุดเมื่อวันที่/);
    assert.match(output, /60-day supply/);
    assert.doesNotMatch(output, /HIV infection/i);
    assert.doesNotMatch(output, /1%%/);
});

test('keeps Thai and English referral prose on separate lines', () => {
    const paragraphs = paragraphTexts(buildReferral(fullReferralData()));

    assert.ok(paragraphs.includes('เรียนเจ้าหน้าที่ผู้เกี่ยวข้อง'));
    assert.ok(paragraphs.includes('เรื่อง ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ'));
    assert.ok(paragraphs.includes('Re: Referral for continued care'));
    assert.ok(paragraphs.includes('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ พร้อมรายละเอียดการรักษาโดยสรุปดังนี้'));
    assert.ok(paragraphs.includes('We are referring this patient for continued care. The relevant clinical details are provided below.'));
    assert.ok(paragraphs.includes('จึงขอส่งผู้ป่วยรายนี้เพื่อพิจารณารับไว้รักษาในโรงพยาบาลของท่าน'));
    assert.ok(paragraphs.includes('Hospital admission is requested for further management.'));
});

test('excludes translation-like Thai wording and unselected stale values', () => {
    const data = {
        letterType: 'summaryOfHistory',
        letterDate: '16/07/2569',
        patientName: 'Minimal Patient',
        includeRetroviral: false,
        napId: 'stale',
        includeSuspectedMpox: false,
        mpoxSymptomDurationDays: '7',
        mpoxSymptoms: ['rashLesions'],
        mpoxRiskFactors: ['directContact'],
        includeHBV: false,
        includeHCVActive: false,
        includeTreatedSyphilis: false,
        includeOtherHistory: false,
        otherMedicalHistory: 'stale history',
        includeLastMedicinePickup: false,
        lastMedicinePickupDate: '10/07/2569',
        medicineDuration: '60',
        attachmentLabResults: false,
        attachmentOther: false,
        attachmentOtherText: 'stale attachment',
        includeReferralForAdmission: false,
        doctorNameThai: 'นพ. ทดสอบ ระบบ'
    };
    const output = paragraphTexts(buildReferral(data)).join('\n');

    assert.doesNotMatch(output, /โปรด/);
    assert.doesNotMatch(output, /ได้รับยาครอบคลุมเป็นเวลา/);
    assert.doesNotMatch(output, /เริ่ม \/ Started/);
    assert.doesNotMatch(output, /จ่ายยา \/ supplied for/);
    assert.doesNotMatch(output, /stale/);
    assert.doesNotMatch(output, /Retroviral infection/);
    assert.doesNotMatch(output, /Suspected mpox/);
    assert.doesNotMatch(output, /Clinical Summary/);
    assert.match(output, /หากต้องการข้อมูลเพิ่มเติม สามารถติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรีได้/);
});

test('renders the concise no-known-exposure Mpox wording', () => {
    const data = {
        letterType: 'referralForCare',
        letterDate: '16/07/2569',
        patientName: 'Mpox Patient',
        includeSuspectedMpox: true,
        mpoxSymptomDurationDays: '1',
        mpoxSymptoms: ['rashLesions'],
        mpoxRiskFactors: ['noneKnown'],
        doctorNameThai: 'นพ. ทดสอบ ระบบ'
    };
    const output = paragraphTexts(buildReferral(data)).join('\n');

    assert.match(output, /เริ่มมีอาการ 1 วันก่อนส่งต่อ/);
    assert.match(output, /Symptom onset: 1 day before referral/);
    assert.match(output, /ผู้ป่วยไม่รายงานข้อมูลความเสี่ยงข้างต้น/);
    assert.match(output, /The patient did not report any of the listed risk factors/);
    assert.doesNotMatch(output, /epidemiologic exposure/i);
});
