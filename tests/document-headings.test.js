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

test('referral and free-form documents use their professional headings', () => {
    const freeForm = buildFreeForm({ letterDate: '16/07/2569', letterBody: 'เนื้อหา' });
    const consultation = buildReferral({ patientName: 'Patient' });
    const referral = buildReferral({ patientName: 'Patient', letterType: 'referralForCare' });

    assert.equal(textValue(freeForm[1].text), 'บันทึกข้อความ / Medical Notes');
    assert.equal(textValue(consultation[1].text), 'บันทึกข้อความ / Medical Consultation Letter');
    assert.equal(textValue(referral[1].text), 'บันทึกข้อความ / Referral Letter');
});

test('medication certificate uses an unambiguous travel-document heading', () => {
    const content = buildMedicationCertificate({ patientName: 'Patient' });
    assert.equal(textValue(content[1].text), 'หนังสือรับรองการพกยา / Medication Certificate for Travel');
    assert.doesNotMatch(textValue(content[1].text), /บันทึกข้อความ/);
});

test('medical certificate uses the paired Thai and English certificate heading', () => {
    const content = buildMedicalCertificate({});

    assert.equal(textValue(content[1].text), 'ใบรับรองแพทย์ / Medical Certificate');
    assert.doesNotMatch(textValue(content[1].text), /บันทึกข้อความ/);
    assert.ok(paragraphTexts(content).includes('เรียน เจ้าหน้าที่ผู้เกี่ยวข้อง'));
    assert.ok(paragraphTexts(content).includes('To Whom It May Concern:'));
});

test('document dates preserve and localize MM/YYYY input', () => {
    const thai = paragraphTexts(buildMedicalCertificate({ letterDate: '07/2026', language: 'th' }));
    const english = paragraphTexts(buildMedicalCertificate({ letterDate: '07/2569', language: 'en' }));

    assert.ok(thai.includes('วันที่: 07/2569'));
    assert.ok(english.includes('Date: 07/2026'));
});

test('documents place the date before the body and keep signatures left aligned', () => {
    const documents = [
        {
            content: buildMedicalCertificate({
            doctorNameThai: 'นพ. ทดสอบ ระบบ',
            doctorNameEnglish: 'TEST DOCTOR',
            medicalLicense: '12345',
            letterDate: '16/07/2026'
            }),
            date: 'วันที่ / Date: 16/07/2569 (16/07/2026)'
        },
        {
            content: buildMedicationCertificate({
            doctorNameEnglish: 'TEST DOCTOR',
            medicalLicense: '12345',
            letterDate: '16/07/2026'
            }),
            date: 'วันที่ออกเอกสาร / Certificate date: 16/07/2569 (16/07/2026)'
        }
    ];

    documents.forEach(({ content, date }) => {
        const signature = content.find(node => node && Array.isArray(node.stack)
            && textValue(node.stack[0].text) === 'ขอแสดงความนับถือ / Respectfully,');
        assert.ok(signature);
        signature.stack.forEach(line => {
            if (line && line.alignment) assert.equal(line.alignment, 'left');
        });
        assert.equal(textValue(content[0].text), date);
        assert.doesNotMatch(paragraphTexts(signature).join('\n'), /วันที่ \/ Date:/);
    });
});

