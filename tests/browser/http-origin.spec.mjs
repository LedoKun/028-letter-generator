import {insertAction} from './insert-helpers.mjs';
import {test,expect} from '@playwright/test';
const routes={referral:'/referral/',medical:'/medical-certificate/',medication:'/certificate-medication-letter/',freeform:'/free-form-letter/'};
async function open(page,language,template='referral'){
 await page.addInitScript(language=>{localStorage.setItem('documentLanguage',language);Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});},language);await page.goto(routes[template]);await expect(page.locator('.tiptap')).toBeFocused();await page.locator('.section-panel > details').evaluate(details=>details.open=true);
}
for(const language of ['th','en']){
 for(const template of Object.keys(routes))test(`HTTP-compatible IDs initialise the complete editor: ${template}/${language}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await open(page,language,template);await expect(page.locator('.main-tools')).toBeVisible();await expect(page.locator('.format-tools')).toBeVisible();await expect(page.locator('.paper').first()).toBeVisible();
  expect(await page.evaluate(()=>typeof crypto.randomUUID)).toBe('undefined');const ids=await page.evaluate(()=>{const ids=[];clinical.editor.state.doc.descendants(node=>{if(node.type.name==='field')ids.push(node.attrs.occurrence);});return ids;});expect(new Set(ids).size).toBe(ids.length);for(const id of ids)expect(id).toMatch(/^[a-f0-9]{32}$/);expect(errors).toEqual([]);
 });
 test(`HTTP-compatible IDs support block insertion, medication rows and travel reuse: ${language}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await open(page,language);await page.locator('.format-tools').getByRole('button',{name:'Insert',exact:true}).click();const menu=page.getByRole('dialog',{name:'Insert',exact:true});await expect(menu).toHaveAttribute('id',/^insert-options-[a-f0-9]{32}$/);await menu.locator('[data-section-choice="hiv"]').check();await menu.getByRole('button',{name:'Insert selected blocks',exact:true}).click();
  await insertAction(page,'medicine','medicine:art');const row=page.locator('.tiptap [data-kind="art"]');const id=await row.getAttribute('data-medication-row');expect(id).toMatch(/^[a-f0-9]{32}$/);await page.evaluate(id=>{clinical.setValue(`art.${id}.name`,'TDF/3TC/DTG');clinical.setValue('patient.name','FICTIONAL PATIENT');clinical.setValue('patient.dob','10/10/2000');},id);
  await page.getByLabel('Document template',{exact:true}).selectOption('medication');await expect(page.locator('.tiptap [data-kind="travel"]')).toHaveCount(1);await expect(page.locator('.tiptap [data-kind="travel"]')).toHaveAttribute('data-medication-row',/^[a-f0-9]{32}$/);await expect(page.locator('.tiptap [data-kind="travel"]')).toContainText('TDF/3TC/DTG');
  await page.evaluate(()=>{const editor=clinical.editor;editor.commands.insertContentAt(editor.state.doc.content.size,{type:'paragraph',content:[{type:'field',attrs:{id:'patient.name'}}]});});const field=page.locator('.tiptap [data-field-id="patient.name"]').last();await expect(field).toHaveAttribute('data-occurrence',/^[a-f0-9]{32}$/);await expect(field).toContainText('FICTIONAL PATIENT');expect(errors).toEqual([]);
 });
}
