import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

const routes={referral:'referral',medical:'medical-certificate',medication:'certificate-medication-letter',freeform:'free-form-letter'};
async function open(page,template='referral',language='en'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto('/'+routes[template]+'/');await expect(page.locator('.tiptap')).toBeFocused();
}
const flatten=x=>Array.isArray(x)?x.map(flatten).join(''):!x||typeof x!=='object'?'':(typeof x.text==='string'?x.text:flatten(x.text))+flatten(x.stack)+flatten(x.ul)+flatten(x.ol);
const content=page=>page.evaluate(()=>clinical.payload().payload.content);
const text=async page=>flatten(await content(page));
const paragraphs=page=>page.evaluate(()=>{let count=0;clinical.editor.state.doc.descendants(node=>{if(node.type.name==='paragraph')count++;});return count;});

for(const language of ['th','en'])test(`paragraph prompts move intact onto the next A4 page and remain editable: ${language}`,async({page})=>{
 await open(page,'referral',language);await page.waitForFunction(()=>clinical.layout.stable);
 const probe=await page.evaluate(()=>{const editor=clinical.editor;let pos;editor.state.doc.descendants((node,p)=>{if(node.type.name==='clinicalGroup'&&node.attrs.id==='clinical')pos=p+1;});editor.commands.insertContentAt(pos,{type:'paragraph',content:[{type:'text',text:'FICTIONAL PAGINATION CHECK'}]});return pos;});
 await page.waitForFunction(()=>clinical.layout.stable);
 await page.evaluate(pos=>{const editor=clinical.editor,paragraph=editor.view.nodeDOM(pos),prompt=paragraph.nextElementSibling,origin=editor.view.dom.getBoundingClientRect().top,end=(297-30)*96/25.4,gap=end-8-(prompt.getBoundingClientRect().top-origin);editor.view.dispatch(editor.state.tr.setNodeMarkup(pos,null,{...editor.state.doc.nodeAt(pos).attrs,spacingAfter:(parseFloat(getComputedStyle(paragraph).marginBottom)+gap)*72/96}));},probe);
 await page.waitForFunction(()=>clinical.layout.stable&&clinical.layout.pages>1);
 const prompt=page.locator('[data-insertion-point="clinical"]').locator('xpath=preceding-sibling::*[1]');await expect(prompt).toHaveAttribute('data-paragraph-prompt','');await expect(prompt.locator('.page-spacer')).toHaveCount(0);
 const bounds=await prompt.evaluate(node=>{const r=node.getBoundingClientRect(),origin=node.closest('.tiptap').getBoundingClientRect().top,page=297*96/25.4+24,index=Math.floor((r.top-origin)/page);return {height:r.height,index,top:r.top-origin-index*page,bottom:r.bottom-origin-index*page};});
 expect(bounds.height).toBeCloseTo(16,0);expect(bounds.index).toBe(1);expect(bounds.top).toBeGreaterThanOrEqual(34*96/25.4-1);expect(bounds.bottom).toBeLessThanOrEqual((297-30)*96/25.4+1);
 await prompt.click();await page.keyboard.insertText('EDITED ON THE NEXT PAGE');expect(await text(page)).toContain('EDITED ON THE NEXT PAGE');expect(await text(page)).not.toMatch(/Click to add a paragraph|คลิกเพื่อเพิ่มย่อหน้า/);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(prompt).toHaveAttribute('data-paragraph-prompt','');await expect(prompt.locator('.page-spacer')).toHaveCount(0);
 await page.evaluate(pos=>{const editor=clinical.editor;editor.commands.deleteRange({from:pos,to:pos+editor.state.doc.nodeAt(pos).nodeSize});},probe);await page.waitForFunction(()=>clinical.layout.stable&&clinical.layout.pages===1);await expect(prompt).toHaveAttribute('data-paragraph-prompt','');
});

