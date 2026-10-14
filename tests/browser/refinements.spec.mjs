import {test,expect} from '@playwright/test';

async function open(page,type='referral',language='th'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});
 await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto({referral:'/referral/',medical:'/medical-certificate/',medication:'/certificate-medication-letter/',freeform:'/free-form-letter/'}[type]);
 await expect(page.locator('.tiptap')).toBeFocused();
}
const field=(page,id)=>page.locator(`.tiptap [data-field-id="${id}"]`).filter({visible:true}).first();
async function set(page,values){await page.evaluate(values=>{for(const [id,value]of Object.entries(values))clinical.setValue(id,value);},values);}
async function choose(page,id,values){
 await field(page,id).locator('.inline-choice').click();
 for(const value of values)await page.locator(`[data-choice-value="${value}"]`).check();
 await page.getByRole('button',{name:'Apply selection',exact:true}).click();
}
async function pdfText(page){return page.evaluate(()=>{const flatten=value=>Array.isArray(value)?value.map(flatten).join(''):!value||typeof value!=='object'?'':(typeof value.text==='string'?value.text:flatten(value.text))+flatten(value.stack)+flatten(value.ul)+flatten(value.ol);return flatten(clinical.payload().payload.content);});}

for(const language of ['th','en'])test(`ART once-daily wording stays visible when a time is entered or cleared: ${language}`,async({page})=>{
 await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['hiv']));await page.locator('[data-insertion-point="medicine:art"] > button').click();
 const row=page.locator('.tiptap [data-kind="art"]'),id=await row.getAttribute('data-medication-row');await set(page,{[`art.${id}.name`]:'TDF/3TC/DTG',[`art.${id}.tablets`]:'1'});
 const frequency=language==='th'?'วันละ 1 ครั้ง':'once daily';await field(page,`art.${id}.time`).click();await page.keyboard.insertText('2000');await expect(row).toContainText(frequency);await page.keyboard.press('Tab');
 const expected=language==='th'?'1 เม็ด วันละ 1 ครั้ง เวลา 20:00 น.':'1 tablet once daily at 20:00';await expect(field(page,`art.${id}.time`).locator('.field-content')).toHaveText('20:00');expect(await pdfText(page)).toContain(expected);
 await field(page,`art.${id}.time`).click();await page.keyboard.press('Backspace');await page.keyboard.press('Tab');await expect(row).toContainText(frequency);expect(await pdfText(page)).toContain(frequency);expect(await pdfText(page)).not.toContain('20:00');
});

