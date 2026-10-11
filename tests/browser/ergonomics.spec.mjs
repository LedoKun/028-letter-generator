import {test,expect} from '@playwright/test';

async function open(page,language='en'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto('/referral/');await expect(page.locator('.tiptap')).toBeFocused();
}
const field=(page,id)=>page.locator(`.tiptap [data-field-id="${id}"]`).filter({visible:true}).first();
const menu=page=>page.locator('.editor-dropdown[data-occurrence]');
const active=page=>page.evaluate(()=>clinical.editor.state.selection.$from.parent.attrs.id);
const values=page=>page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values);
async function paste(page,text){await page.evaluate(text=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:type=>type==='text/plain'?text:''}});document.querySelector('.tiptap').dispatchEvent(event);},text);}

for(const language of ['th','en']){
 test(`choice fields open automatically and Enter/Tab apply highlighted choices: ${language}`,async({page})=>{
  await open(page,language);await field(page,'patient.salutation').click();await expect(menu(page)).toBeVisible();await expect(page.locator('.tiptap')).toBeFocused();
  await page.keyboard.press('ArrowDown');const first=await menu(page).locator('.is-current-choice input').getAttribute('data-choice-value');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowUp');expect(await menu(page).locator('.is-current-choice input').getAttribute('data-choice-value')).toBe(first);
  await page.keyboard.press('Enter');await expect(menu(page)).toHaveCount(0);expect(await active(page)).toBe('patient.salutation');expect((await values(page))['patient.salutation'].value).toBe(first);
  await field(page,'patient.salutation').click();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');const second=await menu(page).locator('.is-current-choice input').getAttribute('data-choice-value');await page.keyboard.press('Tab');
  expect(await active(page)).toBe('patient.name');expect((await values(page))['patient.salutation'].value).toBe(second);await expect(menu(page)).toHaveCount(0);
 });
 test(`Enter without a choice only closes; Tab without a choice advances and keeps the value: ${language}`,async({page})=>{
  await open(page,language);await page.evaluate(()=>clinical.setValue('patient.salutation','MR.'));await field(page,'patient.salutation').click();await page.keyboard.press('Enter');
  expect(await active(page)).toBe('patient.salutation');await expect(menu(page)).toHaveCount(0);expect((await values(page))['patient.salutation'].value).toBe('MR.');
  await field(page,'patient.salutation').click();await page.keyboard.press('Tab');expect(await active(page)).toBe('patient.name');expect((await values(page))['patient.salutation'].value).toBe('MR.');
  await page.evaluate(()=>clinical.setValue('patient.salutation',''));await field(page,'patient.salutation').click();await page.keyboard.press('Enter');await expect(menu(page)).toHaveCount(0);expect((await values(page))['patient.salutation'].value).toBe('');
 });
 test(`multiple choices work with arrows/Space and still support mouse selection: ${language}`,async({page})=>{
  await open(page,language);await page.evaluate(()=>{clinical.addSections(['mpox']);clinical.setValue('mpox.days','4');});await field(page,'mpox.symptoms').click();
  const expected=[];for(let i=0;i<2;i++){await page.keyboard.press('ArrowDown');expected.push(await menu(page).locator('.is-current-choice input').getAttribute('data-choice-value'));await page.keyboard.press('Space');}
  await page.keyboard.press('Enter');expect((await values(page))['mpox.symptoms'].value).toEqual(expected);await expect(menu(page)).toHaveCount(0);
  await field(page,'mpox.symptoms').click();await menu(page).locator('[data-choice-value="headache"]').check();await page.keyboard.press('Tab');expect((await values(page))['mpox.symptoms'].value).toContain('headache');expect(await active(page)).toBe('mpox.risks');await expect(menu(page)).toBeVisible();
  await page.keyboard.press('Alt+ArrowDown');await menu(page).getByLabel('Search options').fill('noneKnown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');expect((await values(page))['mpox.risks'].value).toEqual(['noneKnown']);
  await field(page,'mpox.risks').click();await menu(page).locator('[data-choice-value="directContact"]').check();await page.keyboard.press('Tab');expect((await values(page))['mpox.risks'].value).toEqual(['directContact']);
 });
}
test('dropdown scrolling does not move document text or change pagination',async({page})=>{
 await open(page);await page.evaluate(()=>{clinical.addSections(['mpox']);clinical.setValue('mpox.days','4');});await field(page,'mpox.risks').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>clinical.layout.stable);
 const geometry=()=>page.evaluate(()=>({height:document.querySelector('.tiptap').getBoundingClientRect().height,signature:document.querySelector('[data-clinical-group="signature"]').getBoundingClientRect().top,pages:clinical.layout.pages}));
 const before=await geometry();await page.keyboard.press('Alt+ArrowDown');await expect(menu(page)).toHaveCSS('position','fixed');await expect(page.locator('.tiptap .editor-dropdown')).toHaveCount(0);
 expect(await geometry()).toEqual(before);for(let i=0;i<10;i++)await page.keyboard.press('ArrowDown');expect(await geometry()).toEqual(before);
 const rect=await menu(page).boundingBox();expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(1000);await page.keyboard.press('Escape');expect(await geometry()).toEqual(before);
});
test('search filtering with no results closes without changing the value',async({page})=>{
 await open(page);await page.evaluate(()=>clinical.setValue('patient.salutation','MR.'));await field(page,'patient.salutation').locator('.inline-choice').click();await menu(page).getByLabel('Search options').fill('no matching catalogue item');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(menu(page)).toHaveCount(0);expect((await values(page))['patient.salutation'].value).toBe('MR.');
});
test('Enter commits a directly typed choice, and letter-language changes refresh its menu',async({page})=>{
 await open(page);await page.evaluate(()=>clinical.addSections(['hiv']));await field(page,'hiv.adherence').click();await page.keyboard.insertText('Unknown');await page.keyboard.press('Enter');
 expect((await values(page))['hiv.adherence'].value).toBe('Unknown');expect((await values(page))['hiv.adherence'].editing).toBe(false);await expect(menu(page)).toHaveCount(0);await expect(field(page,'hiv.adherence')).toHaveAttribute('aria-invalid','false');
 await field(page,'hiv.adherence').click();await page.getByLabel('Letter language',{exact:true}).selectOption('th');await expect(menu(page)).toHaveCount(0);await field(page,'hiv.adherence').click();await expect(menu(page).locator('[data-choice-value="Unknown"]').locator('..')).toContainText('ไม่ทราบ');
});
test('Escape preserves pending choices and Shift+Tab goes to the previous field',async({page})=>{
 await open(page);await page.evaluate(()=>clinical.setValue('patient.salutation','MR.'));await field(page,'patient.salutation').click();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');
 expect((await values(page))['patient.salutation'].value).toBe('MR.');await expect(menu(page)).toHaveCount(0);await field(page,'patient.salutation').click();await page.keyboard.press('Shift+Tab');expect(await active(page)).toBe('referral.purposes');
});
test('typing dates without slashes is bounded, validated and converted after completion',async({page})=>{
 await open(page,'th');await field(page,'patient.dob').click();await expect(field(page,'patient.dob')).toHaveAttribute('title',/DD\/MM\/YYYY.*CE\/BE.*do not need to enter "\/"/);await expect(field(page,'patient.dob')).toHaveAttribute('data-max-length','10');
 await page.keyboard.type('101020001234');await expect(field(page,'patient.dob').locator('.field-content')).toHaveText('10/10/2000');await page.keyboard.press('Tab');expect((await values(page))['patient.dob'].value).toBe('2000-10-10');await expect(field(page,'patient.dob').locator('.field-content')).toHaveText('10/10/2543');
 await field(page,'patient.dob').click();await paste(page,'11/11/20000');expect((await values(page))['patient.dob'].value).toBe('2000-10-10');await expect(page.locator('.validation-banner')).toContainText('existing value was kept');
 await paste(page,'31/02/2026');await page.keyboard.press('Tab');await expect(field(page,'patient.dob')).toHaveAttribute('aria-invalid','true');expect((await values(page))['patient.dob'].value).toBe('31/02/2026');
 await field(page,'patient.dob').click();await paste(page,'29022567');await page.keyboard.press('Tab');expect((await values(page))['patient.dob'].value).toBe('2024-02-29');await expect(field(page,'patient.dob')).toHaveAttribute('aria-invalid','false');
});
test('month/year fields keep their precision, hint and six-digit limit',async({page})=>{
 await open(page);await page.evaluate(()=>clinical.addSections(['tptCompleted']));await page.keyboard.press('Tab');await field(page,'tpt.completed.start').click();await expect(field(page,'tpt.completed.start')).toHaveAttribute('title',/MM\/YYYY.*CE\/BE/);
 await page.keyboard.type('0920229');await expect(field(page,'tpt.completed.start').locator('.field-content')).toHaveText('09/2022');await page.keyboard.press('Tab');expect((await values(page))['tpt.completed.start'].value).toBe('2022-09');
});
test('National ID has a format hint and typing/pasting cannot exceed its limit',async({page})=>{
 await open(page);await field(page,'patient.nationalId').click();await expect(field(page,'patient.nationalId')).toHaveAttribute('title',/1-2345-67890-12-3.*13 digits/);await expect(field(page,'patient.nationalId')).toHaveAttribute('data-max-length','17');
 await page.keyboard.type('1234567890123456');await expect(field(page,'patient.nationalId').locator('.field-content')).toHaveText('1-2345-67890-12-3');await page.keyboard.press('Tab');await field(page,'patient.nationalId').click();await paste(page,'12345678901234');
 expect((await values(page))['patient.nationalId'].value).toBe('1-2345-67890-12-3');await expect(page.locator('.validation-banner')).toContainText('existing value was kept');
});
test('last field tabs to Preview, then to the date without opening a PDF',async({page})=>{
 await open(page);await field(page,'doctor.license').click();await page.locator('.tiptap [data-field-id="doctor.license"]').last().click();const before=await values(page);
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'PDF Preview',exact:true})).toBeFocused();await expect(page.locator('dialog[open]')).toHaveCount(0);await page.keyboard.press('Tab');expect(await active(page)).toBe('document.date');
 expect(await values(page)).toEqual(before);await page.keyboard.insertText('09102026');await page.keyboard.press('Tab');expect((await values(page))['document.date'].value).toBe('2026-10-09');expect(await active(page)).toBe('document.addressee');
});
test('Preview returns to the document date even after its paragraph is moved',async({page})=>{
 await open(page);await page.evaluate(()=>{const e=clinical.editor,date=e.state.doc.child(1),start=e.state.doc.firstChild.nodeSize;e.view.dispatch(e.state.tr.delete(start,start+date.nodeSize).insert(e.state.doc.content.size-date.nodeSize,date));});
 await page.getByRole('button',{name:'PDF Preview',exact:true}).focus();await page.keyboard.press('Tab');expect(await active(page)).toBe('document.date');
});
