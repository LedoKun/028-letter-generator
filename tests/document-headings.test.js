const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../public/shared/pdf-generator.js');
require('../public/shared/pdf-templates.js');

const { buildFreeForm, buildMedicationCertificate, buildMedicalCertificate, buildReferral } = global.window.PdfTemplates;

function textValue(value) {
    if (value === null || typeof value === 'undefined') return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(textValue).join('');
    if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'text')) return textValue(value.text);
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

test('all generated documents use the memo heading and recipient', () => {
    const documents = [
        buildFreeForm({ letterDate: '16/07/2569', letterBody: 'เนื้อหา' }),
        buildMedicationCertificate({ patientName: 'Patient' }),
        buildMedicalCertificate({}),
        buildReferral({ patientName: 'Patient' })
    ];

    documents.forEach(content => {
        assert.equal(textValue(content[0].text), 'บันทึกข้อความ');
        assert.ok(paragraphTexts(content).includes('เรียนเจ้าหน้าที่ผู้เกี่ยวข้อง'));
    });
});

test('free-form title and recipient remain editable', () => {
    const content = buildFreeForm({
        documentTitle: 'CUSTOM MEMO',
        addressee: 'ผู้รับหนังสือ',
        letterBody: 'เนื้อหา'
    });
    const paragraphs = paragraphTexts(content);

    assert.equal(textValue(content[0].text), 'CUSTOM MEMO');
    assert.ok(paragraphs.includes('เรียนผู้รับหนังสือ'));
});

test('medication certificate uses concise paired Thai and English wording', () => {
    const paragraphs = paragraphTexts(buildMedicationCertificate({
        letterDate: '16/07/2026',
        salutation: 'MR.',
        patientName: 'JOHN DOE',
        nationality: 'THAI',
        passportNumber: 'AB1234',
        dob: '01/01/1990',
        includeMedications: true,
        artMedications: [{ medication: 'DOLUTEGRAVIR' }],
        doctorNameEnglish: 'TEST DOCTOR',
        medicalLicense: '12345',
        additionalNotes: 'For personal use'
    }));
    const output = paragraphs.join('\n');

    assert.ok(paragraphs.includes('วันที่ / Date: 16/07/2569 (16/07/2026)'));
    assert.ok(paragraphs.includes('ชื่อ-นามสกุล / Full name: MR. JOHN DOE    สัญชาติ / Nationality: THAI'));
    assert.ok(paragraphs.includes('วันเกิด / Date of birth: 01/01/2533 (01/01/1990)    เลขที่หนังสือเดินทาง / Passport no.: AB1234'));
    assert.match(output, /ผู้ป่วยจำเป็นต้องนำยารายการต่อไปนี้ติดตัวเพื่อใช้ในการรักษาระหว่างการเดินทาง/);
    assert.match(output, /The patient is required to carry the following medications for personal use during travel/);
    assert.match(output, /รายการยาปัจจุบัน \/ Current Medications/);
    assert.match(output, /หมายเหตุเพิ่มเติม \/ Additional notes/);
});

test('medical certificate uses formal paired clinical sentences', () => {
    const output = paragraphTexts(buildMedicalCertificate({
        letterDate: '16/07/2026',
        patientSalutation: 'นาย',
        patientSalutationEnglish: 'Mr.',
        patientName: 'สมชาย ใจดี',
        patientGender: 'ชาย',
        patientGenderEnglish: 'Male',
        patientAge: '30',
        includeConsultationDiagnosis: true,
        consultationDate: '16/07/2026',
        diagnosis: 'Acute gastroenteritis',
        includeAdvisedRest: true,
        restStartDate: '16/07/2026',
        restEndDate: '17/07/2026',
        restDurationDays: '2',
        includeSyphilisTreatment: true,
        syphilisTreatmentDate: '10/07/2026',
        includeTBTreatment: true,
        tbTreatmentCompletionDate: '01/06/2026',
        doctorNameThai: 'นพ. ทดสอบ ระบบ',
        doctorNameEnglish: 'TEST DOCTOR',
        medicalLicense: '12345'
    })).join('\n');

    assert.match(output, /ผู้ป่วยเข้ารับการตรวจรักษาเมื่อวันที่ 16\/07\/2569 และได้รับการวินิจฉัยว่า Acute gastroenteritis/);
    assert.match(output, /The patient was examined on 16\/07\/2026; diagnosis: Acute gastroenteritis/);
    assert.match(output, /มีความเห็นว่าควรพักรักษาตัวตั้งแต่วันที่/);
    assert.match(output, /Medical leave is advised from/);
    assert.match(output, /ผู้ป่วยได้รับการรักษาซิฟิลิสเมื่อวันที่/);
    assert.match(output, /ผู้ป่วยได้รับการรักษาวัณโรคครบถ้วนเมื่อวันที่/);
    assert.doesNotMatch(output, /วันที่เริ่มพัก/);
    assert.doesNotMatch(output, /เห็นสมควรให้พักรักษาตัว/);
    assert.doesNotMatch(output, /ผู้ป่วยได้ทำการ/);
    assert.doesNotMatch(output, /โปรด/);
});
