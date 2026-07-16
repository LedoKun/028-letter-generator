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
