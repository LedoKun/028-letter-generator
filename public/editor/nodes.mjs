import { Node, Mark, Extension } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import { definition, label } from './fields.mjs';
import { sessionOf, displayValue, normalise, fieldError, fieldRequirements, conditionActive, recalculate, templateProse, formatFieldInput, inputFitsField, newId } from './model.mjs';
import { patchSession } from './session.mjs';
import { pictureWidthPercent } from './pictures.mjs';
import { availableBlocks } from './templates.mjs';
import { closeHistory } from '@tiptap/pm/history';
export const SessionData=Node.create({name:'sessionData',atom:true,selectable:false,addAttributes(){return {template:{default:'referral'},language:{default:'th'},values:{default:{}},archives:{default:{}},fieldArchives:{default:{}},omitted:{default:[]},activeSections:{default:[]},availableFields:{default:[]},converted:{default:[]}};},renderHTML(){return ['span',{hidden:true,contenteditable:'false','data-session':''}];}});
export const TemplateText=Mark.create({name:'templateText',inclusive:false,addAttributes(){return {th:{default:''},en:{default:''},summaryTh:{default:null},summaryEn:{default:null},historyTh:{default:null},historyEn:{default:null},examTh:{default:null},doctorId:{default:null},withoutTitleEn:{default:null},dateId:{default:null},partialTh:{default:null},partialEn:{default:null},countId:{default:null},singularEn:{default:null}};},renderHTML(){return ['span',{},0];}});
export const Field=Node.create({
 name:'field',isolating:true,group:'inline',inline:true,content:'(text | hardBreak)*',selectable:false,
 addAttributes(){return {id:{default:''},occurrence:{default:''},hidden:{default:false},status:{default:''},error:{default:''},required:{default:false},languageBound:{default:false}};},
 renderHTML({node}){return ['span',{'data-field-id':node.attrs.id,class:'clinical-field'},0];},
 addNodeView(){return ({node,editor,getPos})=>{
  const dom=document.createElement('span'),contentDOM=document.createElement('span');dom.addEventListener('mousedown',event=>{if(event.button===0&&!event.target.closest('.inline-choice,.field-remove,.editor-dropdown')){event.preventDefault();const pos=getPos();if(typeof pos==='number')focusField(editor,{node:editor.state.doc.nodeAt(pos),pos});}});dom.className='clinical-field';contentDOM.className='field-content';dom.append(contentDOM);
  const control=definition(node.attrs.id)?.options?document.createElement('button'):null,remove=document.createElement('button');
  if(control){
   control.className='inline-choice';control.type='button';control.textContent='▾';control.tabIndex=-1;control.contentEditable='false';dom.append(control);
   control.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('fieldchoices',{detail:{occurrence:editor.state.doc.nodeAt(getPos()).attrs.occurrence}})));
  }
  remove.type='button';remove.className='field-remove';remove.textContent='×';remove.contentEditable='false';remove.tabIndex=-1;dom.append(remove);
  remove.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('fieldremove',{detail:{occurrence:editor.state.doc.nodeAt(getPos()).attrs.occurrence}})));
  const update=n=>{
   const def=definition(n.attrs.id);dom.id=`field-${n.attrs.occurrence}`;dom.dataset.fieldId=n.attrs.id;dom.dataset.occurrence=n.attrs.occurrence;
   dom.dataset.status=n.attrs.status;dom.dataset.required=String(n.attrs.required);dom.hidden=n.attrs.hidden;
   dom.classList.toggle('invalid',!!n.attrs.error);dom.dataset.empty=String(!n.textContent.replace(/\u200B/g,''));
   dom.setAttribute('role','textbox');dom.setAttribute('aria-label',label(def?.labels||[n.attrs.id,n.attrs.id],'en'));
   dom.setAttribute('aria-invalid',String(!!n.attrs.error));dom.setAttribute('aria-required',String(n.attrs.required));dom.setAttribute('aria-readonly',String(!!def?.readonly));dom.title=[n.attrs.error,def?.inputHint||dom.getAttribute('aria-label')].filter(Boolean).join('\n');
   if(def?.inputHint){dom.setAttribute('aria-description',def.inputHint);dom.dataset.maxLength=def.maxLength;contentDOM.setAttribute('inputmode','numeric');}
   contentDOM.dataset.label=dom.getAttribute('aria-label');
   if(control)control.setAttribute('aria-label','Choices for '+dom.getAttribute('aria-label'));
   remove.setAttribute('aria-label','Remove '+dom.getAttribute('aria-label')+' occurrence');remove.title='Remove this occurrence; its value stays in the patient session';
   return true;
  };update(node);
  return {dom,contentDOM,stopEvent:event=>event.type==='mousedown'||event.type==='click'||!!event.target.closest?.('.inline-choice,.field-remove,.editor-dropdown'),update:n=>n.type.name==='field'&&update(n),ignoreMutation:m=>!!m.target.closest?.('.inline-choice,.field-remove,.editor-dropdown')||m.target===dom||m.type==='attributes'&&m.target===contentDOM};
 };},
});
export const Phrase=Node.create({name:'phrase',group:'inline',inline:true,content:'inline*',selectable:false,addAttributes(){return {guard:{default:[]},condition:{default:null},printCondition:{default:null},hidden:{default:false}};},renderHTML({node}){return ['span',{class:'optional-phrase',...(node.attrs.hidden?{hidden:true}:{})},0];}});
export const ClinicalSection=Node.create({priority:50,name:'clinicalSection',group:'block',content:'block+',defining:true,addAttributes(){return {id:{default:''},diagnosis:{default:false}};},renderHTML({node}){return ['section',{'data-section-id':node.attrs.id,class:'clinical-section'},0];}});
export const ClinicalGroup=Node.create({name:'clinicalGroup',group:'block',content:'block*',defining:true,addAttributes(){return {id:{default:''}};},renderHTML({node}){return ['div',{'data-clinical-group':node.attrs.id,class:'clinical-group'},0];}});
export const MedicationRow=Node.create({priority:50,name:'medicationRow',group:'block',content:'paragraph+',defining:true,addAttributes(){return {id:{default:''},kind:{default:'art'}};},renderHTML({node}){return ['ul',{'data-medication-row':node.attrs.id,'data-kind':node.attrs.kind,class:'medication-row'},['li',{},0]];}});
export const BodyText=Node.create({priority:50,name:'bodyText',group:'block',content:'block+',defining:true,renderHTML(){return ['div',{'data-letter-body':'',class:'letter-body'},0];}});
export const PageBreak=Node.create({name:'pageBreak',group:'block',atom:true,renderHTML(){return ['div',{'data-page-break':'',class:'manual-page-break',contenteditable:'false','aria-label':'Manual page break'}];}});
export const InsertionPoint=Node.create({name:'insertionPoint',group:'block',atom:true,selectable:false,addAttributes(){return {id:{default:'clinical'},hint:{default:'Add clinical information'},kind:{default:'blocks'},section:{default:null},allowed:{default:null},hidden:{default:false}};},renderHTML({node}){return ['div',{class:'block-insertion','data-insertion-point':node.attrs.id,contenteditable:'false',...(node.attrs.hidden?{hidden:true}:{})},['button',{type:'button'},'+ '+node.attrs.hint]];},addNodeView(){return ({node,editor,getPos})=>{
 const dom=document.createElement('div'),button=document.createElement('button');dom.className='block-insertion';dom.contentEditable='false';button.type='button';dom.append(button);
 const update=current=>{node=current;dom.dataset.insertionPoint=node.attrs.id;dom.hidden=node.attrs.hidden;button.textContent='+ '+node.attrs.hint;button.setAttribute('aria-label',node.attrs.hint);return true;};update(node);
 const open=automatic=>document.dispatchEvent(new CustomEvent('insertblocks',{detail:{...node.attrs,pos:getPos(),automatic}}));
 button.addEventListener('click',()=>open(false));
 button.addEventListener('focus',()=>{if(!button.suppressChoices&&!['medicine','section'].includes(node.attrs.kind))open(true);});
 button.addEventListener('keydown',event=>{if(event.isComposing||editor.view.composing||event.ctrlKey||event.metaKey)return;if(event.key==='Tab'&&!event.altKey&&moveField(editor,event.shiftKey)){event.preventDefault();event.stopPropagation();}else if(event.altKey&&event.key==='ArrowDown'&&!['medicine','section'].includes(node.attrs.kind)){event.preventDefault();open(false);}});
 return {dom,stopEvent:()=>true,ignoreMutation:()=>true,update:current=>current.type.name==='insertionPoint'&&update(current)};
};}});
export const Picture=Node.create({name:'picture',group:'block',atom:true,draggable:true,addAttributes(){return {src:{default:''},naturalWidth:{default:1},naturalHeight:{default:1},width:{default:100},alt:{default:'Inserted picture'},caption:{default:''}};},renderHTML({node}){
 return ['figure',{class:'picture-node','data-picture':''},['img',{src:node.attrs.src,alt:node.attrs.alt,style:`width:${pictureWidthPercent(node.attrs)}%;height:auto`}],...(node.attrs.caption?[['figcaption',{class:'picture-caption'},node.attrs.caption]]:[])];
},addNodeView(){return ({node,editor,getPos})=>{
 let current=node,alive=true,cleanup=()=>{};const dom=document.createElement('figure'),frame=document.createElement('div'),img=document.createElement('img'),caption=document.createElement('figcaption');dom.className='picture-node';dom.dataset.picture='';frame.className='picture-frame';img.draggable=false;caption.className='picture-caption';frame.append(img);dom.append(frame,caption);
 const update=n=>{current=n;img.src=n.attrs.src;img.alt=n.attrs.alt;frame.style.width=pictureWidthPercent(n.attrs)+'%';caption.textContent=n.attrs.caption;caption.hidden=!n.attrs.caption;return true;};
 const commit=width=>{if(!alive||typeof getPos()!=='number')return;const attrs={...current.attrs,width:pictureWidthPercent({...current.attrs,width})};editor.view.dispatch(closeHistory(editor.state.tr).setNodeMarkup(getPos(),undefined,attrs));};
 for(const corner of ['left','right']){
  const handle=document.createElement('button');handle.type='button';handle.className='picture-resize '+corner;handle.setAttribute('aria-label','Resize picture proportionally (bottom '+corner+')');handle.title='Drag to resize; Arrow keys change width';frame.append(handle);
  handle.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();cleanup();editor.commands.setNodeSelection(getPos());const origin={x:event.clientX,y:event.clientY,width:pictureWidthPercent(current.attrs)},body=editor.view.dom.clientWidth-parseFloat(getComputedStyle(editor.view.dom).paddingLeft)-parseFloat(getComputedStyle(editor.view.dom).paddingRight),ratio=current.attrs.naturalWidth/current.attrs.naturalHeight,scale=Number(editor.view.dom.closest('.document-surface')?.dataset.zoom)||1;let width=origin.width;
   const move=e=>{const dx=(e.clientX-origin.x)*(corner==='left'?-1:1)/scale,dy=(e.clientY-origin.y)*ratio/scale;const delta=Math.abs(dx)>Math.abs(dy)?dx:dy;width=pictureWidthPercent({...current.attrs,width:origin.width+delta/body*100});frame.style.width=width+'%';document.dispatchEvent(new Event('clinical-layout'));};
   const finish=()=>{cleanup();commit(width);};cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);};const cancel=()=>{cleanup();update(current);document.dispatchEvent(new Event('clinical-layout'));};window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish,{once:true});window.addEventListener('pointercancel',cancel,{once:true});
  });
  handle.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(event.key)){event.preventDefault();commit(pictureWidthPercent(current.attrs)+(['ArrowLeft','ArrowDown'].includes(event.key)?-5:5));}});
 }
 update(node);return {dom,update:n=>n.type.name==='picture'&&update(n),stopEvent:event=>!!event.target.closest?.('.picture-resize'),ignoreMutation:()=>true,destroy(){alive=false;cleanup();}};
};}});
export const LayoutAttributes=Extension.create({name:'layoutAttributes',addGlobalAttributes(){return [{types:['paragraph','heading','listItem'],attributes:{
 guard:{default:[]},condition:{default:null},hidden:{default:false,renderHTML:a=>a.hidden?{hidden:true}:{}},role:{default:null},style:{default:null},
 indent:{default:0,renderHTML:a=>({'style':`margin-left:${a.indent*12}pt`})},spacingBefore:{default:null,renderHTML:a=>a.spacingBefore===null?{}:({'style':`margin-top:${a.spacingBefore}pt`})},spacingAfter:{default:null,renderHTML:a=>a.spacingAfter===null?{}:({'style':`margin-bottom:${a.spacingAfter}pt`})}
 }}];}});
