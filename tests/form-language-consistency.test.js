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

test('all forms use language-neutral physician labels with one field per selected language', () => {
    formPaths.forEach(relativePath => {
        const html = read(relativePath);
        assert.match(html, /ข้อมูลแพทย์ \/ Doctor Information/);
        assert.match(html, /เลขที่ใบประกอบวิชาชีพ \/\s*Medical License No\./);
        assert.match(html, /พิมพ์ \/ Print/);
        assert.match(html, /บันทึก \/ Save/);
    });
    assert.match(read('js/common.js'), /ล้างฟอร์ม \/ Clear Form/);

    formPaths.map(read).forEach(html => {
        assert.match(html, /data-language-field="th"[\s\S]*ชื่อแพทย์ \/ Doctor's name/);
        assert.match(html, /data-language-field="en"[\s\S]*ชื่อแพทย์ \/ Doctor's name/);
        assert.doesNotMatch(html, /Thai\/English|ชื่อแพทย์ \(ภาษา(?:ไทย|อังกฤษ)|Doctor's name \((?:Thai|English)/);
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

test('all forms use the shared language toggle and resilient blob preview', () => {
    const scriptPaths = [
        'referral/script.js',
        'free-form-letter/script.js',
        'certificate-medication-letter/certificate-script.js',
        'medical-certificate/medical-certificate-script.js'
    ];
    scriptPaths.forEach(relativePath => {
        const script = read(relativePath);
        assert.match(script, /Common\.setupLanguageToggle\(/);
        assert.match(script, /Common\.setupPdfPreview\(/);
        assert.doesNotMatch(script, /generateDataUrl\(/);
    });

    const common = read('js/common.js');
    const generator = read('shared/pdf-generator.js');
    assert.match(common, /PdfGenerator\.generateBlob/);
    assert.match(common, /querySelectorAll\('\[data-language-field\]'\)/);
    assert.match(common, /Updating PDF preview/);
    assert.match(common, /PDF preview update pending/);
    assert.match(common, /const version = \+\+renderVersion;[\s\S]*setTimeout\(\(\) => render\(version\), debounce\)/);
    assert.match(common, /Unable to generate the PDF preview/);
    assert.match(common, /preview-frame-next/);
    assert.match(common, /nextFrame\.addEventListener\('load'/);
    assert.match(common, /englishHeading\.className = thaiHeading/);
    assert.match(common, /debounce = 1000/);
    assert.match(common, /element\.required = active/);
    assert.match(generator, /await registerFonts\(\)/);
    assert.match(generator, /async function generateBlob/);
});

test('the Tailwind source owns app styles so rebuilding cannot erase them', () => {
    const source = fs.readFileSync(path.join(publicDir, '..', 'tailwind.css'), 'utf8');
    const output = read('css/style.css');
    const packageJson = JSON.parse(fs.readFileSync(path.join(publicDir, '..', 'package.json'), 'utf8'));

    ['.workspace', '.preview-pane', '.preview-frame-next', '.date-field-wrap', '.language-toggle', 'preview-spin', 'border-color: red'].forEach(selector => {
        assert.match(source, new RegExp(selector.replace('.', '\\.')));
        assert.match(output, new RegExp(selector.replace('.', '\\.')));
    });
    assert.ok(packageJson.scripts['build:css']);
    assert.ok(packageJson.scripts['dev:css']);
});

test('shared navigation, actions, and preview use the compact viewport layout', () => {
    const common = read('js/common.js');
    const source = fs.readFileSync(path.join(publicDir, '..', 'tailwind.css'), 'utf8');
    const forms = formPaths.map(read);

    assert.match(common, /data-language="th">TH<\/button><button type="button" data-language="en">EN<\/button>/);
    assert.doesNotMatch(common, /\[ TH \]|\[ EN \]|doc-tab-clear/);
    assert.match(source, /font-size: 1rem/);
    assert.match(source, /container\.max-w-7xl \{ max-width: 96rem; \}/);
    assert.match(source, /100dvh - 10rem/);
    assert.match(source, /inset: 1rem 1rem auto auto/);
    forms.forEach(html => {
        assert.equal((html.match(/data-clear-form/g) || []).length, 0);
        assert.match(html, /flex justify-end[\s\S]*btn-secondary/);
    });
    assert.match(common, /className = 'top-form-actions'/);
    assert.match(common, /class="btn-danger thai-font" data-clear-form/);
    assert.match(source, /\.top-form-actions/);
    assert.match(read('referral/index.html'), /id="addArtMedication"[\s\S]*class="btn-secondary/);
    assert.match(read('referral/script.js'), /classList\.add\('btn-danger', 'thai-font'\)/);
    assert.match(read('certificate-medication-letter/certificate-script.js'), /classList\.add\('btn-danger', 'thai-font'\)/);
});

test('document names are unambiguous and medication pickup stays in the HIV form section', () => {
    const common = read('js/common.js');
    const medication = read('certificate-medication-letter/index.html');
    const medicationScript = read('certificate-medication-letter/certificate-script.js');
    const referral = read('referral/index.html');
    const referralScript = read('referral/script.js');

    assert.match(common, /หนังสือรับรองการพกยา \/ Medication Certificate for Travel/);
    assert.match(common, /ใบรับรองแพทย์ \/ Medical Certificate/);
    assert.doesNotMatch(common, /\/ Med Cert/);
    assert.match(medication, /Medication Certificate for Travel Generator/);
    assert.match(medication, /data-thai="นาย"/);
    assert.match(medicationScript, /language === 'th' \? \(option\.dataset\.thai/);
    assert.match(referral, /id="retroviralDetails"[\s\S]*id="includeLastMedicinePickup"[\s\S]*id="retroviralNotes"/);
    assert.match(referralScript, /Quantity \(tablets\/bottles\/units\)/);
    assert.doesNotMatch(referralScript, /artDays|Supply duration \(days\)|ระยะเวลา \(วัน\)/);
});

test('referral purpose determines the letter and medication nationality is optional', () => {
    const referral = read('referral/index.html');
    const referralData = read('referral/referral-data.js');
    const medication = read('certificate-medication-letter/index.html');
    const medicationScript = read('certificate-medication-letter/certificate-script.js');
    const nationalitySelect = medication.match(/<select id="nationality"[\s\S]*?>/);
    const requiredFields = medicationScript.match(/const requiredFields = \[[\s\S]*?\];/);

    assert.doesNotMatch(referral, /รูปแบบหนังสือ|Letter Format|name="letterType"/);
    assert.match(referral, /<option value="continuedCare" selected>ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ \/ Referral for Continued Care<\/option>/);
    assert.doesNotMatch(referral, /value="medicalSummary"|>สรุปประวัติการรักษา \/ Medical Summary<\/option>/);
    assert.doesNotMatch(referral, /tertiaryTransfer|interFacilityConsult|การส่งต่อไปยังสถานพยาบาลระดับตติยภูมิ|การปรึกษาระหว่างสถานพยาบาล/);
    assert.doesNotMatch(referralData, /'letterType'/);
    assert.ok(nationalitySelect);
    assert.doesNotMatch(nationalitySelect[0], /\brequired\b/);
    assert.ok(requiredFields);
    assert.doesNotMatch(requiredFields[0], /nationality/);
});