for(const language of ['th','en']){
 for(const template of ['referral','medical','medication','freeform'])test(`patient details fit three rows with demographics before IDs: ${template}/${language}`,async({page})=>{
  await open(page,template,language);if(template==='freeform')await page.evaluate(()=>clinical.addSections(['identification']));
  await set(page,{'patient.salutation':'MR.','patient.name':'FICTIONAL PATIENT','patient.dob':'10/10/2000','patient.sex':'MALE','patient.nationalId':'1234567890123','patient.passport':'AB123456','patient.nationality':'THAI'});await page.waitForFunction(()=>clinical.layout.stable);
  const layout=await page.evaluate(()=>{
   const paragraphs=[...new Set(['patient.name','patient.dob','patient.nationalId','patient.passport'].map(id=>document.querySelector(`.tiptap [data-field-id="${id}"]`).closest('p')))];
   const tops=[];for(const paragraph of paragraphs){const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT),range=document.createRange();let node;while(node=walker.nextNode()){if(node.parentElement.closest('[hidden],.inline-choice,.field-remove,.page-spacer'))continue;range.selectNodeContents(node);for(const rect of range.getClientRects())if(rect.width&&rect.height&&!tops.some(top=>Math.abs(top-rect.top)<4))tops.push(rect.top);}}
   return {rows:tops.length,fields:paragraphs.map(paragraph=>[...paragraph.querySelectorAll('[data-field-id]')].filter(node=>!node.closest('[hidden]')).map(node=>node.dataset.fieldId))};
  });
  expect(layout.rows).toBe(3);expect(layout.fields).toHaveLength(3);expect(layout.fields[1]).toEqual(['patient.dob','patient.age',...(['referral','medical'].includes(template)?['patient.sex']:template==='medication'?['patient.nationality']:[])]);expect(layout.fields[2]).toEqual(['patient.nationalId','patient.passport']);
  const exported=await page.evaluate(()=>{const flatten=node=>Array.isArray(node)?node.map(flatten).join(''):!node||typeof node!=='object'?'':(typeof node.text==='string'?node.text:flatten(node.text))+flatten(node.stack);return clinical.payload().payload.content.filter(node=>/FICTIONAL PATIENT|10\/10\/(2000|2543)|AB123456/.test(flatten(node))).map(flatten);});
  expect(exported).toHaveLength(3);expect(exported[2]).toContain('1-2345-67890-12-3');expect(exported[2]).toContain('AB123456');
  if(['referral','medical'].includes(template))expect(exported[1]).toMatch(language==='th'?/อายุ.*เพศ/:/Age:.*Sex:/);
  if(template==='medication')await expect(field(page,'patient.name').locator('xpath=ancestor::p/preceding-sibling::*[1]').locator('[data-field-id="document.addressee"]')).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(page.locator('.editor-dropdown')).toHaveCount(0);await field(page,'patient.age').click();await page.keyboard.press('Tab');expect(await page.evaluate(()=>clinical.editor.state.selection.$from.parent.attrs.id)).toBe(['referral','medical'].includes(template)?'patient.sex':template==='medication'?'patient.nationality':'patient.nationalId');
  await set(page,{'patient.nationalId':''});const text=await pdfText(page);expect(text).not.toMatch(/National ID:|เลขประจำตัวประชาชน/);expect(text).toContain('AB123456');
 });
 test(`ART adherence uses the requested wording and keeps its value when switching language: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['hiv']));await set(page,{'hiv.adherence':'>95%'});
  const paragraph=field(page,'hiv.adherence').locator('xpath=ancestor::p');
  const expected=lang=>lang==='th'?'ART adherence >95%':'The patient reported ART adherence of >95%';
  await expect(paragraph).toContainText(expected(language));expect(await pdfText(page)).toContain(expected(language));
  const other=language==='th'?'en':'th';await page.getByLabel('Letter language',{exact:true}).selectOption(other);
  await expect(paragraph).toContainText(expected(other));expect(await pdfText(page)).toContain(expected(other));
  expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['hiv.adherence'].value)).toBe('>95%');
 });
 test(`fresh mpox/TB selections have no empty first item or false validation errors: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['mpox','tbHistory']));
  await set(page,{'patient.name':'FICTIONAL PATIENT','doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ ระบบ','mpox.days':'4'});
  await choose(page,'mpox.symptoms',['feverChills','headache','fatigue']);await choose(page,'mpox.risks',['noneKnown']);await choose(page,'tb.sites',['Pulmonary']);
  let values=await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values);
  expect(values['mpox.symptoms'].value).toEqual(['feverChills','headache','fatigue']);expect(values['mpox.risks'].value).toEqual(['noneKnown']);expect(values['tb.sites'].value).toEqual(['Pulmonary']);
  await expect(field(page,'tb.sites').locator('.field-content')).toHaveText(language==='th'?'ปอด':'Pulmonary');
  for(const id of ['mpox.symptoms','mpox.risks','tb.sites']){await expect(field(page,id)).toHaveAttribute('aria-invalid','false');expect((await field(page,id).locator('.field-content').innerText()).trim()).not.toMatch(/^[,;]|^(และ|and)\b/);}
  expect(await page.evaluate(()=>clinical.payload().errors)).toEqual([]);
  await choose(page,'tb.sites',['Lymph nodes']);await choose(page,'mpox.risks',['directContact','animal']);
  values=await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values);expect(values['tb.sites'].value).toEqual(['Pulmonary','Lymph nodes']);expect(values['mpox.risks'].value).toEqual(['directContact','animal']);
  expect(await page.evaluate(()=>clinical.payload().errors)).toEqual([]);
  await choose(page,'tb.sites',['Other']);expect(await page.evaluate(()=>clinical.payload().errors.some(e=>e.id==='tb.siteOther'))).toBe(true);
  await set(page,{'tb.siteOther':'Fictional site'});expect(await page.evaluate(()=>clinical.payload().errors)).toEqual([]);
  await choose(page,'mpox.symptoms',['other']);expect(await page.evaluate(()=>clinical.payload().errors.some(e=>e.id==='mpox.symptomOther'))).toBe(true);
  await set(page,{'mpox.symptomOther':'Fictional symptom'});expect(await page.evaluate(()=>clinical.payload().errors)).toEqual([]);
  await field(page,'mpox.symptoms').locator('.inline-choice').click();await page.getByRole('region',{name:'Presenting symptoms'}).getByRole('button',{name:'Clear value',exact:true}).click();
  expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['mpox.symptoms'].value)).toEqual([]);expect(await page.evaluate(()=>clinical.payload().errors.some(e=>e.id==='mpox.symptoms'))).toBe(true);
 });
 test(`lab enclosure is a keyboard-accessible editable field with default language switching: ${language}`,async({page})=>{
  await open(page,'referral',language);await expect(field(page,'attachments.lab').locator('.field-content')).toHaveText(language==='th'?'ผลตรวจทางห้องปฏิบัติการล่าสุด':'Latest laboratory results');
  const other=language==='th'?'en':'th';await page.getByLabel('Letter language',{exact:true}).selectOption(other);await expect(field(page,'attachments.lab').locator('.field-content')).toHaveText(other==='th'?'ผลตรวจทางห้องปฏิบัติการล่าสุด':'Latest laboratory results');
  await field(page,'attachments.lab').click();expect(await page.evaluate(()=>{const e=clinical.editor;return e.state.doc.textBetween(e.state.selection.from,e.state.selection.to);})).toBe(other==='th'?'ผลตรวจทางห้องปฏิบัติการล่าสุด':'Latest laboratory results');
  await page.keyboard.insertText('Clinician-edited laboratory results');await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Add enclosures',exact:true})).toBeFocused();await page.keyboard.press('Tab');expect(await page.evaluate(()=>clinical.editor.state.selection.$from.parent.attrs.id)).toBe(other==='th'?'doctor.th':'doctor.en');
  await page.getByLabel('Letter language',{exact:true}).selectOption(language);await expect(field(page,'attachments.lab').locator('.field-content')).toHaveText('Clinician-edited laboratory results');expect(await pdfText(page)).toContain('Clinician-edited laboratory results');
  await page.getByRole('button',{name:'Remove Laboratory results enclosure occurrence',exact:true}).click();expect(await pdfText(page)).not.toContain('Clinician-edited laboratory results');await page.getByRole('button',{name:'Restore occurrence: Laboratory results enclosure',exact:true}).click();await expect(field(page,'attachments.lab').locator('.field-content')).toHaveText('Clinician-edited laboratory results');
 });
 test(`referral buttons are simplified while other medicines remain insertable through the toolbar: ${language}`,async({page})=>{
  await open(page,'referral',language);await expect(page.getByRole('button',{name:'Add a patient or administrative block',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Add other medications',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Add a closing request',exact:true}).click();await expect(page.locator('[data-section-choice="physician"]')).toHaveCount(0);await expect(page.locator('[data-section-choice="admission"]')).toHaveCount(1);await expect(page.locator('[data-section-choice="financial"]')).toHaveCount(1);await page.getByRole('region',{name:'Insert Block'}).getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('.format-tools').getByRole('button',{name:'Insert Block',exact:true}).click();await expect(page.locator('[data-section-choice="otherHistory"]')).toHaveCount(0);await page.locator('[data-section-choice="otherMedications"]').check();await page.getByRole('region',{name:'Insert Block'}).getByRole('button',{name:'Add',exact:true}).click();await expect(page.locator('[data-clinical-group="medications"] [data-section-id="otherMedications"]')).toHaveCount(1);
  await page.evaluate(()=>clinical.addSections(['hiv']));await page.getByRole('button',{name:'Add TMX/SMP 80/400 mg',exact:true}).click();await expect(page.locator('[data-section-id="hiv"] [data-section-id="oi"]')).toHaveCount(1);await expect(page.getByRole('region',{name:'Insert Block',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Add TMX/SMP 80/400 mg',exact:true})).toHaveCount(0);
  await set(page,{'oi.tablets':'2','oi.details':'Clinician-entered prophylaxis details'});await expect(page.locator('.tiptap [data-section-id="oi"]')).toContainText('Clinician-entered prophylaxis details');await expect(page.locator('.tiptap [data-section-id="oi"]')).not.toContainText(language==='th'?'การป้องกันอื่น':'Other prophylaxis:');expect(await pdfText(page)).toContain('Clinician-entered prophylaxis details');
 });
 test(`medical certificate insertion menu offers only examination, leave and treatment blocks: ${language}`,async({page})=>{
  await open(page,'medical',language);await page.getByRole('button',{name:'Add examination, treatment or medical leave',exact:true}).click();
  for(const id of ['attendance','identification','dobAge','physician','comments','documentDate','addressee'])await expect(page.locator(`[data-section-choice="${id}"]`)).toHaveCount(0);
  for(const id of ['examination','leave','syphilisTreatment','tbTreatment'])await expect(page.locator(`[data-section-choice="${id}"]`)).toHaveCount(1);
  await expect(page.locator('[data-section-choice]')).toHaveCount(4);
 });
 for(const regimen of ['Doxycycline2Weeks','Doxycycline28Days'])test(`doxycycline omits a repeated duration statement: ${language}/${regimen}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['syphilis']));await set(page,{'syphilis.regimen':regimen});
  await expect(page.locator('[data-field-id="syphilis.duration"]')).toHaveCount(0);await expect(page.locator('[data-field-id="syphilis.dose1"]')).toBeHidden();const text=await pdfText(page);expect(text).toContain(regimen==='Doxycycline2Weeks'?'for 14 days':'for 28 days');expect(text).not.toMatch(/กำหนดระยะเวลาการรักษา|planned treatment duration/);
 });
}
test('free-form body has only its empty-body writing hint and toolbar blocks insert into that body',async({page})=>{
 await open(page,'freeform','en');await expect(page.locator('.tiptap [data-insertion-point]')).toHaveCount(0);const paragraph=page.locator('.letter-body > p').first();
 expect(await paragraph.evaluate(n=>getComputedStyle(n,'::before').content)).toBe('"Start writing your letter here..."');
 await paragraph.click();await page.keyboard.insertText('Fictional letter body.');expect(await paragraph.evaluate(n=>getComputedStyle(n,'::before').content)).toBe('none');expect(await pdfText(page)).toContain('Fictional letter body.');expect(await pdfText(page)).not.toContain('Start writing');
 await page.locator('.format-tools').getByRole('button',{name:'Insert Block',exact:true}).click();await page.locator('[data-section-choice="identification"]').check();await page.getByRole('region',{name:'Insert Block'}).getByRole('button',{name:'Add',exact:true}).click();await expect(page.locator('.letter-body [data-section-id="identification"]')).toHaveCount(1);expect(await page.evaluate(()=>clinical.payload().errors.some(e=>e.id==='document.body'))).toBe(false);
});
test('travel certificate has no closing-request insertion point and retains medicine insertion',async({page})=>{
 await open(page,'medication','en');await expect(page.getByRole('button',{name:'Add attachments or a closing request',exact:true})).toHaveCount(0);await expect(page.locator('[data-insertion-point="medicine:travelMedications"]')).toHaveCount(1);
});
test('editor bullet spacing uses 2 pt while the signing space remains 44 pt',async({page})=>{
 await open(page,'referral','en');await page.evaluate(()=>{clinical.addSections(['hiv','syphilis']);clinical.setValue('hiv.napId','1234567890');});const first=page.locator('[data-section-id="syphilis"] > ul > li > p').first();
 expect(await first.evaluate(n=>parseFloat(getComputedStyle(n).marginBottom))).toBeCloseTo(2*96/72,2);expect(await first.locator('..').evaluate(n=>parseFloat(getComputedStyle(n).marginBottom))).toBe(0);
 expect(await page.locator('[data-clinical-group="signature"] p').nth(2).evaluate(n=>parseFloat(getComputedStyle(n).marginBottom))).toBeCloseTo(44*96/72,2);
});
