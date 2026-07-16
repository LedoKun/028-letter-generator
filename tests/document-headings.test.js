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
