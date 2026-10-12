const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'shared', 'pdf-generator.js'),
    'utf8'
);

test('PDF body uses the compact size and shared font', () => {
    assert.match(source, /defaultStyle:\s*\{\s*font:\s*THAI_FONT,\s*fontSize:\s*10,/);
    assert.match(source, /lineHeight:\s*1\.05/);
    assert.match(source, /margin:\s*\[0,\s*0,\s*0,\s*0\.75\]/);
});

test('PDF footer typography stays compact', () => {
    assert.match(source, /fontSize:\s*6\.5,\s*\n\s*lineHeight:\s*0\.85/);
    assert.match(source, /margin:\s*\[0,\s*1,\s*0,\s*1\]/);
    assert.match(source, /paddingTop:\s*\(\)\s*=>\s*1/);
});

test('PDF letterhead and footer remain bilingual in every document language', () => {
    assert.match(source, /ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี\\nPublic Health Center 28 Krung Thon Buri/);
    assert.match(source, /สำนักอนามัย \/ Health Department/);
    assert.match(source, /พิมพ์เมื่อ \/ Printed on/);
    assert.match(source, /โทร \/ Tel/);
    assert.doesNotMatch(source, /const stamp = language/);
});
