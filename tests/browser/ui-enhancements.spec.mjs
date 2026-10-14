import {test,expect} from '@playwright/test';
import {openInsert,insertMenu,insertBlocks,editParagraph} from './insert-helpers.mjs';

async function open(page,template='referral',language='en'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});
 await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto(template==='freeform'?'/free-form-letter/':'/referral/');
 await expect(page.locator('.tiptap')).toBeFocused();await page.waitForFunction(()=>clinical.layout.stable);
}
const pdfText=page=>page.evaluate(()=>{const text=x=>Array.isArray(x)?x.map(text).join(''):!x||typeof x!=='object'?'':(typeof x.text==='string'?x.text:text(x.text))+text(x.stack)+text(x.ul)+text(x.ol);return text(clinical.payload().payload.content);});
async function zoom(page,value){await page.getByRole('slider',{name:'Document zoom',exact:true}).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForFunction(()=>clinical.layout.stable);}

test('the contextual insert button stays still during approach and its popup uses the button position',async({page})=>{
 await open(page,'freeform');const paragraph=page.locator('[data-writing-space]').first();await editParagraph(paragraph);
 await page.keyboard.insertText(('Fictional text for several wrapped lines. ').repeat(8));
 for(const value of [100,150,200]){
  await zoom(page,value);await paragraph.scrollIntoViewIfNeeded();const box=await paragraph.boundingBox();
  await page.mouse.move(box.x+100,box.y+8);const button=page.getByRole('button',{name:'Insert here',exact:true});await expect(button).toBeVisible();const before=await button.boundingBox();
  await page.mouse.move(box.x+200,box.y+Math.min(box.height-2,35));expect(await button.boundingBox()).toEqual(before);
  await page.mouse.move(before.x+before.width/2,before.y+before.height/2,{steps:8});expect(await button.boundingBox()).toEqual(before);await button.click();
  const menu=await insertMenu(page).boundingBox(),expected=Math.max(12,Math.min(before.x,page.viewportSize().width-menu.width-12));expect(Math.abs(menu.x-expected)).toBeLessThan(2);
  expect(menu.y).toBeGreaterThanOrEqual((await page.locator('#toolbar').boundingBox()).height);await page.keyboard.press('Escape');
 }
});

for(const language of ['th','en'])for(const template of ['referral','freeform'])test(`three blank writing lines precede the contact sentence and accept text: ${template}/${language}`,async({page})=>{
 await open(page,template,language);const lines=page.locator('[data-writing-space]');await expect(lines).toHaveCount(3);
 const heights=await lines.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));for(const height of heights)expect(height).toBeGreaterThan(10);
 const closing=page.locator('.tiptap p[role="closing"]'),last=await lines.nth(2).boundingBox();expect((await closing.boundingBox()).y).toBeGreaterThanOrEqual(last.y+last.height);
 expect((await pdfText(page)).match(/\u00A0/g)?.length).toBe(3);
 if(template==='freeform')expect(await page.evaluate(()=>clinical.payload().errors.some(error=>error.id==='document.body'))).toBe(true);
 for(let i=0;i<3;i++){await editParagraph(lines.nth(i));await page.keyboard.insertText('FICTIONAL LINE '+(i+1));}
 const text=await pdfText(page);expect(text).toMatch(/FICTIONAL LINE 1FICTIONAL LINE 2FICTIONAL LINE 3/);expect(text).not.toContain('\u00A0');
 if(template==='freeform')expect(await page.evaluate(()=>clinical.payload().errors.some(error=>error.id==='document.body'))).toBe(false);
});

for(const template of ['referral','freeform'])test(`inserted patient or clinical blocks precede the three writing lines: ${template}`,async({page})=>{
 await open(page,template);await page.evaluate(template=>clinical.addSections([template==='freeform'?'identification':'tbActive']),template);await page.waitForFunction(()=>clinical.layout.stable);await page.keyboard.press('Escape');
 const field=page.locator(`.tiptap [data-field-id="${template==='freeform'?'patient.passport':'tbActive.nextReview'}"]`),lines=page.locator('[data-writing-space]');await expect(lines).toHaveCount(3);
 const last=await field.boundingBox(),first=await lines.first().boundingBox();expect(first.y).toBeGreaterThanOrEqual(last.y+last.height-1);
 await editParagraph(lines.first());await page.keyboard.insertText('FICTIONAL CUSTOM TEXT');await page.evaluate(()=>clinical.addSections(['crag']));await page.waitForFunction(()=>clinical.layout.stable);await page.keyboard.press('Escape');
 const text=await pdfText(page);if(template==='freeform')expect(text.indexOf('FICTIONAL CUSTOM TEXT')).toBeLessThan(text.indexOf('Positive serum cryptococcal antigen'));else expect(text.indexOf('Positive serum cryptococcal antigen')).toBeLessThan(text.indexOf('FICTIONAL CUSTOM TEXT'));expect(text.indexOf('FICTIONAL CUSTOM TEXT')).toBeLessThan(text.indexOf('Please contact Public Health Center'));expect(text.indexOf('Positive serum cryptococcal antigen')).toBeLessThan(text.indexOf('Please contact Public Health Center'));
});

