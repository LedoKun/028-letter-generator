const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const formPaths = [
    'referral/index.html',
    'free-form-letter/index.html',
    'certificate-medication-letter/index.html',
    'medical-certificate/index.html'
];

function read(relativePath) {
    return fs.readFileSync(path.join(publicDir, relativePath), 'utf8');
}

test('all forms use consistent bilingual physician and document labels', () => {
    formPaths.forEach(relativePath => {
        const html = read(relativePath);
        assert.match(html, /ข้อมูลแพทย์ \/ Doctor Information/);
        assert.match(html, /เลขที่ใบประกอบวิชาชีพ \/\s*Medical License No\./);
        assert.match(html, /ดูตัวอย่างและพิมพ์ \/ Preview & Print/);
    });

    const referral = read('referral/index.html');
    const freeForm = read('free-form-letter/index.html');
    const medicalCertificate = read('medical-certificate/index.html');
    [referral, freeForm, medicalCertificate].forEach(html => {
        assert.match(html, /ชื่อแพทย์ \(ภาษาไทย\) \/\s*Doctor's name \(Thai\)/);
        assert.match(html, /ชื่อแพทย์[\s\S]*\(ภาษาอังกฤษ\) \/\s*Doctor's name \(English\)/);
    });
});

test('optional sections describe clinical content rather than implementation actions', () => {
    const forms = formPaths.map(read).join('\n');

    assert.doesNotMatch(forms, />[^<]*Include\s/i);
    assert.doesNotMatch(forms, /Medical Notes|Doctor's Notes|Treatment finished|Other\(s\)|ถ้ามี \/ optional/i);
    assert.doesNotMatch(forms, /ผู้ป่วยได้มารับการปรึกษา|ผู้ป่วยได้ทำการ|บันทึกแพทย์|ระบุการ/);
});

test('medical leave fields read as one fluent Thai clinical statement', () => {
    const medicalCertificate = read('medical-certificate/index.html');

    assert.match(medicalCertificate, /มีความเห็นว่าควรพักรักษาตัว \/ Medical\s+leave advised/);
    assert.match(medicalCertificate, /ตั้งแต่วันที่ \/\s+From/);
    assert.match(medicalCertificate, /ถึงวันที่ \/\s+To/);
    assert.doesNotMatch(medicalCertificate, /วันที่เริ่มพัก\s+\/|วันที่สิ้นสุดการพัก\s+\//);
});

test('referral conditions follow the Mpox bilingual heading pattern', () => {
    const referral = read('referral/index.html');
    [
        'ซิฟิลิสที่อยู่ระหว่างการรักษา / Active',
        'สงสัยโรคฝีดาษวานร / Suspected',
        'การติดเชื้อ HBV ร่วม /',
        'การติดเชื้อ HCV ร่วม',
        'ประวัติซิฟิลิสที่รักษาครบแล้ว / Treated',
        'ประวัติ HCV ที่รักษาครบแล้ว / Treated',
        'ประวัติวัณโรคที่รักษาครบแล้ว / Treated',
        'ได้รับ TPT ครบแล้ว / Completed TPT',
        'อยู่ระหว่างรับ TPT / Ongoing TPT'
    ].forEach(wording => assert.ok(referral.includes(wording), wording));

    assert.match(referral, />Retroviral\s+infection</);
    assert.doesNotMatch(referral, /HIV infection/i);
});
