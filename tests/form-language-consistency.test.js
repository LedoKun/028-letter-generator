const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const pages=['referral','medical-certificate','certificate-medication-letter','free-form-letter'];
test('all four document routes open the same inline editor with local assets',()=>{
 for(const page of pages){const html=read(`public/${page}/index.html`);assert.match(html,/editor\/main\.mjs/);assert.doesNotMatch(html,/<form\b|preview-pane/);assert.match(html,/shared\/pdf-generator\.js/);}
});
test('physician values are bound to the selected language and a separate licence field',()=>{
 const source=read('public/editor/templates.mjs');assert.match(source,/languageBound:true/);assert.match(source,/doctor\.th/);assert.match(source,/doctor\.en/);assert.match(source,/doctor\.license/);
});
test('clinical sections retain explicit disease status and use natural medical leave statements',()=>{
 const source=read('public/editor/templates.mjs');assert.match(source,/เห็นสมควรให้ผู้ป่วยหยุดพักรักษาตัว/);assert.match(source,/has been advised to take medical leave from/);assert.match(source,/Suspected Mpox/);assert.match(source,/Treated Syphilis/);assert.doesNotMatch(source,/ผู้ป่วยได้ทำการ|Treatment finished|Other\(s\)/);
});
test('one Clear Form action and on-demand blob preview replace the old form actions',()=>{
 const source=read('public/editor/main.mjs');assert.equal((source.match(/button\(ui\('clear'\)/g)||[]).length,1);assert.match(source,/PdfGenerator\.generateBlob/);assert.match(source,/snapshot\.errors/);assert.doesNotMatch(source,/setupPdfPreview|Save Draft|generateDataUrl|Reset Template/);
});
test('all eleven original disease choices, independent medications and pick-up are available',async()=>{
 const {SECTIONS,buildSection}=await import('../public/editor/templates.mjs');assert.equal(Object.values(SECTIONS).filter(s=>s.disease).length,11);
 for(const id of ['art','oi','pickup','otherMedications','admission','lab','attachments'])assert.ok(SECTIONS[id]);const {walk}=await import('../public/editor/model.mjs');let pickup=false;walk(buildSection('hiv','en'),n=>{if(n.type==='clinicalSection'&&n.attrs.id==='pickup')pickup=true;});assert.ok(pickup);assert.equal(SECTIONS.notes,undefined);
});
test('Tailwind source owns the document canvas and persistent placeholder styles',()=>{
 const source=read('tailwind.css'),output=read('public/css/style.css');for(const css of ['document-surface','clinical-field','page-spacer','official-header','editor-toolbar','shortcut-hint']){assert.ok(source.includes(css));assert.ok(output.includes(css));}
});
test('patient values never use persistent browser storage and Clear Form confirms edits',()=>{
 const common=read('public/js/common.js'),source=read('public/editor/main.mjs');assert.doesNotMatch(common,/function writePatientStore|function readPatientStore/);assert.match(source,/if\(dirty&&!confirm/);assert.match(source,/beforeunload/);assert.match(source,/sharedDoctorNameThai/);assert.doesNotMatch(source,/localStorage\.setItem\([^\n]*(patient|draft)/i);
});
test('referral purposes and optional nationality retain their original choices',async()=>{
 const {FIELDS}=await import('../public/editor/fields.mjs');assert.equal(FIELDS['referral.purposes'].options.filter(o=>o.value!=='custom').length,10);assert.equal(FIELDS['patient.nationality'].required,false);assert.ok(FIELDS['patient.nationality'].options.some(o=>o.value==='STATELESS'));assert.ok(FIELDS['patient.nationality'].options.some(o=>o.value==='OTHER'));
});