test('Clinical information lists diagnoses and findings while HIV details and administrative blocks have separate groups',async({page})=>{
 await open(page);await openInsert(page);
 const groups=await insertMenu(page).locator('.catalogue-list').evaluate(list=>{const groups={};let current;for(const node of list.children){if(node.matches('h3'))groups[current=node.textContent]=[];else if(node.querySelector('[data-section-choice]'))groups[current].push(node.querySelector('input').dataset.sectionChoice);}return groups;});
 expect(groups['Clinical information']).toEqual(expect.arrayContaining(['hiv','syphilis','tbActive','crag','cmvr']));
 for(const id of ['art','oi','pickup','cd4','viralLoad','identification','dobAge','documentDate','tptCompleted','tptOngoing'])expect(groups['Clinical information']).not.toContain(id);
 expect(groups['HIV details']).toEqual(expect.arrayContaining(['art','oi','pickup','cd4','viralLoad']));
 await insertMenu(page).getByRole('textbox',{name:'Search insert options'}).fill('GeneXpert');await expect(insertMenu(page).locator('[data-section-choice="tbActive"]')).toBeVisible();
});

test('clicking the document title opens the same radio-choice picker as Sex and accepts keyboard selection',async({page})=>{
 await open(page);await page.locator('.tiptap [data-field-id="document.title"]').click();
 const picker=page.getByRole('region',{name:'Document title',exact:true});await expect(picker.getByRole('radio',{name:'Medical Certificate',exact:true})).toBeVisible();await expect(picker.getByRole('combobox')).toHaveCount(0);
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(picker).toHaveCount(0);expect(await pdfText(page)).toContain('Medical Certificate');
});

test('switching templates after hovering late-page prose discards the old insert control',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await open(page);
 await page.evaluate(()=>{clinical.addSections(['otherHistory']);clinical.setValue('history.other',('Fictional long paragraph.\n').repeat(200));});await page.waitForFunction(()=>clinical.layout.stable);
 const point=await page.evaluate(()=>{const text=document.querySelector('[data-field-id="history.other"] .field-content').lastChild,range=document.createRange();range.selectNodeContents(text);const rect=range.getBoundingClientRect();scrollBy(0,rect.top-400);const moved=range.getBoundingClientRect();return {x:moved.left+5,y:moved.top+5};});
 await page.mouse.move(point.x,point.y);await expect(page.getByRole('button',{name:'Insert here',exact:true})).toBeVisible();
 await page.getByLabel('Document template',{exact:true}).selectOption('medical');await zoom(page,150);await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForFunction(()=>clinical.layout.stable);
 await expect(page.locator('.context-insert')).toHaveCount(1);expect(errors).toEqual([]);
});

for(const language of ['th','en'])test(`TB on treatment, positive CrAg and suspected CMVR preserve details through removal, restore and language changes: ${language}`,async({page})=>{
 await open(page,'referral',language);await insertBlocks(page,['tbActive','crag','cmvr'],'clinical');await page.keyboard.press('Escape');
 await page.evaluate(()=>{for(const [id,value]of Object.entries({'patient.name':'FICTIONAL PATIENT','doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ','tbActive.afb':'01/09/2026: 2+','tbActive.xpert':'MTB detected; rifampicin resistance not detected','tbActive.culture':'Culture pending','tbActive.dst':'DST pending','tbActive.lpa':'LPA pending','tbActive.regimen':'Fictional clinician-entered regimen','tbActive.treatmentStart':'01/09/2569','tbActive.regimenStart':'10/2569','tbActive.phase':'continuation','crag.date':'09/10/2569','cmvr.date':'10/10/2569','cmvr.fundus':'Fictional fundus findings'}))clinical.setValue(id,value);});
 for(const value of ['2+','MTB detected','Culture pending','DST pending','LPA pending','Fictional clinician-entered regimen','Fictional fundus findings'])expect(await pdfText(page)).toContain(value);
 expect(await pdfText(page)).toContain(language==='th'?'วันที่ผลตรวจ serum CrAg เป็นบวก 09/10/2569':'Positive serum CrAg test date: 09/10/2026');
 await page.locator('.section-panel > details').evaluate(details=>details.open=true);await page.locator('[data-section-control="tbActive"]').getByRole('button',{name:/^Remove:/}).click();expect(await pdfText(page)).not.toContain('Fictional clinician-entered regimen');
 await insertBlocks(page,['tbActive'],'clinical');await page.keyboard.press('Escape');expect(await pdfText(page)).toContain('Fictional clinician-entered regimen');
 await page.getByLabel('Letter language',{exact:true}).selectOption(language==='th'?'en':'th');expect(await pdfText(page)).toContain('Fictional fundus findings');expect(await pdfText(page)).toContain('Fictional clinician-entered regimen');
 await page.getByLabel('Document template',{exact:true}).selectOption('medical');await page.getByLabel('Document template',{exact:true}).selectOption('referral');expect(await pdfText(page)).toContain('Fictional clinician-entered regimen');
});

