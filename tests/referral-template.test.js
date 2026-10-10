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

function flatten(node, out = []) {
    if (Array.isArray(node)) {
        node.forEach(item => flatten(item, out));
        return out;
    }
    if (node === null || typeof node !== 'object') return out;
    out.push(node);
    if (node.stack) flatten(node.stack, out);
    if (node.ul) flatten(node.ul, out);
    return out;
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
    assert.match(output, /ART adherence >95%/);
    assert.match(output, /The patient reported ART adherence of >95%\./);
    assert.doesNotMatch(output, /ผู้ป่วยรายงานความสม่ำเสมอในการรับประทาน ART เท่ากับ/);
    assert.match(output, /ผลตรวจ HIV VL ล่าสุดเท่ากับ <20 copies\/mL ตรวจเมื่อวันที่ 05\/05\/2569/);
    assert.match(output, /The latest HIV VL was <20 copies\/mL, measured on 05\/05\/2026\./);
    assert.match(output, /Active Syphilis/);
    assert.match(output, /HBV Co-Infection/);
    assert.match(output, /Suspected Mpox/);
    assert.match(output, /ผู้ป่วยเริ่มมีอาการมาแล้ว 4 วัน/);
    assert.match(output, /ผื่น ตุ่ม หรือแผลบริเวณผิวหนังหรือเยื่อบุ/);
    assert.match(output, /ปวดบริเวณทวารหนักหรือมีอาการเข้าได้กับ proctitis/);
    assert.match(output, /อาการอื่น ๆ: คลื่นไส้/);
    assert.match(output, /ผู้ป่วยให้ประวัติว่า มีเพศสัมพันธ์กับผู้ที่สงสัยว่าเป็น mpox/);
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
    assert.match(output, /เริ่ม TPT เมื่อเดือน 09\/2565/);
    assert.match(output, /TPT was started in 09\/2022\./);
    assert.match(output, /เริ่ม TPT เมื่อเดือน 09\/2568/);
    assert.match(output, /TPT was started in 09\/2025\./);
    assert.match(output, /หมายเหตุ: ครบตามแผน/);
    assert.match(output, /Notes: ครบตามแผน/);
    assert.match(output, /หมายเหตุ: อยู่ระหว่างติดตาม/);
    assert.match(output, /Notes: อยู่ระหว่างติดตาม/);
    assert.match(output, /ตำแหน่งของโรค: ปอด และ ต่อมน้ำเหลือง/);
    assert.match(output, /Disease site: pulmonary and lymph nodes/);
    assert.match(output, /Treatment record/);
    assert.match(output, /ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ 10\/07\/2569 โดยมียาเพียงพอสำหรับ 60 วัน/);
    assert.match(output, /The patient last collected medication on 10\/07\/2026, with a 60-day supply\./);
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
    const flat = flatten(buildReferral(fullReferralData()));
    const titleIndex = flat.findIndex(node => node && node.text && textValue(node.text) === 'สรุปประวัติการรักษา');
    assert.ok(titleIndex >= 0, 'Thai medical summary title should exist');
    const summaryUl = flat.slice(titleIndex).find(node => node && Array.isArray(node.ul));
    assert.ok(summaryUl, 'Thai medical summary list should exist');
    const diagnosisHeadings = summaryUl.ul.map(item => {
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

test('stacks full Thai referral text before full English text', () => {
    const output = paragraphTexts(buildReferral(fullReferralData())).join('\n');

    assert.ok(output.indexOf('เรียน เจ้าหน้าที่ผู้เกี่ยวข้อง') < output.indexOf('To Whom It May Concern:'));
    assert.ok(output.indexOf('เรื่อง ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ') < output.indexOf('Re: Referral for Continued Care'));
    assert.match(output, /ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ พร้อมสรุปข้อมูลการรักษาที่เกี่ยวข้องดังต่อไปนี้/);
    assert.match(output, /Public Health Center 28 Krung Thon Buri hereby refers this patient for continued care\. The relevant clinical information is summarized below\./);
    assert.match(output, /ชื่อผู้ป่วย: ผู้ป่วย ทดสอบ/);
    assert.match(output, /Patient name: ผู้ป่วย ทดสอบ/);
    assert.match(output, /เลขประจำตัวประชาชน: 1-2345-67890-12-3/);
    assert.match(output, /จึงเรียนมาเพื่อโปรดพิจารณารับผู้ป่วยรายนี้เข้ารับการรักษาในโรงพยาบาลของท่าน/);
    assert.match(output, /We would be grateful if you would consider admitting this patient for further hospital care\./);
    assert.match(output, /ขอแสดงความนับถือ \/ Respectfully,/);
    assert.match(output, /วันที่ \/ Date: 16\/07\/2569 \(16\/07\/2026\)/);
});

test('states the primary referral intent explicitly', () => {
    const output = paragraphTexts(buildReferral({
        letterType: 'referralForCare',
        letterDate: '16/07/2569',
        patientName: 'Mpox Patient',
        referralIntents: ['specializedCare'],
        referralIntentCustom: 'MPox care and treatment'
    })).join('\n');

    assert.match(output, /จึงส่งผู้ป่วยรายนี้เพื่อ การดูแลรักษาเฉพาะทาง และ MPox care and treatment พร้อมสรุปข้อมูลการรักษาที่เกี่ยวข้องดังต่อไปนี้/);
    assert.match(output, /hereby refers this patient for continued care in relation to specialized care and management and MPox care and treatment\. The relevant clinical information is summarized below\./);
    assert.match(output, /เรื่อง ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ/);
    assert.match(output, /Re: Referral for Continued Care/);
    assert.doesNotMatch(output, /เรื่อง จุดประสงค์การส่งต่อ|Re: Referral purpose/);
});

test('uses predefined referral intents when no custom intent is given', () => {
    const output = paragraphTexts(buildReferral({
        letterType: 'referralForCare',
        letterDate: '16/07/2569',
        patientName: 'Patient',
        referralIntents: ['hcvCareTreatment']
    })).join('\n');

    assert.match(output, /จึงส่งผู้ป่วยรายนี้เพื่อ การดูแลรักษาการติดเชื้อ HCV/);
    assert.match(output, /continued care in relation to HCV care and treatment/);
});

test('renders every specific purpose alongside the default continued-care option', () => {
    const output = paragraphTexts(buildReferral({
        letterDate: '16/07/2569',
        patientName: 'Patient',
        referralIntents: ['continuedCare', 'diagnosticEvaluation', 'tbCareTreatment']
    })).join('\n');

    assert.match(output, /จึงส่งผู้ป่วยรายนี้เพื่อ การตรวจวินิจฉัยเพิ่มเติม และ การรักษาวัณโรค/);
    assert.match(output, /continued care in relation to further diagnostic evaluation and TB treatment/);
    assert.equal(textValue(buildReferral({ referralIntents: ['tbCareTreatment'] })[1].text), 'บันทึกข้อความ / Referral Letter');
});

test('uses continued care as the generic default referral purpose', () => {
    const output = paragraphTexts(buildReferral({
        patientName: 'Patient',
        referralIntents: ['continuedCare']
    })).join('\n');

    assert.match(output, /เรื่อง ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ/);
    assert.match(output, /Re: Referral for Continued Care/);
    assert.doesNotMatch(output, /เพื่อรับการรักษาต่อเพื่อ|continued care for [a-z]/);
    assert.match(output, /ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ/);
    assert.match(output, /hereby refers this patient for continued care/);
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
    assert.match(output, /Re: Medical Summary/);
    assert.match(output, /กรุณาติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรี หากต้องการข้อมูลเพิ่มเติม/);
    assert.match(output, /Please contact Public Health Center 28 Krung Thon Buri if further information is required\./);
});

test('keeps medication pickup details inside the HIV section', () => {
    const content = buildReferral(fullReferralData());
    const hivSections = flatten(content).filter(node => node && Array.isArray(node.stack)
        && textValue(node.stack[0]?.text).startsWith('Retroviral infection'));
    const output = hivSections.map(section => paragraphTexts(section).join('\n')).join('\n');

    assert.match(output, /ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่/);
    assert.match(output, /The patient last collected medication on/);
});

test('labels other-medication quantities as tablets, bottles, or units', () => {
    const output = paragraphTexts(buildReferral({
        patientName: 'Patient',
        otherMedications: [{ name: 'Fluconazole', strength: '200 mg', schedule: 'OD', quantity: '28' }]
    })).join('\n');

    assert.match(output, /จำนวน 28 เม็ด\/ขวด\/หน่วย/);
    assert.match(output, /quantity: 28 tablets\/bottles\/units/);
    assert.doesNotMatch(output, /Quantity\/Duration|เป็นเวลา 28|for 28/);
});

test('does not render a duration for the current ART regimen', () => {
    const output = paragraphTexts(buildReferral({
        patientName: 'Patient',
        includeRetroviral: true,
        artMedications: [{ medication: 'TDF/3TC/DTG', tablets: '1', time: '20:00', days: '90' }]
    })).join('\n');

    assert.match(output, /TDF\/3TC\/DTG 1 เม็ด เวลา 20:00 น\./);
    assert.doesNotMatch(output, /90 วัน|for 90 days/);
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

    assert.match(output, /ผู้ป่วยเริ่มมีอาการมาแล้ว 1 วัน/);
    assert.match(output, /Symptoms began 1 day ago\./);
    assert.doesNotMatch(output, /before referral|ก่อนส่งต่อ/);
    assert.match(output, /ผู้ป่วยไม่ให้ประวัติความเสี่ยง/);
    assert.match(output, /The patient did not report any risk factors/);
    assert.doesNotMatch(output, /listed risk factors|รายการข้างต้น/i);
    assert.doesNotMatch(output, /epidemiologic exposure/i);
});