test('free-form title and recipient remain editable', () => {
    const content = buildFreeForm({
        documentTitle: 'CUSTOM MEMO',
        addressee: 'ผู้รับหนังสือ',
        letterBody: 'เนื้อหา'
    });
    const paragraphs = paragraphTexts(content);

    assert.equal(textValue(content[1].text), 'CUSTOM MEMO');
    assert.ok(paragraphs.includes('เรียน ผู้รับหนังสือ'));
    assert.doesNotMatch(paragraphs.join('\n'), /To whom it may concern/);
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

    assert.ok(paragraphs.includes('วันที่ออกเอกสาร / Certificate date: 16/07/2569 (16/07/2026)'));
    assert.ok(paragraphs.includes('ชื่อ-นามสกุล / Full name: MR. JOHN DOE    สัญชาติ / Nationality: THAI'));
    assert.ok(paragraphs.includes('วันเกิด / Date of birth: 01/01/2533 (01/01/1990)    เลขที่หนังสือเดินทาง / Passport no.: AB1234'));
    assert.ok(paragraphs.includes('หนังสือรับรองฉบับนี้ขอรับรองว่า MR. JOHN DOE อยู่ระหว่างการดูแลรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี และมีความจำเป็นต้องนำยารายการต่อไปนี้ติดตัวเพื่อใช้ในการรักษาระหว่างการเดินทาง'));
    assert.ok(paragraphs.includes('This is to certify that MR. JOHN DOE is currently under the care of Public Health Center 28 Krung Thon Buri and is required to carry the medications listed below for personal therapeutic use during travel.'));
    assert.match(output, /รายการยาที่จำเป็นต้องพกติดตัว \/ Medications Required During Travel/);
    assert.match(output, /หมายเหตุเพิ่มเติม \/ Additional notes/);
});

test('medication certificate omits an unspecified optional nationality', () => {
    const output = paragraphTexts(buildMedicationCertificate({ patientName: 'JOHN DOE' })).join('\n');

    assert.doesNotMatch(output, /Nationality|สัญชาติ|NATIONALITY N\/A/);
});

test('medical certificate stacks formal Thai and English clinical sentences', () => {
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

    assert.match(output, /ผู้ป่วยได้เข้ารับการตรวจรักษาเมื่อวันที่ 16\/07\/2569 และได้รับการวินิจฉัยว่า Acute gastroenteritis/);
    assert.match(output, /The patient was evaluated and treated on 16\/07\/2026 and was diagnosed with Acute gastroenteritis\./);
    assert.match(output, /แพทย์มีความเห็นว่าผู้ป่วยควรพักรักษาตัวตั้งแต่วันที่/);
    assert.match(output, /In the attending physician’s opinion, the patient should take medical leave from/);
    assert.match(output, /ผู้ป่วยได้เข้ารับการรักษาโรคซิฟิลิสเมื่อวันที่/);
    assert.match(output, /ผู้ป่วยได้รับการรักษาวัณโรคครบตามแผนการรักษาเมื่อวันที่/);
    assert.doesNotMatch(output, /วันที่เริ่มพัก/);
    assert.doesNotMatch(output, /เห็นสมควรให้พักรักษาตัว/);
    assert.doesNotMatch(output, /ผู้ป่วยได้ทำการ/);
    assert.doesNotMatch(output, /โปรด/);
    assert.doesNotMatch(output, /diagnosis:|Medical leave is advised/);
});

test('Thai and English modes localize templates, dates, and signatures', () => {
    const base = {
        letterDate: '16/07/2026',
        patientName: 'SOMCHAI JAIDEE',
        consultationDate: '16/07/2026',
        doctorNameThai: 'นพ. ทดสอบ ระบบ',
        doctorNameEnglish: 'TEST DOCTOR',
        medicalLicense: '12345'
    };
    const thai = paragraphTexts(buildMedicalCertificate({ ...base, language: 'th' })).join('\n');
    const english = paragraphTexts(buildMedicalCertificate({ ...base, language: 'en' })).join('\n');

    assert.match(thai, /วันที่: 16\/07\/2569/);
    assert.match(thai, /ขอรับรองว่า/);
    assert.match(thai, /แพทย์ผู้ตรวจรักษา/);
    assert.doesNotMatch(thai, /This is to certify|Attending Physician/);
    assert.match(english, /Date: 16\/07\/2026/);
    assert.match(english, /This is to certify that/);
    assert.match(english, /Attending Physician/);
    assert.doesNotMatch(english, /ขอรับรองว่า|แพทย์ผู้ตรวจรักษา/);

    const thaiMedication = paragraphTexts(buildMedicationCertificate({
        ...base,
        language: 'th',
        doctorNameThai: 'นพ. ทดสอบ ระบบ'
    })).join('\n');
    assert.match(thaiMedication, /นพ\. ทดสอบ ระบบ/);
    assert.doesNotMatch(thaiMedication, /TEST DOCTOR/);
});
