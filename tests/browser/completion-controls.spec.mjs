import {openInsert,insertBlocks} from './insert-helpers.mjs';
import {test,expect} from '@playwright/test';
async function open(page,language='en',template='referral'){
 await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});await page.addInitScript(language=>localStorage.setItem('documentLanguage',language),language);
 const routes={referral:'referral',medical:'medical-certificate',medication:'certificate-medication-letter',freeform:'free-form-letter'};
 await page.goto('/'+routes[template]+'/');await expect(page.locator('.tiptap')).toBeFocused();await page.locator('.section-panel > details').evaluate(details=>details.open=true);
}
const field=(page,id)=>page.locator(`.tiptap [data-field-id="${id}"]`).filter({visible:true}).first();
const point=(page,id)=>page.locator(`.tiptap [data-insertion-point="${id}"] > button`);
const active=page=>page.evaluate(()=>clinical.editor.state.selection.$from.parent.attrs.id);
const menu=page=>page.getByRole('dialog',{name:'Insert',exact:true});
async function selectAll(page,id){
 await openInsert(page,id);const choices=menu(page).locator('[data-section-choice]');
 for(const choice of await choices.all())await choice.check();await menu(page).getByRole('button',{name:'Insert selected blocks',exact:true}).click();
}
for(const language of ['th','en']){
 for(const template of ['referral','medical','medication','freeform'])test(`blank line after the title remains in the editor and PDF: ${template}/${language}`,async({page})=>{
  await open(page,language,template);const heading=page.locator('.tiptap h1'),blank=heading.locator('xpath=following-sibling::*[1]');
  await expect(blank).toHaveAttribute('role','titleSpace');await expect(blank).toHaveText('');
  const [titleBox,blankBox]=await Promise.all([heading.boundingBox(),blank.boundingBox()]);expect(blankBox.height).toBeGreaterThan(10);expect(blankBox.y).toBeGreaterThanOrEqual(titleBox.y+titleBox.height);
  const exported=await page.evaluate(()=>{const blocks=clinical.payload().payload.content,index=blocks.findIndex(block=>block.fontSize===16);return blocks[index+1];});expect(exported).toEqual({text:'',margin:[0,0,0,8]});
  await expect(page.locator('.official-header strong').first()).toContainText('Public Health Center 28 Krung Thon Buri');await expect(page.locator('.official-header strong').first()).not.toContainText('28 -');
  const logo=page.locator('.official-header img').first();await expect(logo).toHaveAttribute('src','/media/logo/028-logo.png');
  await logo.evaluate(image=>image.decode());const dimensions=await logo.evaluate(image=>({height:image.getBoundingClientRect().height,width:image.getBoundingClientRect().width,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight}));
  expect(dimensions.height).toBeCloseTo(223*1182/5300*96/72,1);expect(dimensions.width/dimensions.height).toBeCloseTo(800/202,2);expect(dimensions.naturalWidth).toBe(800);expect(dimensions.naturalHeight).toBe(202);
 });
 test(`TMX/SMP menu adds the block, hides its insertion point and restores entered values: ${language}`,async({page})=>{
  await open(page,language);await page.evaluate(()=>clinical.addSections(['hiv']));await insertBlocks(page,['oi'],'hiv.optional');
  await expect(page.locator('[data-section-id="hiv"] [data-section-id="oi"]')).toHaveCount(1);await expect(menu(page)).toHaveCount(0);expect(await active(page)).toBe('oi.tablets');await expect(point(page,'hiv.optional')).toBeHidden();
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-section-id="oi"]')).toHaveCount(0);await expect(point(page,'hiv.optional')).toBeVisible();
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(point(page,'hiv.optional')).toBeHidden();await page.evaluate(()=>clinical.setValue('oi.tablets','2'));
  await page.locator('[data-section-control="oi"]').getByRole('button',{name:/^Remove:/}).click();await expect(point(page,'hiv.optional')).toBeVisible();await insertBlocks(page,['oi'],'hiv.optional');await expect(field(page,'oi.tablets').locator('.field-content')).toHaveText('2');await expect(menu(page)).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');await expect(point(page,'medicine:art')).toBeFocused();await page.keyboard.press('Tab');expect(await active(page)).toBe('oi.tablets');
 });
 test(`Tab visits TMX/SMP without insertion; slash and Enter insert: ${language}`,async({page})=>{
  await open(page,language);await page.evaluate(()=>clinical.addSections(['hiv']));await field(page,'hiv.latestVLDate').click();await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  await expect(point(page,'hiv.optional')).toBeFocused();await expect(menu(page)).toHaveCount(0);await expect(page.locator('[data-section-id="oi"]')).toHaveCount(0);
  await page.keyboard.press('Tab');expect(await active(page)).toBe('pickup.date');await page.keyboard.press('Shift+Tab');await page.keyboard.press('/');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');expect(await active(page)).toBe('oi.tablets');await expect(point(page,'hiv.optional')).toBeHidden();
 });
 test(`all diagnoses hide their Add button; removal and Undo restore availability: ${language}`,async({page})=>{
  await open(page,language);await selectAll(page,'clinical');await expect(point(page,'clinical')).toBeHidden();expect(await active(page)).toBe('hiv.napId');
  await page.locator('[data-section-control="hbv"]').getByRole('button',{name:/^Remove:/}).click();await expect(point(page,'clinical')).toBeVisible();await openInsert(page,'clinical');await expect(menu(page).locator('[data-section-choice]')).toHaveCount(1);await expect(menu(page).locator('[data-section-choice="hbv"]')).toHaveCount(1);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(point(page,'clinical')).toBeHidden();await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(point(page,'clinical')).toBeVisible();
 });
 test(`all closing requests hide the button and advance even though they have no fields: ${language}`,async({page})=>{
  await open(page,language);await openInsert(page,'closing');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');await page.keyboard.press('Tab');
  await expect(point(page,'closing')).toBeHidden();expect(await active(page)).toBe('attachments.lab');await expect(menu(page)).toHaveCount(0);await page.keyboard.press('Shift+Tab');await expect(point(page,'clinical')).toBeFocused();await page.keyboard.press('Escape');
  await page.locator('[data-section-control="financial"]').getByRole('button',{name:/^Remove:/}).click();await openInsert(page,'closing');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(point(page,'closing')).toBeHidden();expect(await active(page)).toBe('attachments.lab');
 });
 test(`enclosure completion hides its button and focuses the added field: ${language}`,async({page})=>{
  await open(page,language);await selectAll(page,'enclosures');await expect(point(page,'enclosures')).toBeHidden();expect(await active(page)).toBe('attachments.other');await page.keyboard.press('Tab');expect(await active(page)).toBe(language==='th'?'doctor.th':'doctor.en');
  await page.locator('[data-section-control="attachments"]').getByRole('button',{name:/^Remove:/}).click();await expect(point(page,'enclosures')).toBeVisible();
 });
 test(`medical block completion hides the Add button without hiding fields: ${language}`,async({page})=>{
  await open(page,language,'medical');await selectAll(page,'clinical');await expect(point(page,'clinical')).toBeHidden();expect(await active(page)).toBe('examination.date');await field(page,'treatment.tbDate').click();await page.keyboard.press('Tab');expect(await active(page)).toBe(language==='th'?'doctor.th':'doctor.en');
  await page.locator('[data-section-control="leave"]').getByRole('button',{name:/^Remove:/}).click();await expect(point(page,'clinical')).toBeVisible();await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(point(page,'clinical')).toBeHidden();
 });
}
test('HIV purpose casing and the referral title/contact wording match the requested text',async({page})=>{
 await open(page);await expect(page.locator('.tiptap h1 .field-content')).toHaveText('Referral Letter');await field(page,'referral.purposes').click();await expect(page.locator('[data-choice-value="hivCareTreatment"]').locator('..')).toContainText('HIV care and treatment');
 await page.locator('[data-choice-value="hivCareTreatment"]').check();await page.getByRole('button',{name:'Apply selection',exact:true}).click();await expect(field(page,'referral.purposes').locator('.field-content')).toContainText('HIV care and treatment');
 const exported=await page.evaluate(()=>JSON.stringify(clinical.payload().payload));expect(exported).toContain('Please contact Public Health Center 28 Krung Thon Buri, should you require any further information.');expect(exported).not.toContain('Public Health Centre');
});