export function activeField(editor) {
 const { $from }=editor.state.selection;
 for(let d=$from.depth;d>0;d--)if($from.node(d).type.name==='field')return {node:$from.node(d),pos:$from.before(d)};
 return null;
}
export function tabStops(editor) {
 const out=[];editor.state.doc.descendants((node,pos)=>{
  if(node.attrs.hidden)return false;
  if(node.type.name==='field'||node.type.name==='insertionPoint') {if(node.type.name==='insertionPoint'||!definition(node.attrs.id)?.readonly)out.push({node,pos});return false;}
 });return out;
}
export function fieldsInOrder(editor){return tabStops(editor).filter(entry=>entry.node.type.name==='field');}
export function focusStop(editor,entry,choices=true){
 if(entry?.node.attrs.hidden)return;
 if(entry?.node.type.name!=='insertionPoint'){focusField(editor,entry,choices);return;}
 const button=editor.view.nodeDOM(entry.pos)?.querySelector('button');if(!button)return;
 button.suppressChoices=!choices;button.focus();button.scrollIntoView({block:'nearest',inline:'nearest'});button.suppressChoices=false;
}
export function focusField(editor,entry,choices=true) {
 if(!entry){editor.view.focus();return;}
 editor.chain().setTextSelection({from:entry.pos+1,to:entry.pos+entry.node.nodeSize-1}).scrollIntoView().run();editor.view.focus();
 const dom=editor.view.nodeDOM(entry.pos);dom?.scrollIntoView({block:'nearest',inline:'nearest'});
 if(choices&&definition(entry.node.attrs.id)?.options)document.dispatchEvent(new CustomEvent('fieldchoices',{detail:{occurrence:entry.node.attrs.occurrence,automatic:true}}));
}
export function focusInitialField(editor){focusField(editor,fieldsInOrder(editor).find(field=>field.node.attrs.id!=='document.date'));}
export function updateSession(editor,fn,meta={}) {
 const next=fn(structuredClone(sessionOf(editor.state.doc)));
 if(JSON.stringify(next)===JSON.stringify(sessionOf(editor.state.doc))&&!meta.force)return;
 const tr=patchSession(editor.state.tr.setMeta('sessionUpdate',true),next);
 for(const [k,v]of Object.entries(meta))tr.setMeta(k,v);
 editor.view.dispatch(tr);
}
export function commitField(editor,entry=activeField(editor)) {
 if(!entry)return;
 const id=entry.node.attrs.id;
 if(!sessionOf(editor.state.doc).values[id]?.editing)return;
 updateSession(editor,s=>{const value=s.values[id];if(value?.editing)s.values[id]={...value,value:normalise(id,value.value,s.language),editing:false};return s;});
}
export function moveField(editor,back=false,origin=null) {
 if(editor.view.composing)return false;const point=document.activeElement?.closest?.('[data-insertion-point]'),field=activeField(editor);
 if(!origin&&!point&&!field)return false;commitField(editor,field);
 const stops=tabStops(editor),index=stops.findIndex(entry=>point?entry.node.type.name==='insertionPoint'&&entry.node.attrs.id===point.dataset.insertionPoint:entry.node.type.name==='field'&&entry.node.attrs.occurrence===field?.node.attrs.occurrence),next=origin?(back?[...stops].reverse().find(entry=>entry.pos<origin.pos):stops.find(entry=>entry.pos>origin.pos)):stops[index+(back?-1:1)];
 if(!next){if(back)return false;document.querySelector('[data-pdf-preview]')?.focus();return true;}
 focusStop(editor,next);return true;
}
export const FieldBehaviour=Extension.create({
 name:'fieldBehaviour',
 addKeyboardShortcuts(){return {
  'Mod-a':()=>{const entry=activeField(this.editor);if(!entry)return false;focusField(this.editor,entry);return true;},
  'Alt-ArrowDown':()=>{const entry=activeField(this.editor);if(!entry||!definition(entry.node.attrs.id)?.options)return false;document.dispatchEvent(new CustomEvent('fieldchoices',{detail:{occurrence:entry.node.attrs.occurrence}}));return true;},
  Tab:()=>moveField(this.editor,false),'Shift-Tab':()=>moveField(this.editor,true),
  Enter:()=>{const f=activeField(this.editor);if(!f)return false;if(definition(f.node.attrs.id)?.type==='multiline')return this.editor.commands.setHardBreak();commitField(this.editor,f);return moveField(this.editor,false);},
 };},
 addProseMirrorPlugins(){
  const editor=this.editor;let previousField=null;
  return [new Plugin({
   filterTransaction(tr){const next=tr.doc.firstChild,previous=editor.state.doc.firstChild;return next?.type.name==='sessionData'&&(tr.getMeta('reset')||next.attrs.template===previous.attrs.template)&&(JSON.stringify(next.attrs)===JSON.stringify(previous.attrs)||tr.getMeta('sessionUpdate')||tr.getMeta('fieldSync')||tr.getMeta('history$')||tr.getMeta('reset'));},
   props:{
    handleClickOn(view,pos,node,nodePos,event,direct){if(direct&&node.type.name==='field'&&!node.attrs.hidden){focusField(editor,{node,pos:nodePos});return true;}return false;},
    handlePaste(view,event){
     const text=event.clipboardData?.getData('text/plain');if(!text){event.preventDefault();return true;}
     const field=activeField(editor);
     if(field&&definition(field.node.attrs.id)?.maxLength){
      const {from,to}=view.state.selection,start=field.pos+1,current=field.node.textContent.replace(/\u200B/g,''),raw=current.slice(0,from-start)+text+current.slice(to-start),formatted=formatFieldInput(field.node.attrs.id,raw);
      if(!inputFitsField(field.node.attrs.id,raw)||!inputFitsField(field.node.attrs.id,formatted)){document.dispatchEvent(new CustomEvent('fieldinputlimit',{detail:{id:field.node.attrs.id}}));return true;}
      view.dispatch(view.state.tr.replaceWith(start,start+field.node.content.size,formatted?view.state.schema.text(formatted,field.node.firstChild?.marks||[]):[]));
     }else if(field){const content=text.split(/\r?\n/).flatMap((line,i)=>[...(i?[view.state.schema.nodes.hardBreak.create()]:[]),...(line?[view.state.schema.text(line)]:[])]);view.dispatch(view.state.tr.replaceWith(view.state.selection.from,view.state.selection.to,content));}
     else editor.commands.insertContent(text.split(/\r?\n/).map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]})));
     return true;
    },
    handleDrop(view,event){
     if(view.dragging)return false;
     event.preventDefault();const text=event.dataTransfer?.getData('text/plain'),position=view.posAtCoords({left:event.clientX,top:event.clientY})?.pos;
     if(text&&position!==undefined)editor.commands.insertContentAt(position,text.split(/\r?\n/).map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]})));
     return true;
    },
    handleDOMEvents:{mousedown(view,event){
     const paragraph=event.target.closest?.('.letter-body > p');
     if(event.button!==0||event.shiftKey||!paragraph||paragraph.childNodes.length!==1||!paragraph.firstChild.matches?.('br.ProseMirror-trailingBreak'))return false;
     event.preventDefault();view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc,view.posAtDOM(paragraph,0))));view.focus();return true;
    },beforeinput(view,event){const f=activeField(editor);if(!f||event.isComposing||view.composing)return false;const {from,to}=view.state.selection;if(event.inputType==='insertText'&&event.data!==null){
 event.preventDefault();if(definition(f.node.attrs.id)?.readonly)return true;
 const start=f.pos+1,current=f.node.textContent.replace(/\u200B/g,''),left=Math.min(from-start,current.length),right=Math.min(to-start,current.length),raw=current.slice(0,left)+event.data+current.slice(right),formatted=formatFieldInput(f.node.attrs.id,raw);
 if(!inputFitsField(f.node.attrs.id,raw)||!inputFitsField(f.node.attrs.id,formatted))return true;
 if(formatted===raw)view.dispatch(view.state.tr.insertText(event.data,from,to));
 else {const digitCount=raw.slice(0,left+event.data.length).replace(/\D/g,'').length;let caret=0,count=0;while(caret<formatted.length&&count<digitCount){if(/\d/.test(formatted[caret]))count++;caret++;}while(/[-/]/.test(formatted[caret]||' '))caret++;const tr=view.state.tr.replaceWith(start,start+f.node.content.size,view.state.schema.text(formatted,f.node.firstChild?.marks||[]));tr.setSelection(TextSelection.create(tr.doc,start+caret));view.dispatch(tr);}
 return true;
}if(['deleteContentBackward','deleteContentForward'].includes(event.inputType)){event.preventDefault();const start=f.pos+1,end=f.pos+f.node.nodeSize-1;view.dispatch(view.state.tr.delete(from===to&&event.inputType==='deleteContentBackward'?Math.max(start,from-1):from,from===to&&event.inputType==='deleteContentForward'?Math.min(end,to+1):to));return true;}return false;},blur(){if(!editor.view.composing)commitField(editor);return false;}},
   },
   appendTransaction(transactions,oldState,newState){
    if(!transactions.some(t=>t.docChanged||t.getMeta('force'))||transactions.every(t=>t.getMeta('fieldSync')))return null;
    let session=structuredClone(sessionOf(newState.doc));const oldFields=new Map();
    oldState.doc.descendants(node=>{if(node.type.name==='field'){oldFields.set(node.attrs.occurrence,node);return false;}});
    newState.doc.descendants(node=>{
     if(node.type.name!=='field')return;
     const old=oldFields.get(node.attrs.occurrence),text=node.textBetween(0,node.content.size,'\n','\n').replace(/\u200B/g,'');
     if(old&&old.textBetween(0,old.content.size,'\n','\n').replace(/\u200B/g,'')!==text&&!definition(node.attrs.id)?.readonly&&!transactions.some(t=>t.getMeta('fieldSync')||t.getMeta('history$'))) {
      session.values[node.attrs.id]={value:text,status:definition(node.attrs.id)?.calculated?'override':'manual',editing:true};
     }
     return false;
    });
    session.activeSections=[];session.availableFields=[];newState.doc.descendants(n=>{if(n.type.name==='clinicalSection')session.activeSections.push(n.attrs.id);if(n.type.name==='field')session.availableFields.push(n.attrs.languageBound?(session.language==='th'?'doctor.th':'doctor.en'):n.attrs.id);});
    session=recalculate(session,transactions.find(t=>t.getMeta('recalculate'))?.getMeta('recalculate')||'');
    const {required}=fieldRequirements(newState.doc.toJSON(),session);
    const tr=newState.tr;const edits=[];
    newState.doc.descendants((group,pos)=>{if(group.type.name!=='clinicalGroup'||group.attrs.id!=='enclosures')return;let start=1;group.descendants((node,offset)=>{if(node.type.name==='orderedList'){if(node.attrs.start!==start)edits.push({pos:pos+1+offset,node,attrs:{...node.attrs,start}});start+=node.childCount;return false;}});return false;});
    newState.doc.descendants((node,pos)=>{
     if(node.type.name==='sessionData')return false;
     if(node.type.name==='field') {
      const id=node.attrs.languageBound?(session.language==='th'?'doctor.th':'doctor.en'):node.attrs.id;
      const record=session.values[id],hidden=session.omitted.includes(id),text=record?.editing?String(record.value):displayValue(session,id);
      const attrs={...node.attrs,id,occurrence:node.attrs.occurrence||newId(),hidden,status:record?.status||'empty',error:fieldError(id,record?.value,session),required:required.has(id)};
      edits.push({pos,node,attrs,text});return false;
     }
     if(['phrase','paragraph','heading','listItem'].includes(node.type.name)) {
      const hidden=!conditionActive(node.attrs.condition,session)||(node.attrs.guard||[]).some(id=>session.omitted.includes(id));
      if(hidden!==node.attrs.hidden)edits.push({pos,node,attrs:{...node.attrs,hidden}});
     }
     if(node.type.name==='insertionPoint'){
      const hidden=node.attrs.kind!=='medicine'&&!availableBlocks(session,node.attrs).length;
      if(hidden!==node.attrs.hidden)edits.push({pos,node,attrs:{...node.attrs,hidden}});
     }
     if(node.isText){const m=node.marks.find(mark=>mark.type.name==='templateText');if(m){const text=templateProse(node.text,m.attrs,session)||'\u200B';if(text!==node.text)edits.push({pos,node,replace:text});}}
    });
    for(const edit of edits.sort((a,b)=>b.pos-a.pos)) {
     const {node,pos}=edit;
     if(edit.replace!==undefined){tr.replaceWith(pos,pos+node.nodeSize,edit.replace?newState.schema.text(edit.replace,node.marks):[]);continue;}
     if(JSON.stringify(edit.attrs)!==JSON.stringify(node.attrs))tr.setNodeMarkup(pos,undefined,edit.attrs,node.marks);
     if(edit.text!==undefined&&edit.text!==node.textBetween(0,node.content.size,'\n','\n').replace(/\u200B/g,'')) {
      const marks=node.firstChild?.marks||[];
      const content=(edit.text||'\u200B').split('\n').flatMap((line,i)=>[...(i?[newState.schema.nodes.hardBreak.create()]:[]),...(line?[newState.schema.text(line,marks)]:[])]);
      tr.replaceWith(pos+1,pos+node.nodeSize-1,content);
     }
    }
    for(const [id,archive]of Object.entries(session.fieldArchives||{})){
     const previous=sessionOf(oldState.doc).fieldArchives?.[id];let pos=previous?.pos??archive.pos;
     for(const transaction of transactions)pos=transaction.mapping.map(pos,-1);
     pos=tr.mapping.map(pos,-1);
     if(archive.section){
      let oldSection,newSection;oldState.doc.descendants((n,p)=>{if(n.type.name==='clinicalSection'&&n.attrs.id===archive.section)oldSection={n,p};});tr.doc.descendants((n,p)=>{if(n.type.name==='clinicalSection'&&n.attrs.id===archive.section)newSection={n,p};});
      if(newSection&&(!oldSection||pos<=newSection.p||pos>=newSection.p+newSection.n.nodeSize)){
       let parent=newSection.n;pos=newSection.p+1;
       for(const index of archive.path){if(index>=parent.childCount)break;for(let i=0;i<index;i++)pos+=parent.child(i).nodeSize;parent=parent.child(index);pos++;}
       for(let i=0;i<Math.min(archive.index,parent.childCount);i++)pos+=parent.child(i).nodeSize;
      }
     }
     archive.pos=pos;
    }
    patchSession(tr,session);
    return tr.docChanged?tr.setMeta('fieldSync',true):null;
   },
   view(){return {update(){
    const active=activeField(editor);document.querySelectorAll('.clinical-field.is-focused').forEach(el=>el.classList.remove('is-focused'));
    if(active){editor.view.nodeDOM(active.pos)?.classList.add('is-focused');editor.view.dom.setAttribute('aria-activedescendant',`field-${active.node.attrs.occurrence}`);}else editor.view.dom.removeAttribute('aria-activedescendant');
    const occurrence=active?.node.attrs.occurrence;
    if(occurrence!==previousField&&active&&definition(active.node.attrs.id)?.options)queueMicrotask(()=>{if(!editor.isDestroyed&&editor.view.hasFocus()&&!editor.view.composing&&activeField(editor)?.node.attrs.occurrence===occurrence)document.dispatchEvent(new CustomEvent('fieldchoices',{detail:{occurrence,automatic:true}}));});
    if(previousField&&previousField!==occurrence&&!editor.view.composing){const previous=fieldsInOrder(editor).find(f=>f.node.attrs.occurrence===previousField);previousField=occurrence;if(previous)queueMicrotask(()=>{if(!editor.isDestroyed)commitField(editor,previous);});}
    previousField=occurrence;
   }};},
  })];
 }
});
