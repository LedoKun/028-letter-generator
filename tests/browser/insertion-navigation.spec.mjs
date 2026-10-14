import {openInsert} from './insert-helpers.mjs';
import {test,expect} from '@playwright/test';
async function open(page,language='en',type='referral'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 await page.goto(type==='medical'?'/medical-certificate/':'/referral/');await expect(page.locator('.tiptap')).toBeFocused();await page.locator('.section-panel > details').evaluate(details=>details.open=true);
}
const field=(page,id)=>page.locator(`.tiptap [data-field-id="${id}"]`).filter({visible:true}).first();
const point=(page,id)=>page.locator(`.tiptap [data-insertion-point="${id}"] > button`);
const active=page=>page.evaluate(()=>clinical.editor.state.selection.$from.parent.attrs.id);
const state=page=>page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()));
const blockMenu=page=>page.getByRole('dialog',{name:'Insert',exact:true});
async function reachClinical(page){await field(page,'patient.passport').click();await page.keyboard.press('Tab');await expect(point(page,'clinical')).toBeFocused();await page.keyboard.press('/');await expect(blockMenu(page)).toBeVisible();}

for(const language of ['th','en']){
 test(`Tab reaches the diagnosis button and adds a block into its first field: ${language}`,async({page})=>{
  await open(page,language);await reachClinical(page);await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');await expect(page.locator('[data-section-id="hiv"]')).toHaveCount(1);expect(await active(page)).toBe('hiv.napId');
  await page.keyboard.type('1234567890');await page.keyboard.press('Tab');expect(await active(page)).toBe('hiv.diagnosed');expect(await page.evaluate(()=>clinical.editor.state.doc.firstChild.attrs.values['hiv.napId'].value)).toBe('1234-567890');
 });
 test(`Enter closes an empty block menu; Tab skips to closing requests and the next field: ${language}`,async({page})=>{
  await open(page,language);await reachClinical(page);const before=await state(page);await page.keyboard.press('Enter');await expect(blockMenu(page)).toHaveCount(0);await expect(point(page,'clinical')).toBeFocused();expect(await state(page)).toBe(before);
  await page.keyboard.press('Tab');await expect(point(page,'closing')).toBeFocused();await page.keyboard.press('/');await expect(blockMenu(page)).toBeVisible();await page.keyboard.press('Tab');expect(await active(page)).toBe('attachments.lab');
  await page.keyboard.press('Shift+Tab');await expect(point(page,'closing')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(point(page,'clinical')).toBeFocused();await page.keyboard.press('Shift+Tab');expect(await active(page)).toBe('patient.passport');
  expect(await state(page)).toBe(before);
 });
 test(`multiple keyboard block selections add together and focus the first added placeholder: ${language}`,async({page})=>{
  await open(page,language);await reachClinical(page);for(let i=0;i<2;i++){await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');}await page.keyboard.press('Tab');
  await expect(page.locator('[data-section-id="hiv"]')).toHaveCount(1);await expect(page.locator('[data-section-id="syphilis"]')).toHaveCount(1);expect(await active(page)).toBe('hiv.napId');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-section-id="hiv"],[data-section-id="syphilis"]')).toHaveCount(0);await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('[data-section-id="hiv"]')).toHaveCount(1);await expect(page.locator('[data-section-id="syphilis"]')).toHaveCount(1);
 });
 test(`a fieldless closing block advances to the next field, then enclosures can be added: ${language}`,async({page})=>{
  await open(page,language);await reachClinical(page);await page.keyboard.press('Tab');await page.keyboard.press('/');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
  await expect(page.locator('[data-section-id="financial"]')).toHaveCount(1);expect(await active(page)).toBe('attachments.lab');await page.keyboard.press('Tab');await expect(point(page,'enclosures')).toBeFocused();
  await page.keyboard.press('/');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');await expect(page.locator('[data-section-id="attachments"]')).toHaveCount(1);expect(await active(page)).toBe('attachments.other');
 });
 test(`keyboard restoration retains existing values and excludes disallowed blocks: ${language}`,async({page})=>{
  await open(page,language);await page.evaluate(()=>{clinical.addSections(['hcvHistory']);clinical.setValue('hcv.regimen','Preserved regimen');});await page.locator('[data-section-control="hcvHistory"]').getByRole('button',{name:/^Remove:/}).click();await openInsert(page,'clinical');
  await expect(blockMenu(page).locator('[data-section-choice="physician"]')).toHaveCount(0);await blockMenu(page).getByLabel('Search insert options').fill('Treated HCV');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
  expect(await active(page)).toBe('hcv.regimen');await expect(field(page,'hcv.regimen').locator('.field-content')).toHaveText('Preserved regimen');
 });
}
test('medical-certificate insertion is reachable by Tab and opens the inserted examination date',async({page})=>{
 await open(page,'en','medical');await field(page,'patient.passport').click();await page.keyboard.press('Tab');await expect(point(page,'clinical')).toBeFocused();await page.keyboard.press('/');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');expect(await active(page)).toBe('examination.date');
 await page.keyboard.type('10102026');await page.keyboard.press('Tab');expect(await active(page)).toBe('examination.findings');
});
test('Tab visits medicine commands without adding rows; Enter adds and focuses a medicine',async({page})=>{
 await open(page);await page.evaluate(()=>clinical.addSections(['hiv']));await field(page,'hiv.latestVLDate').click();await page.keyboard.press('Tab');await expect(point(page,'medicine:art')).toBeFocused();await expect(page.locator('[data-kind="art"]')).toHaveCount(0);
 await page.keyboard.press('Tab');await expect(point(page,'hiv.optional')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(point(page,'medicine:art')).toBeFocused();await page.keyboard.press('/');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await expect(page.locator('[data-kind="art"]')).toHaveCount(1);expect(await active(page)).toMatch(/^art\..*\.name$/);await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');expect(await active(page)).toMatch(/^art\..*\.tablets$/);
});
test('Escape and a search with no results close insertion menus without modifying the document',async({page})=>{
 await open(page);await reachClinical(page);const before=await state(page);await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await page.keyboard.press('Escape');await expect(blockMenu(page)).toHaveCount(0);await expect(point(page,'clinical')).toBeFocused();expect(await state(page)).toBe(before);
 await page.keyboard.press('/');await blockMenu(page).getByLabel('Search insert options').fill('no supported block matches this');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');await expect(point(page,'closing')).toBeFocused();expect(await state(page)).toBe(before);
});
