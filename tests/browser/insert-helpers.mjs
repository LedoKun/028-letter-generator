export const insertMenu=page=>page.getByRole('dialog',{name:'Insert',exact:true});
export async function openInsert(page,pointId){
 if(pointId){await page.locator(`.tiptap [data-insertion-point="${pointId}"] > button`).focus();await page.keyboard.press('/');}
 else await page.locator('[data-insert-toolbar]').click();
 return insertMenu(page);
}
export async function insertAction(page,action,pointId){const menu=await openInsert(page,pointId);await menu.locator(`[data-insert-action="${action}"]`).click();}
export async function insertBlocks(page,ids,pointId){const menu=await openInsert(page,pointId);for(const id of ids)await menu.locator(`[data-section-choice="${id}"]`).check();await menu.getByRole('button',{name:'Insert selected blocks',exact:true}).click();}
export async function editParagraph(paragraph){await paragraph.evaluate(node=>{const e=clinical.editor;e.commands.setTextSelection(e.view.posAtDOM(node,0));e.view.focus();});}
