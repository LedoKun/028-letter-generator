import {openInsert,insertAction} from './insert-helpers.mjs';
import {test,expect} from '@playwright/test';

async function open(page,type,language){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});
 await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto({medical:'/medical-certificate/',referral:'/referral/',medication:'/certificate-medication-letter/',freeform:'/free-form-letter/'}[type]);
 await expect(page.locator('.tiptap')).toBeFocused();await page.locator('.section-panel > details').evaluate(details=>details.open=true);
}
async function set(page,values){await page.evaluate(values=>{for(const [id,value]of Object.entries(values))clinical.setValue(id,value);},values);}
async function pdfText(page){return page.evaluate(()=>{const text=x=>Array.isArray(x)?x.map(text).join(''):!x||typeof x!=='object'?'':(typeof x.text==='string'?x.text:text(x.text))+text(x.stack)+text(x.ul)+text(x.ol);return text(clinical.payload().payload.content);});}

for(const language of ['th','en']){
 test(`Medical Certificate title stays unchanged across included sections and Undo/Redo: ${language}`,async({page})=>{
  await open(page,'medical',language);
  await page.evaluate(()=>clinical.addSections(['syphilisTreatment','tbTreatment']));
  await set(page,{'patient.name':'FICTIONAL PATIENT','doctor.th':'นพ. ทดสอบ','doctor.en':'TEST DOCTOR','doctor.license':'12345','treatment.syphilisDate':'06/06/2026','treatment.tbDate':'01/06/2025','treatment.tbNotes':'Clinician-entered treatment notes.'});
  const title=page.locator('.tiptap h1 .field-content'),standard=language==='th'?'ใบรับรองแพทย์':'Medical Certificate';
  await expect(title).toHaveText(standard);
  expect(await pdfText(page)).not.toMatch(/clinically examined|unfit for work|Scheduled BPG|disease-free|ได้ทำการตรวจร่างกาย/);
  await page.evaluate(()=>clinical.addSections(['examination']));await expect(title).toHaveText(standard);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(title).toHaveText(standard);
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(title).toHaveText(standard);
  await page.locator('[data-section-control="examination"]').getByRole('button',{name:/^Remove:/}).click();await expect(title).toHaveText(standard);
  await page.getByLabel('Document template',{exact:true}).selectOption('referral');await page.getByLabel('Document template',{exact:true}).selectOption('medical');
  await expect(title).toHaveText(standard);expect(await pdfText(page)).not.toContain('Clinician-entered treatment notes.');expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['treatment.tbNotes'].value)).toBe('Clinician-entered treatment notes.');
 });
 test(`referral purposes sit in the opening paragraph with correct choice language: ${language}`,async({page})=>{
  await open(page,'referral',language);
  await set(page,{'patient.name':'FICTIONAL PATIENT','referral.customPurpose':'Clinician-entered referral detail'});
  await page.getByRole('button',{name:'Choices for Referral purpose',exact:true}).click();
  await expect(page.locator('[data-choice-value="continuedCare"]').locator('..')).toContainText(language==='th'?'รับการรักษาต่อ':'continued care');
  await page.locator('[data-choice-value="diagnosticEvaluation"]').check();
  await page.getByRole('button',{name:'Apply selection',exact:true}).click();
  const before=await pdfText(page);
  expect(before).toContain(language==='th'?'ขอส่งตัวผู้ป่วยรายนี้เพื่อ รับการรักษาต่อ และ การตรวจวินิจฉัยเพิ่มเติม':'for continued care and further diagnostic evaluation');
  expect(before.indexOf(language==='th'?'ขอส่งตัวผู้ป่วยรายนี้เพื่อ':'am writing to refer')).toBeLessThan(before.indexOf(language==='th'?'ชื่อ-นามสกุล':'Full name'));expect(before).not.toMatch(/รายละเอียดเพิ่มเติมในการส่งตัว|Additional details:/);
  expect(before).toContain('Clinician-entered referral detail');if(language==='th')expect(before).not.toMatch(/[;:]/);
  await page.getByRole('button',{name:'Remove Referral purpose occurrence',exact:true}).click();
  await page.getByRole('button',{name:'Remove Custom referral purpose occurrence',exact:true}).click();
  expect(await pdfText(page)).not.toContain(language==='th'?'วัตถุประสงค์ในการส่งตัว':'Purpose of Referral');
  expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['referral.purposes'].value)).toContain('diagnosticEvaluation');
 });
 test(`manual certificate title survives mode and letter-language changes: ${language}`,async({page})=>{
  await open(page,'medical',language);await page.evaluate(()=>clinical.addSections(['tbTreatment']));
  await page.evaluate(()=>{const e=clinical.editor;let pos;e.state.doc.descendants((n,p)=>{if(n.type.name==='heading'&&n.attrs.level===1)pos=p;});e.commands.insertContentAt({from:pos+1,to:pos+e.state.doc.nodeAt(pos).nodeSize-1},'Clinician-edited title');});
  await page.evaluate(()=>clinical.addSections(['examination']));await expect(page.locator('.tiptap h1')).toHaveText('Clinician-edited title');
  await page.getByLabel('Letter language',{exact:true}).selectOption(language==='th'?'en':'th');await expect(page.locator('.tiptap h1')).toHaveText('Clinician-edited title');
 });
 for(const type of ['referral','medical','medication','freeform'])test(`plain signature block and signing space: ${type}/${language}`,async({page})=>{
  await open(page,type,language);await set(page,{'doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ ระบบ','doctor.license':'12345'});
  const signature=page.locator('[data-clinical-group="signature"]');
  await expect(signature).toContainText(language==='th'?'ขอแสดงความนับถือ':'Yours faithfully,');
  await expect(signature).not.toContainText('Signature:');await expect(signature).not.toContainText('Name:');await expect(signature).not.toContainText('ลงชื่อ');
  expect(await signature.locator('p').count()).toBe(5);
  await expect(signature.locator('p').first()).toHaveAttribute('role','signatureLead');
  expect(await signature.locator('p').first().evaluate(node=>parseFloat(getComputedStyle(node).marginBottom))).toBeCloseTo(8*96/72,2);
  expect(await signature.locator('p').nth(2).evaluate(node=>parseFloat(getComputedStyle(node).marginBottom))).toBeCloseTo(44*96/72,2);
  const body=await pdfText(page),closing=language==='th'?'ขอแสดงความนับถือ':'Yours faithfully,';
  expect(body.slice(body.lastIndexOf(closing))).toBe(language==='th'?'ขอแสดงความนับถือนพ. ทดสอบ ระบบเลขที่ใบอนุญาตประกอบวิชาชีพเวชกรรม 12345':'Yours faithfully,TEST DOCTORMedical licence number: 12345');
 });
 test(`referral groups restore values and keep numbered Thai enclosures: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['hiv','hcvHistory','tbHistory','admission','lab','attachments']));
  await set(page,{'hcv.regimen':'SOF/VEL','hcv.completed':'07/07/2024','tb.regimen':'2HRZE/4HR','attachments.other':'Fictional treatment record'});
  await expect(page.locator('[data-clinical-group="clinical"] [data-section-id="hcvHistory"]')).toHaveCount(1);
  await expect(page.locator('[data-clinical-group="closing"] [data-section-id="admission"]')).toHaveCount(1);
  if(language==='th'){await expect(page.locator('[data-clinical-group="enclosures"] ol')).toHaveCount(2);await expect(page.locator('[data-section-id="attachments"] ol')).toHaveAttribute('start','2');}
  await page.locator('[data-section-control="hcvHistory"]').getByRole('button',{name:/^Remove:/}).click();await page.getByRole('button',{name:/^Restore: Treated HCV/}).click();
  await expect(page.locator('[data-section-id="hcvHistory"]')).toContainText('SOF/VEL');
  await page.getByLabel('Document template',{exact:true}).selectOption('medical');await page.getByLabel('Document template',{exact:true}).selectOption('referral');
  await expect(page.locator('[data-clinical-group="clinical"] [data-section-id="hcvHistory"]')).toContainText('SOF/VEL');
  const body=await pdfText(page);expect(body.indexOf(language==='th'?'เอกสารแนบ':'Enclosures')).toBeLessThan(body.indexOf(language==='th'?'ขอแสดงความนับถือ':'Yours faithfully'));
 });
 test(`manual page break inside the signature remains effective: ${language}`,async({page})=>{
  await open(page,'freeform',language);await page.evaluate(()=>{const e=clinical.editor;let position;e.state.doc.descendants((node,pos)=>{if(node.type.name==='clinicalGroup'&&node.attrs.id==='signature')position=pos+1+node.firstChild.nodeSize;});e.commands.insertContentAt(position,{type:'pageBreak'});});
  await page.waitForFunction(()=>clinical.layout.pages===2&&clinical.layout.stable);await expect(page.locator('[data-clinical-group="signature"] [data-page-break]')).toHaveCount(1);
 });
}
test('doctor prefix and licence parentheses remain correct after language switching',async({page})=>{
 await open(page,'referral','en');await set(page,{'doctor.en':'Dr TEST DOCTOR','doctor.th':'นพ. ทดสอบ ระบบ','doctor.license':'12345'});
 expect(await pdfText(page)).not.toContain('Dr Dr');await page.getByLabel('Letter language',{exact:true}).selectOption('th');await page.getByLabel('Letter language',{exact:true}).selectOption('en');
 const available=await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.availableFields);expect(available).toContain('doctor.en');expect(available).not.toContain('doctor.th');
 expect(await pdfText(page)).toContain('I, Dr TEST DOCTOR (Medical Licence Number: 12345), am writing');
 await set(page,{'doctor.en':'TEST DOCTOR'});expect(await pdfText(page)).toContain('I, Dr TEST DOCTOR (Medical Licence Number: 12345), am writing');
});
test('legacy BPG label remains editable and completes to its original canonical regimen',async({page})=>{
 await open(page,'referral','en');await page.evaluate(()=>{clinical.addSections(['syphilis']);clinical.setValue('syphilis.start','06/06/2026');});
 const field=page.locator('[data-field-id="syphilis.regimen"] .field-content');await field.click();await page.keyboard.insertText('Benzathine penicillin G 2.4 million units IM');await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['syphilis.regimen'].value)).toBe('Benzathine');
 await expect(page.locator('[data-field-id="syphilis.dose2"] .field-content')).toHaveText('13/06/2026');
});
for(const language of ['th','en']){
 test(`summary dropdown offers diagnoses, findings and histories with detail subbullets: ${language}`,async({page})=>{
  await open(page,'referral',language);await expect(page.locator('.tiptap [data-section-id="lab"]')).toHaveCount(1);
  await openInsert(page,'clinical');
  const ids=await page.locator('[data-section-choice]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sectionChoice));
  expect(ids).toEqual(['hiv','syphilis','mpox','hbv','hcvActive','syphilisHistory','hcvHistory','tbHistory','tbActive','crag','cmvr','tptCompleted','tptOngoing']);
  for(const id of ids)await page.locator(`[data-section-choice="${id}"]`).check();
  await page.getByRole('dialog',{name:'Insert'}).getByRole('button',{name:'Insert selected blocks',exact:true}).click();
  const group=page.locator('.tiptap [data-clinical-group="clinical"]');
  for(const id of ids){const section=group.locator(`:scope > [data-section-id="${id}"]`);await expect(section.locator(':scope > ul > li > p').first()).toBeVisible();await expect(section.locator('h2')).toHaveCount(0);}
  await page.evaluate(()=>clinical.addSections(['otherMedications'],false,'clinical'));await expect(group.locator('[data-section-id="otherMedications"]')).toHaveCount(0);
 });
 test(`HIV continuity and injection defaults stay editable through removal and restoration: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['hiv','syphilis']));
  const field=id=>page.locator(`.tiptap [data-field-id="${id}"] .field-content`).filter({visible:true}).first();
  await expect(field('pickup.date')).toHaveText(language==='th'?'10/10/2569':'10/10/2026');await expect(field('pickup.days')).toHaveText('60');
  await expect(field('syphilis.start')).toHaveText(language==='th'?'10/10/2569':'10/10/2026');await expect(field('syphilis.dose2')).toHaveText(language==='th'?'17/10/2569':'17/10/2026');
  const schedule=page.locator('[data-section-id="syphilis"] > ul > li > ul').filter({hasText:language==='th'?'กำหนดการฉีดยา':'Injection schedule'});await expect(schedule.locator('ul .clinical-field')).toHaveCount(3);
  expect(await pdfText(page)).not.toMatch(/\bBPG\b|was administered/);
  await set(page,{'pickup.date':'09/10/2026','pickup.days':'30','syphilis.dose2':'18/10/2026'});
  for(const id of ['hiv','syphilis']){await page.locator(`[data-section-control="${id}"]`).getByRole('button',{name:/^Remove:/}).click();await page.getByRole('button',{name:id==='hiv'?'Restore: Retroviral Infection':'Restore: Active Syphilis',exact:true}).click();}
  await expect(field('pickup.days')).toHaveText('30');await expect(field('syphilis.dose2')).toHaveText(language==='th'?'18/10/2569':'18/10/2026');
  await page.getByRole('button',{name:'Remove Last medication pick-up date occurrence',exact:true}).click();
  const withoutDate=await pdfText(page);expect(withoutDate).toContain(language==='th'?'ผู้ป่วยได้รับยาเพียงพอสำหรับ 30 วัน':'A 30-day medication supply was provided.');expect(withoutDate).not.toContain(language==='th'?'ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่':'last collected medication on');
  await page.getByRole('button',{name:'Restore occurrence: Last medication pick-up date',exact:true}).click();
  await expect(field('pickup.date')).toHaveText(language==='th'?'09/10/2569':'09/10/2026');expect(await pdfText(page)).toContain(language==='th'?'โดยมียาเพียงพอสำหรับ 30 วัน':'with a 30-day supply');
 });
 test(`Other purpose is an inline editable field with required validation: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.getByRole('button',{name:'Choices for Referral purpose',exact:true}).click();
  await page.locator('[data-choice-value="continuedCare"]').uncheck();await page.locator('[data-choice-value="custom"]').check();await page.getByRole('button',{name:'Apply selection',exact:true}).click();
  const custom=page.locator('[data-field-id="referral.customPurpose"]').filter({visible:true});await expect(custom).toBeVisible();
  expect(await page.evaluate(()=>clinical.payload().errors.some(error=>error.id==='referral.customPurpose'))).toBe(true);
  await custom.click();await page.keyboard.insertText(language==='th'?'ประเมินโรคหัวใจ':'cardiology review');await page.keyboard.press('Tab');
  expect(await pdfText(page)).toContain(language==='th'?'เพื่อ ประเมินโรคหัวใจ โดยมีรายละเอียดดังต่อไปนี้':'for cardiology review. Details');expect(await pdfText(page)).not.toMatch(/Additional details|รายละเอียดเพิ่มเติมในการส่งตัว|\u200B/);
 });
 test(`removing Other Medical History leaves no empty diagnosis or summary heading: ${language}`,async({page})=>{
  await open(page,'referral',language);await page.evaluate(()=>{clinical.addSections(['otherHistory']);clinical.setValue('history.other','Retained fictional history');});
  await page.getByRole('button',{name:'Remove Other medical history occurrence',exact:true}).click();
  expect(await pdfText(page)).not.toMatch(/Other Medical History|Clinical Summary and Treatment History|สรุปประวัติการเจ็บป่วยและการรักษา|Retained fictional history/);
  expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['history.other'].value)).toBe('Retained fictional history');
  await page.getByRole('button',{name:'Restore occurrence: Other medical history',exact:true}).click();expect(await pdfText(page)).toContain('Other Medical History Retained fictional history');
 });
}
test('adding HIV reuses existing ART and supply blocks at the correct bullet depth',async({page})=>{
 await open(page,'referral','en');await page.evaluate(()=>{clinical.addSections(['art','pickup']);clinical.setValue('pickup.date','09/10/2026');clinical.setValue('pickup.days','30');});
 await insertAction(page,'medicine','medicine:art');
 const row=await page.locator('.tiptap [data-kind="art"]').getAttribute('data-medication-row');await set(page,{[`art.${row}.name`]:'TDF/3TC/DTG',[`art.${row}.tablets`]:'1'});
 await page.evaluate(()=>clinical.addSections(['hiv']));await expect(page.locator('[data-section-id="hiv"] [data-section-id="art"]')).toHaveCount(1);await expect(page.locator('[data-section-id="hiv"] [data-section-id="pickup"]')).toHaveCount(1);
 await expect(page.locator('.tiptap [data-section-id="pickup"]')).toHaveCount(1);expect(await pdfText(page)).toContain('TDF/3TC/DTG 1 tablet once daily');expect(await pdfText(page)).toContain('with a 30-day supply');
 const nesting=await page.locator(`[data-field-id="art.${row}.name"]`).evaluate(node=>{let depth=0;for(let parent=node.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='LI')depth++;return depth;});expect(nesting).toBe(3);
 await page.locator('[data-section-control="art"]').getByRole('button',{name:'Remove medicine',exact:true}).click();await page.locator('[data-section-control="art"]').getByRole('button',{name:'Restore',exact:true}).click();expect(await pdfText(page)).toContain('TDF/3TC/DTG 1 tablet once daily');
 await set(page,{[`art.${row}.time`]:'20:00'});expect(await page.locator('.tiptap [data-kind="art"]').innerText()).toContain('once daily');expect(await pdfText(page)).toContain('TDF/3TC/DTG 1 tablet once daily at 20:00');
});
