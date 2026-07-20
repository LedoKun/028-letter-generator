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
    const content = buildReferral(fullReferralData());
    const paragraphs = paragraphTexts(content);
    const output = paragraphs.join('\n');

    assert.match(output, /Retroviral infection/);
    assert.match(output, /ผลตรวจ HIV VL ล่าสุด \/ Latest HIV VL: <20 copies\/mL/);
    assert.match(output, /Active Syphilis/);
    assert.match(output, /HBV Co-Infection/);
    assert.match(output, /Suspected Mpox/);
    assert.match(output, /เริ่มมีอาการ 4 วัน/);
    assert.match(output, /ผื่น ตุ่ม หรือแผลบริเวณผิวหนังหรือเยื่อบุ/);
    assert.match(output, /ปวดบริเวณทวารหนักหรือมีอาการเข้าได้กับ proctitis/);
    assert.match(output, /อาการอื่น ๆ: คลื่นไส้/);
    assert.match(output, /ผู้ป่วยให้ประวัติว่ามีเพศสัมพันธ์กับผู้ที่สงสัยว่าเป็น mpox/);
    assert.match(output, /มีเพศสัมพันธ์กับคู่นอนหลายราย/);
    assert.match(output, /The patient reported sexual intercourse with a suspected mpox case/);
    assert.match(output, /สัมผัสผู้ป่วยระหว่างเดินทาง/);
    assert.doesNotMatch(output, /epidemiologic exposure/i);
    assert.doesNotMatch(output, /21 days before symptom onset/i);
    assert.match(output, /HCV Co-Infection/);
    assert.match(output, /Treated Syphilis/);
    assert.match(output, /Treated HCV/);
    assert.match(output, /Treated TB/);
    assert.match(output, /Completed TPT/);
    assert.match(output, /Ongoing TPT/);
    assert.match(output, /เดือน\/ปีที่เริ่ม TPT \/ TPT start month: 09\/2565 \(09\/2022\)/);
    assert.match(output, /เดือน\/ปีที่เริ่ม TPT \/ TPT start month: 09\/2568 \(09\/2025\)/);
    assert.match(output, /หมายเหตุ \/ Notes: ครบตามแผน/);
    assert.match(output, /หมายเหตุ \/ Notes: อยู่ระหว่างติดตาม/);
    assert.match(output, /ตำแหน่งของโรค: ปอด และ ต่อมน้ำเหลือง/);
    assert.match(output, /Disease site: pulmonary and lymph nodes/);
    assert.match(output, /Treatment record/);
    assert.match(output, /ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่/);
    assert.match(output, /พร้อมยาสำหรับใช้ต่อเนื่องอีก 60 วัน/);
    assert.match(output, /60-day supply/);
    assert.doesNotMatch(output, /HIV infection/i);
    assert.doesNotMatch(output, /1%%/);
    const expectedDiagnosisHeadings = [
        'Retroviral infection',
        'Active Syphilis',
        'Suspected Mpox',
        'HBV Co-Infection',
        'HCV Co-Infection',
        'Treated Syphilis',
        'Treated HCV',
        'Treated TB',
        'Completed TPT',
        'Ongoing TPT',
        'Other Medical History'
    ];
    const medicalSummary = content.find(node => node && Array.isArray(node.ul));
    const diagnosisHeadings = medicalSummary.ul.map(item => {
        const heading = item.stack ? item.stack[0] : item;
        return textValue(heading.text);
    });
    expectedDiagnosisHeadings.forEach((expected, index) => {
        assert.ok(diagnosisHeadings[index].startsWith(expected), expected);
        assert.doesNotMatch(
            diagnosisHeadings[index].slice(0, expected.length),
            /[\u0E00-\u0E7F]/,
            `${expected} heading must not contain Thai text`
        );
    });
});

test('keeps Thai and English referral prose in compact shared paragraphs', () => {
    const paragraphs = paragraphTexts(buildReferral(fullReferralData()));

    assert.ok(paragraphs.includes('เรียน เจ้าหน้าที่ผู้เกี่ยวข้อง / To whom it may concern,'));
    assert.ok(paragraphs.includes('วันที่ / Date: 16/07/2569 (16/07/2026)'));
    assert.ok(paragraphs.includes('เรื่อง ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ / Re: Referral for continued care'));
    assert.ok(paragraphs.includes('ชื่อผู้ป่วย / Patient name: ผู้ป่วย ทดสอบ'));
    assert.ok(paragraphs.includes('เลขประจำตัวประชาชน / National ID: 1-2345-67890-12-3    เลขที่หนังสือเดินทาง / Passport no.: AB1234'));
    assert.ok(paragraphs.includes('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ พร้อมรายละเอียดการรักษาโดยสรุปดังนี้ / We are referring this patient for continued care. The relevant clinical details are provided below.'));
    assert.ok(paragraphs.includes('จึงขอส่งผู้ป่วยรายนี้เพื่อพิจารณารับไว้รักษาในโรงพยาบาลของท่าน / Hospital admission is requested for further management.'));
    assert.ok(paragraphs.some(text => text.includes('เริ่มมีอาการ 4 วัน / Symptom onset: 4 days')));
    assert.ok(paragraphs.some(text => text.includes('อาการสำคัญ:') && text.includes('/ Presenting symptoms:')));
    assert.ok(paragraphs.some(text => text.includes('ผู้ป่วยให้ประวัติว่า') && text.includes('/ The patient reported')));
    assert.ok(paragraphs.includes('ขอแสดงความนับถือ / Respectfully,'));
    assert.ok(paragraphs.length < 65, `expected a compact referral, got ${paragraphs.length} text rows`);
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
    assert.doesNotMatch(output, /ผู้ป่วยได้รับยาไป/);
    assert.doesNotMatch(output, /เริ่ม \/ Started/);
    assert.doesNotMatch(output, /จ่ายยา \/ supplied for/);
    assert.doesNotMatch(output, /stale/);
    assert.doesNotMatch(output, /Retroviral infection/);
    assert.doesNotMatch(output, /Suspected mpox/);
    assert.doesNotMatch(output, /Medical Summary/);
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

    assert.match(output, /เริ่มมีอาการ 1 วัน/);
    assert.match(output, /Symptom onset: 1 day/);
    assert.doesNotMatch(output, /before referral|ก่อนส่งต่อ/);
    assert.match(output, /ผู้ป่วยไม่ให้ประวัติความเสี่ยง/);
    assert.match(output, /The patient did not report any risk factors/);
    assert.doesNotMatch(output, /listed risk factors|รายการข้างต้น/i);
    assert.doesNotMatch(output, /epidemiologic exposure/i);
});
