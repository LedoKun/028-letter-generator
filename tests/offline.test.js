const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const appPages = [
    'index.html',
    'referral/index.html',
    'certificate-medication-letter/index.html',
    'medical-certificate/index.html',
    'free-form-letter/index.html'
];

function readPublic(relativePath) {
    return fs.readFileSync(path.join(publicDir, relativePath), 'utf8');
}

test('application pages use local assets and register offline support', () => {
    appPages.forEach(relativePath => {
        const html = readPublic(relativePath);
        assert.doesNotMatch(html, /https?:\/\//i, relativePath);
        assert.match(html, /href="\/css\/fonts\.css"/, relativePath);
        assert.match(html, /href="\/site\.webmanifest"/, relativePath);
        assert.match(html, /src="\/js\/offline\.js"/, relativePath);
    });
});

test('service worker precache entries exist in the public directory', () => {
    const source = readPublic('service-worker.js');
    const shellMatch = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);
    assert.ok(shellMatch, 'APP_SHELL should be declared');

    const paths = [...shellMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
    assert.ok(paths.length > 0, 'APP_SHELL should contain assets');
    paths.forEach(assetPath => {
        const relativePath = assetPath === '/' ? 'index.html' : assetPath.replace(/^\//, '');
        assert.ok(fs.existsSync(path.join(publicDir, relativePath)), assetPath);
    });

    assert.match(source, /request\.mode === 'navigate'/);
    assert.match(source, /caches\.match\(request,\s*\{\s*ignoreSearch:\s*true\s*\}\)/);
});

test('web manifest is installable from the site root', () => {
    const manifest = JSON.parse(readPublic('site.webmanifest'));
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.display, 'standalone');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
});