for(const language of ['th','en'])for(const template of Object.keys(routes)){
 test(`typing around Add buttons preserves paragraphs, blank lines and hard breaks: ${template}/${language}`,async({page})=>{
  await open(page,template,language);
  const points=await page.locator('.tiptap [data-insertion-point]').evaluateAll(nodes=>nodes.map(node=>node.dataset.insertionPoint));
  const targets=points.length?points:['body'];
  for(const id of targets){
   const point=page.locator(`[data-insertion-point="${id}"]`),before=id==='body'?page.locator('[data-letter-body] > p').first():point.locator('xpath=preceding-sibling::*[1]');
   await expect(before).toHaveAttribute('data-paragraph-prompt','');await before.click();
   expect(await page.evaluate(()=>clinical.editor.state.selection.$from.parent.type.name)).toBe('paragraph');
   const marker=language==='th'?`ข้อความก่อน ${id}`:`BEFORE ${id}`;
   await page.keyboard.insertText(marker);await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.insertText(`SECOND ${id}`);await page.keyboard.press('Shift+Enter');await page.keyboard.insertText(`THIRD ${id}`);
   if(id!=='body'){const after=point.locator('xpath=following-sibling::*[1]');await expect(after).toHaveAttribute('data-paragraph-prompt','');await after.click();await page.keyboard.insertText(`AFTER ${id}`);}
   const pdf=await content(page),exported=flatten(pdf);expect(exported).toContain(marker);expect(exported).toContain(`SECOND ${id}\nTHIRD ${id}`);if(id!=='body')expect(exported).toContain(`AFTER ${id}`);
  }
  const pdf=await content(page);expect(JSON.stringify(pdf).match(/\\u00a0| /gi)?.length).toBe(targets.length);expect(JSON.stringify(pdf)).not.toMatch(/Click to add a paragraph|คลิกเพื่อเพิ่มย่อหน้า|prosePlaceholder/);
  if(template==='freeform')expect(await page.evaluate(()=>clinical.payload().errors.some(error=>error.id==='document.body'))).toBe(false);
 });
 test(`edited optional wording and Enter within a label export: ${template}/${language}`,async({page})=>{
  await open(page,template,language);if(template==='referral')await page.evaluate(()=>clinical.addSections(['hiv']));if(template==='medical')await page.evaluate(()=>clinical.addSections(['comments']));
  if(template==='freeform')await page.evaluate(()=>clinical.setValue('doctor.license',''));
  const id={referral:'hiv.napId',medical:'doctor.comments',medication:'patient.passport',freeform:'doctor.license'}[template];
  await page.evaluate(id=>{const e=clinical.editor;let position;e.state.doc.descendants((node,pos)=>{if(node.type.name==='field'&&node.attrs.id===id)position=pos-1;});e.commands.setTextSelection(position);e.view.focus();},id);
  const count=await paragraphs(page),marker=language==='th'?'ข้อความที่แก้ไข':'EDITED WORDING';
  await page.keyboard.insertText(marker);await page.keyboard.press('Enter');await page.keyboard.press('Enter');expect(await paragraphs(page)).toBe(count+2);await page.keyboard.insertText('SECOND EDITED LINE');
  expect(JSON.stringify(await content(page))).toContain(' ');
  expect(await text(page)).toContain(marker);expect(await text(page)).toContain('SECOND EDITED LINE');
  await page.getByLabel('Letter language',{exact:true}).selectOption(language==='th'?'en':'th');expect(await text(page)).toContain(marker);
  await page.getByLabel('Document template',{exact:true}).selectOption(template==='medical'?'referral':'medical');await page.getByLabel('Document template',{exact:true}).selectOption(template);expect(await text(page)).toContain(marker);
 });
}
test('Insert Paragraph leaves the current field intact and supports Undo/Redo',async({page})=>{
 await open(page);const before=await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['document.addressee']);
 await page.getByRole('button',{name:'Insert Paragraph',exact:true}).click();await page.keyboard.insertText('INSERTED PARAGRAPH');
 expect(await text(page)).toContain('INSERTED PARAGRAPH');expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['document.addressee'])).toEqual(before);
 await page.getByRole('button',{name:'Undo',exact:true}).click();expect(await text(page)).not.toContain('INSERTED PARAGRAPH');await page.getByRole('button',{name:'Redo',exact:true}).click();expect(await text(page)).toContain('INSERTED PARAGRAPH');
});
for(const language of ['th','en'])test(`pasted prose retains blank lines, formatting and section restoration: ${language}`,async({page})=>{
 await open(page,'referral',language);await page.evaluate(()=>clinical.addSections(['hiv']));
 const point=page.locator('[data-insertion-point="medicine:art"]'),prompt=point.locator('xpath=following-sibling::*[1]');await expect(prompt).toHaveAttribute('data-paragraph-prompt','');await prompt.click();
 await page.evaluate(()=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:type=>type==='text/plain'?'PASTED FIRST\n\nPASTED SECOND':''}});clinical.editor.view.dom.dispatchEvent(event);});
 expect(await text(page)).toContain('PASTED FIRST');expect(await text(page)).toContain('PASTED SECOND');expect(JSON.stringify(await content(page))).toContain(' ');
 await page.keyboard.press('ControlOrMeta+b');await page.keyboard.insertText(' BOLD PROSE');await page.keyboard.press('ControlOrMeta+b');
 const pdf=await content(page);expect(JSON.stringify(pdf)).toMatch(/"text":" BOLD PROSE"[^}]*"bold":true/);
 await page.locator('[data-section-control="hiv"]').getByRole('button',{name:/^Remove:/}).click();expect(await text(page)).not.toContain('PASTED FIRST');await page.getByRole('button',{name:'Restore: Retroviral Infection',exact:true}).click();expect(await text(page)).toContain('PASTED FIRST');expect(await text(page)).toContain('BOLD PROSE');
});
for(const language of ['th','en'])test(`actual preview and downloaded PDFs retain manual text and its blank line: ${language}`,async({page})=>{
 await open(page,'referral',language);await page.evaluate(()=>{for(const [id,value]of Object.entries({'patient.name':'FICTIONAL PATIENT','doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ','doctor.license':'12345'}))clinical.setValue(id,value);clinical.addSections(['hiv']);});
 const before=page.locator('[data-insertion-point="clinical"]').locator('xpath=preceding-sibling::*[1]');await before.click();await page.keyboard.insertText('FIRSTPARAGRAPH');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.insertText('SECONDPARAGRAPH');
 await page.evaluate(()=>{const e=clinical.editor;let pos;e.state.doc.descendants((node,p)=>{if(node.type.name==='field'&&node.attrs.id==='hiv.napId')pos=p-1;});e.commands.setTextSelection(pos);e.view.focus();});await page.keyboard.insertText('MANUALEDIT');
 await page.evaluate(()=>{const generate=PdfGenerator.generateBlob;PdfGenerator.generateBlob=async payload=>{const blob=await generate(payload);window.previewBytes=[...new Uint8Array(await blob.arrayBuffer())];return blob;};});
 const state=await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()));await page.getByRole('button',{name:'PDF Preview',exact:true}).click();await expect(page.locator('.preview-frame')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
 expect(await page.evaluate(()=>clinical.payload().errors)).toEqual([]);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();const downloaded=await download;
 for(const bytes of [Buffer.from(await page.evaluate(()=>window.previewBytes)),await readFile(await downloaded.path())]){
  const extracted=execFileSync('pdftotext',['-layout','-','-'],{input:bytes,encoding:'utf8'});expect(extracted).toContain('MANUALEDIT');expect(extracted).toMatch(/FIRSTPARAGRAPH\s*\n\s*\n\s*SECONDPARAGRAPH/);expect(extracted).not.toMatch(/Click to add a paragraph|คลิกเพื่อเพิ่มย่อหน้า/);
 }
 expect(await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()))).toBe(state);
 await page.evaluate(()=>{PdfGenerator.print=async payload=>{window.printedContent=payload.content;};});await page.getByRole('button',{name:'Print',exact:true}).click();expect(flatten(await page.evaluate(()=>window.printedContent))).toBe(await text(page));
});
