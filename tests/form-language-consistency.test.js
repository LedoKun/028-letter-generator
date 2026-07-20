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
    assert.doesNotMatch(forms, /Doctor's Notes|Treatment finished|Other\(s\)|ถ้ามี \/ optional/i);
    assert.doesNotMatch(forms, /ผู้ป่วยได้มารับการปรึกษา|ผู้ป่วยได้ทำการ|บันทึกแพทย์|ระบุการ/);
});

test('medical leave fields read as one fluent Thai clinical statement', () => {
    const medicalCertificate = read('medical-certificate/index.html');

    assert.match(medicalCertificate, /มีความเห็นว่าควรพักรักษาตัว \/ Medical\s+leave advised/);
    assert.match(medicalCertificate, /ตั้งแต่วันที่ \/\s+From/);
    assert.match(medicalCertificate, /ถึงวันที่ \/\s+To/);
    assert.doesNotMatch(medicalCertificate, /วันที่เริ่มพัก\s+\/|วันที่สิ้นสุดการพัก\s+\//);
});

test('referral diagnosis labels are English only', () => {
    const referral = read('referral/index.html');
    const expectedLabels = {
        includeRetroviral: 'Retroviral infection',
        includeSyphilisActive: 'Active Syphilis',
        includeSuspectedMpox: 'Suspected Mpox',
        includeHBV: 'HBV Co-Infection',
        includeHCVActive: 'HCV Co-Infection',
        includeTreatedSyphilis: 'Treated Syphilis',
        includeTreatedHCV: 'Treated HCV',
        includeTreatedTB: 'Treated TB',
        includeCompletedTPT: 'Completed TPT',
        includeOngoingTPT: 'Ongoing TPT',
        includeOtherHistory: 'Other Medical History'
    };

    Object.entries(expectedLabels).forEach(([id, expectedLabel]) => {
        const match = referral.match(new RegExp(`<label[^>]+for="${id}"[^>]*>([\\s\\S]*?)<\\/label>`));
        assert.ok(match, `missing label for ${id}`);
        const label = match[1].replace(/\s+/g, ' ').trim();
        assert.equal(label, expectedLabel);
        assert.doesNotMatch(label, /[\u0E00-\u0E7F]/, `${id} must not contain Thai text`);
    });

    assert.doesNotMatch(referral, /HIV infection/i);
});