test('multi-page focus borders follow each paper and zoom never enlarges the browser canvas',async({page})=>{
 await open(page);await page.evaluate(()=>{clinical.addSections(['otherHistory']);clinical.setValue('history.other',('ภาษาไทย Mixed English test.\n').repeat(150));});await page.waitForFunction(()=>clinical.layout.stable&&clinical.layout.pages>1);
 const before=await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()));
 for(const width of [1440,900]){await page.setViewportSize({width,height:1000});for(const value of [50,100,150,200]){
  await zoom(page,value);await page.evaluate(()=>clinical.editor.view.focus());
  await expect(page.locator('.tiptap')).toHaveCSS('outline-style','none');
  const papers=await page.locator('.paper').evaluateAll(nodes=>nodes.map(node=>({outline:getComputedStyle(node).outlineStyle,offset:getComputedStyle(node).outlineOffset})));for(const paper of papers)expect(paper).toEqual({outline:'solid',offset:'-2px'});
  const edge=await page.locator('.canvas-scroll').evaluate(canvas=>{canvas.scrollLeft=canvas.scrollWidth;const rect=canvas.querySelector('.paper').getBoundingClientRect(),bounds=canvas.getBoundingClientRect();return {right:rect.right,canvasRight:bounds.right,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};});expect(edge.right).toBeLessThanOrEqual(edge.canvasRight+1);expect(edge.bodyWidth).toBe(edge.viewport);
 }}expect(await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()))).toBe(before);
});

for(const language of ['th','en'])test(`native copy and paste outside the editor preserve text and choices without control characters: ${language}`,async({page})=>{
 await open(page,'referral',language);await page.evaluate(()=>{clinical.setValue('patient.name','FICTIONAL ผู้ป่วย / example');clinical.setValue('patient.sex','Male');clinical.setValue('travel.archived.name','ARCHIVE_ONLY_VALUE');clinical.addSections(['mpox']);clinical.setValue('mpox.symptoms',['feverChills']);clinical.setValue('mpox.risks',['noneKnown']);clinical.setValue('mpox.riskOther','HIDDEN_RESULT');clinical.setValue('mpox.days','3');const e=clinical.editor;e.commands.selectAll();e.view.focus();});
 const before=await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON())),serialized=await page.evaluate(()=>{const e=clinical.editor,{dom,text}=e.view.serializeForClipboard(e.state.selection.content());return {html:dom.innerHTML,text};});
 await page.keyboard.press('ControlOrMeta+c');await page.evaluate(()=>{const target=document.createElement('textarea');target.id='clipboard-target';document.body.prepend(target);target.focus();});await page.keyboard.press('ControlOrMeta+v');
 const text=await page.locator('#clipboard-target').inputValue();expect(text).toBe(serialized.text);expect(text).toContain('FICTIONAL ผู้ป่วย / example');expect(text).toContain(language==='th'?'ชาย':'Male');
 for(const value of [text,serialized.html])expect(value).not.toMatch(/[\u200B\uFEFF\uFFFC\uFFFD×▾]|ARCHIVE_ONLY_VALUE|HIDDEN_RESULT|data-clinical-session/);
 expect(text).not.toContain('Patient name');expect(text).not.toContain('Type text or / to insert');expect(await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()))).toBe(before);
 await page.evaluate(()=>{const e=clinical.editor;let entry;e.state.doc.descendants((node,pos)=>{if(node.type.name==='field'&&node.attrs.id==='patient.name')entry={node,pos};});e.commands.setTextSelection({from:entry.pos+1,to:entry.pos+entry.node.nodeSize-1});e.view.focus();});await page.keyboard.press('ControlOrMeta+c');await page.locator('#clipboard-target').fill('');await page.locator('#clipboard-target').focus();await page.keyboard.press('ControlOrMeta+v');expect(await page.locator('#clipboard-target').inputValue()).toBe('FICTIONAL ผู้ป่วย / example');
});
