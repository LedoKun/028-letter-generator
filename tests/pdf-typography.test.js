const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'shared', 'pdf-generator.js'),
    'utf8'
);

test('PDF body typography stays compact', () => {
    assert.match(source, /fontSize:\s*8\.5/);
    assert.match(source, /lineHeight:\s*1\.05/);
    assert.match(source, /margin:\s*\[0,\s*0,\s*0,\s*0\.75\]/);
});

test('PDF footer typography stays compact', () => {
    assert.match(source, /fontSize:\s*7,\s*\n\s*lineHeight:\s*0\.85/);
    assert.match(source, /margin:\s*\[0,\s*1,\s*0,\s*1\]/);
    assert.match(source, /paddingTop:\s*\(\)\s*=>\s*1/);
});
