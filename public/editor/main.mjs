import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { closeHistory } from '@tiptap/pm/history';
import { EditorState } from '@tiptap/pm/state';
import { TEMPLATE_NAMES, definition, label } from './fields.mjs';
import { INSERT_BLOCKS, createDocument, buildBlock, medicationRow, referralPoint, sectionDefaults } from './templates.mjs';
import { hydrate, sessionOf, valueOf, displayValue, normalise, recalculate, validateDocument, walk } from './model.mjs';
import { SessionData, TemplateText, Field, Phrase, ClinicalSection, ClinicalGroup, MedicationRow, BodyText, PageBreak, Picture, InsertionPoint, LayoutAttributes, FieldBehaviour, activeField, fieldsInOrder, focusField, focusStop, focusInitialField, moveField, updateSession, commitField } from './nodes.mjs';
import { PatientSession, patchSession } from './session.mjs';
import { Pagination, PAGE } from './pagination.mjs';
import { officialHeader, officialFooter } from './official.mjs';
import { toPdf } from './pdf.mjs';
import { readPicture, PICTURE_LIMITS } from './pictures.mjs';
const app=document.querySelector('#app');
const routes={referral:'/referral/index.html',medical:'/medical-certificate/index.html',medication:'/certificate-medication-letter/index.html',freeform:'/free-form-letter/index.html'};
const UI={back:['เลือกเอกสาร','Select Template'],clear:['ล้างข้อมูลในเอกสาร','Clear Form'],preview:['ดูตัวอย่าง PDF','PDF Preview'],print:['พิมพ์','Print'],download:['ดาวน์โหลด PDF','Download PDF'],undo:['ย้อนกลับ','Undo'],redo:['ทำซ้ำ','Redo'],fields:['เพิ่มช่องข้อมูล','Insert Field'],sections:['เพิ่มหัวข้อทางคลินิก','Insert Clinical Section'],help:['แป้นพิมพ์ลัด','Keyboard Shortcuts'],cancel:['ยกเลิก','Cancel'],close:['ปิด','Close'],remove:['นำออก','Remove'],up:['ขึ้น','Move Up'],down:['ลง','Move Down'],restore:['คืนค่า','Restore'],add:['เพิ่ม','Add'],fresh:['เริ่มหัวข้อที่เลือกด้วยข้อมูลว่าง','Start selected sections afresh']};
let editor,language='th',dirty=false,baseline='',currentPath=location.pathname,busy=false,layout={pages:1,stable:true},pagesLayer,sidebar,banner,status,fieldPanel,sectionPanel,lastField='',opening=0;
const patientMemory=new PatientSession();
try{language=localStorage.getItem('documentLanguage')==='en'?'en':'th';}catch{}
Common.clearPatientStore();
const tr=(th,en)=>en;
const ui=id=>label(UI[id],'en');
function el(tag,attrs={},children=[]) {
 const node=document.createElement(tag);
 for(const [key,value]of Object.entries(attrs))if(key.startsWith('on'))node.addEventListener(key.slice(2).toLowerCase(),value);else if(value!==null&&value!==undefined&&value!==false){if(key==='class')node.className=value;else if(key==='value')node.value=value;else node.setAttribute(key,value===true?'':String(value));}
 for(const child of (Array.isArray(children)?children:[children]))if(child!==null&&child!==undefined)node.append(child instanceof Node?child:document.createTextNode(String(child)));
 return node;
}
function button(text,fn,attrs={}){return el('button',{type:'button',onclick:fn,...attrs},text);}
function doctorPreferences(){
 try{const raw=JSON.parse(localStorage.getItem('sharedDoctorInfo')||'{}');return {'doctor.th':String(raw.sharedDoctorNameThai||''),'doctor.en':String(raw.sharedDoctorNameEnglish||''),'doctor.license':String(raw.sharedMedicalLicense||'')};}catch{return {};}
}
function saveDoctorPreferences(){const s=sessionOf(editor.state.doc);try{localStorage.setItem('sharedDoctorInfo',JSON.stringify({sharedDoctorNameThai:valueOf(s,'doctor.th'),sharedDoctorNameEnglish:valueOf(s,'doctor.en'),sharedMedicalLicense:valueOf(s,'doctor.license')}));}catch{}}
function setLanguage(next){
 document.querySelector('.editor-dropdown')?.close(false);
 language=next;document.documentElement.lang='en';
 try{localStorage.setItem('documentLanguage',language);}catch{}
 if(editor){commitField(editor);updateSession(editor,s=>{for(const [id,labels]of Object.entries({'document.title':{th:'บันทึกข้อความ',en:'Medical Notes'},'document.addressee':{th:'เจ้าหน้าที่ผู้เกี่ยวข้อง',en:s.template==='referral'?'To Whom It May Concern':'Whom It May Concern'},'attachments.lab':{th:'ผลตรวจทางห้องปฏิบัติการล่าสุด',en:'Latest laboratory results'}}))if(s.values[id]?.status==='default')s.values[id].value=labels[language];return {...s,language};});editor.setOptions({editorProps:{attributes:{...editor.options.editorProps.attributes,lang:language}}});renderToolbar();renderSidebar();}
}
function templateSelector(){return el('select',{class:'template-selector','aria-label':'Document template',onchange:event=>navigate(event.target.value)},Object.entries(TEMPLATE_NAMES).map(([id,names])=>el('option',{value:id,selected:sessionOf(editor.state.doc).template===id},label(names,'en'))));}
function letterLanguageSelector(){return el('select',{class:'document-language','aria-label':'Letter language',onchange:e=>setLanguage(e.target.value)},[el('option',{value:'en',selected:language==='en'},'English letter'),el('option',{value:'th',selected:language==='th'},'Thai letter')]);}
function toolbarBrand(){return el('div',{class:'toolbar-brand'},[el('img',{src:'/media/favicon/android-chrome-192x192.png',alt:''}),el('div',{},[el('strong',{},'CLINICAL DOCUMENTS'),el('small',{},'Public Health Center 28 Krung Thon Buri')])]);}
function templateAtPath(path){return Object.keys(routes).find(id=>[routes[id],routes[id].replace('index.html',''),routes[id].replace('/index.html','')].includes(path))||'referral';}
function navigate(template){if(!routes[template])return;history.pushState({},'',routes[template]);currentPath=routes[template];openTemplate(template);}
function selectControl(name,options,fn){const select=el('select',{'aria-label':name,onchange:e=>fn(e.target.value)},options.map(([value,text])=>el('option',{value},text)));return select;}
function format(text,command,title){return button(text,()=>editor.chain().focus()[command]().run(),{title,onmousedown:e=>e.preventDefault(),'aria-label':title,'data-command':command,'aria-pressed':editor?.isActive(command.replace('toggle','').toLowerCase())||false});}
function renderToolbar(){
 const host=document.querySelector('#toolbar');if(!host)return;
 const main=el('div',{class:'main-tools'},[
 el('div',{class:'main-left'},[templateSelector(),letterLanguageSelector()]),toolbarBrand(),el('div',{class:'main-actions'},[
 button('↶',()=>editor.chain().focus().undo().run(),{title:ui('undo')+' (Ctrl/Cmd+Z)','aria-label':ui('undo')}),button('↷',()=>editor.chain().focus().redo().run(),{title:ui('redo')+' (Ctrl/Cmd+Shift+Z)','aria-label':ui('redo')}),
 button(ui('clear'),clearForm,{class:'danger'}),button(ui('preview'),()=>exportDocument('preview'),{'data-pdf-preview':'',onkeydown:event=>{if(event.key==='Tab'&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();const fields=fieldsInOrder(editor);focusField(editor,fields.find(field=>field.node.attrs.id==='document.date')||fields[0]);}}}),button(ui('print'),()=>exportDocument('print')),button(ui('download'),()=>exportDocument('download'),{class:'primary'}),button('?',shortcutHelp,{'aria-label':ui('help'),title:ui('help')})])]);
 const controls=el('div',{class:'format-tools'},[
 format('B','toggleBold',tr('ตัวหนา','Bold')+' (Ctrl/Cmd+B)'),format('I','toggleItalic',tr('ตัวเอียง','Italic')+' (Ctrl/Cmd+I)'),format('U','toggleUnderline',tr('ขีดเส้นใต้','Underline')+' (Ctrl/Cmd+U)'),
 selectControl(tr('ขนาดตัวอักษร','Font size'),[['','pt'],...['8.5','9','10','11','12','14','16','18'].map(n=>[n,n])],n=>{if(n)editor.chain().focus().setFontSize(n+'pt').run();}),
 selectControl(tr('รูปแบบย่อหน้า','Paragraph style'),[['paragraph',tr('ข้อความปกติ','Normal')],['1',tr('ชื่อเอกสาร','Title')],['2',tr('หัวข้อ','Heading')]],v=>v==='paragraph'?editor.chain().focus().setParagraph().run():editor.chain().focus().setHeading({level:Number(v)}).run()),
 ...['left','center','right','justify'].map((alignment,i)=>button(['≡','≡','≡','☷'][i],()=>editor.chain().focus().setTextAlign(alignment).run(),{title:tr(['ชิดซ้าย','กึ่งกลาง','ชิดขวา','เต็มแนว'][i],alignment),'aria-label':`Align ${alignment}`,onmousedown:e=>e.preventDefault()})),
 format('•','toggleBulletList',tr('รายการหัวข้อย่อย','Bulleted list')),format('1.','toggleOrderedList',tr('รายการลำดับเลข','Numbered list')),
 button('→',()=>indent(1),{'aria-label':tr('เพิ่มการเยื้อง','Increase indent'),onmousedown:e=>e.preventDefault()}),button('←',()=>indent(-1),{'aria-label':tr('ลดการเยื้อง','Decrease indent'),onmousedown:e=>e.preventDefault()}),
 selectControl(tr('ระยะห่างย่อหน้า','Paragraph spacing'),[['5',tr('ระยะห่าง 5 pt','Spacing 5 pt')],['8','8 pt'],['12','12 pt']],v=>editor.chain().focus().updateAttributes(editor.isActive('heading')?'heading':'paragraph',{spacingAfter:Number(v)}).run()),
 button('Insert Block',blockDialog),button('Insert Picture',choosePicture),button(tr('ขึ้นหน้าใหม่','Page Break'),insertPageBreak,{title:tr('ขึ้นหน้าใหม่หลังย่อหน้าปัจจุบัน','Start a new page after the current paragraph')})]);
 host.replaceChildren(main,controls,el('p',{class:'shortcut-hint'},'Tab → Next field / Add… / Preview | Shift+Tab → Previous | ↑/↓ → Choices | Enter → Select | Ctrl/Cmd+Z → Undo'));
}
function indent(delta){const type=editor.isActive('heading')?'heading':'paragraph';editor.chain().focus().updateAttributes(type,{indent:Math.max(0,Math.min(8,(editor.getAttributes(type).indent||0)+delta))}).run();}
function renderPages(next){layout=next;if(!pagesLayer)return;
 pagesLayer.replaceChildren(...Array.from({length:next.pages},(_,i)=>el('div',{class:'paper','aria-hidden':'true'},[officialHeader(),officialFooter(i+1,next.pages)])));
 document.querySelector('.document-surface').style.minHeight=`${next.pages*PAGE.height+(next.pages-1)*PAGE.gap}px`;
 status.textContent=tr(`${next.pages} หน้า · A4 · ข้อมูลอยู่เฉพาะในหน้านี้`,`${next.pages} page${next.pages===1?'':'s'} · A4 · Session memory only`);
 if(!next.stable)showMessage(tr('โปรดตรวจสอบการจัดหน้าในตัวอย่าง PDF','Please check the layout in PDF Preview'));
}
function templateContent(template,inherit=true){
 const doc=createDocument(template,language,doctorPreferences()),s=patientMemory.merge(doc.content[0].attrs);doc.content[0].attrs=s;
 if(template==='medication'&&inherit&&editor){
  const source=patientMemory.documents.get('referral')?.state.doc||editor.state.doc,sourceSession=sessionOf(source),medicines=[];
  source.descendants(node=>{if(node.type.name==='medicationRow'&&['art','otherMed'].includes(node.attrs.kind)){const name=displayValue(sourceSession,`${node.attrs.kind}.${node.attrs.id}.name`);if(name)medicines.push(name);}});
  if(medicines.length){const section=doc.content.find(n=>n.attrs?.id==='travelMedications');section.content=section.content.filter(n=>n.type!=='medicationRow');
   for(const name of medicines){const id=crypto.randomUUID(),choice=definition('travel.name').options.find(option=>option.value===name||option.labels.includes(name));s.values[`travel.${id}.name`]={value:choice?.value||'OTHER',status:'inherited'};if(!choice)s.values[`travel.${id}.other`]={value:name,status:'inherited'};section.content.splice(section.content.length-1,0,medicationRow('travel',id,language));}
  }
 }
 return hydrate(doc);
}
async function openTemplate(template,reset=false){
 document.documentElement.lang='en';const version=++opening;
 if(editor){
  if(!reset){commitField(editor);patientMemory.remember(editor.state,baseline);}
  document.querySelector('.editor-dropdown')?.close(false);
  const saved=patientMemory.documents.get(template);
  if(saved){language=sessionOf(saved.state.doc).language;editor.view.updateState(saved.state);baseline=saved.baseline;updateSession(editor,s=>patientMemory.merge(s),{addToHistory:false,force:true});}
  else{const doc=editor.schema.nodeFromJSON(templateContent(template,!reset));editor.view.updateState(EditorState.create({schema:editor.schema,plugins:editor.state.plugins,doc}));updateSession(editor,s=>s,{addToHistory:false,force:true});baseline=editor.state.doc;}
  try{localStorage.setItem('documentLanguage',language);}catch{}
  editor.setOptions({editorProps:{attributes:{...editor.options.editorProps.attributes,lang:language}}});
  patientMemory.capture(sessionOf(editor.state.doc));patientMemory.remember(editor.state,baseline);dirty=patientMemory.dirty(editor.state,baseline);banner.hidden=true;renderToolbar();renderSidebar();
  if(saved)editor.view.focus();else focusInitialField(editor);return;
 }
 app.replaceChildren(el('p',{class:'editor-loading',role:'status'},tr('กำลังเปิดเอกสาร…','Opening your document…')));
 await document.fonts.ready;if(version!==opening)return;
 pagesLayer=el('div',{class:'paper-layer'});fieldPanel=el('div',{class:'field-panel'});sectionPanel=el('div');sidebar=el('aside',{class:'editor-sidebar','aria-label':tr('เครื่องมือข้อมูลและหัวข้อ','Field and section tools')},[fieldPanel,sectionPanel]);
 banner=el('div',{class:'validation-banner',role:'status',hidden:true});status=el('span');
 const mount=el('div',{id:'document-editor'});
 app.replaceChildren(el('div',{class:'editor-toolbar',id:'toolbar'}),banner,el('main',{class:'editor-workspace'},[el('div',{class:'canvas-scroll'},el('div',{class:'document-surface'},[pagesLayer,mount])),sidebar]),el('div',{class:'status-bar'},[status,el('span',{},tr('PDF เป็นรูปแบบอ้างอิงสำหรับการพิมพ์','PDF is the authoritative printed layout'))]));
 editor=new Editor({element:mount,
  extensions:[StarterKit.configure({document:false,blockquote:false,code:false,codeBlock:false,horizontalRule:false,strike:false,link:false,trailingNode:false}),
   SessionData.extend({name:'doc',atom:false,selectable:false,content:'sessionData block+',topNode:true,addAttributes(){return {};},renderHTML(){return ['div',{},0];}}),
   SessionData,TemplateText,Field,Phrase,ClinicalSection,ClinicalGroup,MedicationRow,BodyText,PageBreak,Picture,InsertionPoint,TextStyle,FontSize,TextAlign.configure({types:['heading','paragraph']}),LayoutAttributes,FieldBehaviour.extend({priority:1000}),Pagination.configure({onLayout:renderPages})],
  content:templateContent(template),
  editorProps:{attributes:{role:'textbox','aria-label':tr('เนื้อหาเอกสารที่แก้ไขได้','Editable document body'),'aria-multiline':'true',lang:language,spellcheck:'false'}},
  onCreate:({editor:e})=>{updateSession(e,s=>s,{addToHistory:false,force:true});baseline=e.state.doc;patientMemory.capture(sessionOf(e.state.doc));patientMemory.remember(e.state,baseline);dirty=false;focusInitialField(e);renderSidebar();},
  onUpdate:({editor:e,transaction})=>{patientMemory.capture(sessionOf(e.state.doc),sessionOf(transaction.before));if(baseline?.type){patientMemory.remember(e.state,baseline);dirty=patientMemory.dirty(e.state,baseline);}if(editor){saveDoctorPreferences();renderSidebar();}},
  onSelectionUpdate:()=>{if(editor){renderFieldPanel();const menu=document.querySelector('.editor-dropdown');if(menu?.dataset.occurrence&&menu.dataset.occurrence!==activeField(editor)?.node.attrs.occurrence)menu.close(false);}},
 });
 window.clinical.editor=editor;renderToolbar();renderPages({pages:1,stable:true});renderSidebar();
}
function locations(type){const out=[];editor.state.doc.descendants((node,pos)=>{if(node.type.name===type)out.push({node,pos});});return out;}
function findSection(id){return locations('clinicalSection').find(entry=>entry.node.attrs.id===id);}
function closingPosition(){let pos=editor.state.doc.content.size,signature=pos;editor.state.doc.descendants((node,p)=>{if(node.attrs.role==='closing')pos=Math.min(pos,p);if(node.attrs.role==='signature'||node.type.name==='clinicalGroup'&&node.attrs.id==='signature')signature=Math.min(signature,p);});return Math.min(pos,signature);}
function nodeFromJson(json){return editor.schema.nodeFromJSON(hydrate({type:'doc',content:[{type:'sessionData',attrs:sessionOf(editor.state.doc)},json]}).content[1]);}
function addSections(ids,fresh=false,anchorId=null){
 const current=new Set(locations('clinicalSection').map(s=>s.node.attrs.id)),s=sessionOf(editor.state.doc),nodes=[];const resetIds=[],relocated=[];
 const point=locations('insertionPoint').find(p=>p.node.attrs.id===anchorId);
 for(const id of ids) {
  if(current.has(id)||!INSERT_BLOCKS[id]?.documents.includes(s.template)||point?.node.attrs.allowed&&!point.node.attrs.allowed.includes(id))continue;
  let json=!fresh&&s.archives[id]?structuredClone(s.archives[id]):buildBlock(id,language,s.template);
  const removeDuplicates=n=>{if(n.content)n.content=n.content.flatMap(c=>{if(c.type==='clinicalSection'&&current.has(c.attrs.id)){const existing=id==='hiv'&&['art','pickup'].includes(c.attrs.id)&&findSection(c.attrs.id);if(existing){relocated.push(existing);return [existing.node.toJSON()];}return [];}return [removeDuplicates(c)];});return n;};json=removeDuplicates(json);
  walk(json,n=>{if(n.type==='clinicalSection')current.add(n.attrs.id);if(fresh&&n.type==='field')resetIds.push(n.attrs.id);});nodes.push(json);
 }
 if(!nodes.length)return;
 let transaction=closeHistory(editor.state.tr);
 const next=structuredClone(s);for(const id of resetIds)delete next.values[id];
 for(const node of nodes)for(const [id,value]of Object.entries(sectionDefaults(node.attrs.id,language)))if(!next.values[id])next.values[id]={value,status:'default'};
 patchSession(transaction.setMeta('sessionUpdate',true),next);
 for(const entry of relocated.sort((a,b)=>b.pos-a.pos))transaction.delete(entry.pos,entry.pos+entry.node.nodeSize);
 const mainPoint=locations('insertionPoint').find(p=>p.node.attrs.id==='clinical'),closingPoint=locations('insertionPoint').find(p=>p.node.attrs.id==='closing');
 const body=locations('bodyText')[0],position=closingPoint?.pos??closingPosition(),normalPosition=point?.pos??mainPoint?.pos??(body?body.pos+body.node.nodeSize-1:position);
 let normal=nodes.filter(n=>!INSERT_BLOCKS[n.attrs.id].closing);const closing=nodes.filter(n=>INSERT_BLOCKS[n.attrs.id].closing),nested=normal.filter(n=>['art','oi','pickup'].includes(n.attrs.id)),pendingHiv=normal.find(n=>n.attrs.id==='hiv'),hivPoint=locations('insertionPoint').find(p=>p.node.attrs.id==='hiv.optional');
 if(nested.length&&(pendingHiv||hivPoint)){
  if(pendingHiv)walk(pendingHiv,parent=>{const index=parent.content?.findIndex(n=>n.attrs?.id==='hiv.optional');if(index>=0)parent.content.splice(index,0,...nested);});
  else transaction.insert(hivPoint.pos,nested.map(nodeFromJson));
  normal=normal.filter(n=>!nested.includes(n));
 }
 if(s.template==='referral'){
  const grouped=new Map();for(const node of [...normal,...closing]){const id=referralPoint(node.attrs.id);if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(node);}
  for(const [id,items]of grouped){const group=locations('clinicalGroup').find(p=>p.node.attrs.id===id),destination=locations('insertionPoint').find(p=>p.node.attrs.id===id)?.pos??(group?group.pos+group.node.nodeSize-1:position);transaction.insert(transaction.mapping.map(destination),items.map(nodeFromJson));}
 }else{
  if(normal.length)transaction.insert(transaction.mapping.map(normalPosition),normal.map(nodeFromJson));
  if(closing.length)transaction.insert(transaction.mapping.map(position),closing.map(nodeFromJson));
 }
 editor.view.dispatch(transaction);
 const added=new Set(nodes.map(node=>node.attrs.id));
 const first=fieldsInOrder(editor).find(field=>{const $pos=editor.state.doc.resolve(field.pos+1);for(let depth=$pos.depth;depth>0;depth--)if($pos.node(depth).type.name==='clinicalSection'&&added.has($pos.node(depth).attrs.id))return true;return false;});focusField(editor,first);return !!first;
}
function removeSection(entry){const s=structuredClone(sessionOf(editor.state.doc));s.archives[entry.node.attrs.id]=entry.node.toJSON();editor.view.dispatch(patchSession(closeHistory(editor.state.tr).setMeta('sessionUpdate',true),s).delete(entry.pos,entry.pos+entry.node.nodeSize));}
function moveEntry(entry,delta,type){
 const $pos=editor.state.doc.resolve(entry.pos),parent=$pos.parent,index=$pos.index();let targetIndex=index+delta;
 while(targetIndex>=0&&targetIndex<parent.childCount&&parent.child(targetIndex).type.name!==type)targetIndex+=delta;
 if(targetIndex<0||targetIndex>=parent.childCount)return;
 const target=parent.child(targetIndex);let targetPos=$pos.start();for(let i=0;i<targetIndex;i++)targetPos+=parent.child(i).nodeSize;
 const tr=closeHistory(editor.state.tr).delete(entry.pos,entry.pos+entry.node.nodeSize);tr.insert(delta<0?targetPos:targetPos+target.nodeSize-entry.node.nodeSize,entry.node);editor.view.dispatch(tr);
}
function addMedication(sectionId,kind){const section=findSection(sectionId);if(!section)return;const row=medicationRow(kind,crypto.randomUUID(),language),point=locations('insertionPoint').find(p=>p.node.attrs.id==='medicine:'+sectionId),position=point?.pos??section.pos+section.node.nodeSize-1;editor.view.dispatch(closeHistory(editor.state.tr).insert(position,nodeFromJson(row)));focusField(editor,fieldsInOrder(editor).find(f=>f.pos>=position));}
function removeRow(entry){const s=structuredClone(sessionOf(editor.state.doc));s.archives[`row:${entry.node.attrs.kind}:${entry.node.attrs.id}`]=entry.node.toJSON();editor.view.dispatch(patchSession(closeHistory(editor.state.tr).setMeta('sessionUpdate',true),s).delete(entry.pos,entry.pos+entry.node.nodeSize));}
function restoreRows(sectionId,kind){const section=findSection(sectionId),s=sessionOf(editor.state.doc);const archived=Object.entries(s.archives).filter(([key])=>key.startsWith(`row:${kind}:`));const existing=new Set(locations('medicationRow').map(x=>x.node.attrs.id));const rows=archived.map(([,row])=>row).filter(row=>!existing.has(row.attrs.id)),point=locations('insertionPoint').find(p=>p.node.attrs.id==='medicine:'+sectionId);if(section&&rows.length)editor.view.dispatch(closeHistory(editor.state.tr).insert(point?.pos??section.pos+section.node.nodeSize-1,rows.map(nodeFromJson)));}
function renderSidebar(){if(!editor||!sidebar)return;lastField='';renderFieldPanel();const s=sessionOf(editor.state.doc);
 sectionPanel.replaceChildren(el('h2',{},tr('หัวข้อในเอกสาร','Document sections')),button('+ Insert Block',blockDialog,{class:'primary'}));
 for(const entry of locations('clinicalSection')) {
  const id=entry.node.attrs.id,name=label(INSERT_BLOCKS[id]?.labels||[id,id],'en'),item=el('div',{class:'section-item','data-section-control':id},[el('strong',{},name),el('div',{class:'panel-actions'},[button('↑',()=>moveEntry(entry,-1,'clinicalSection'),{'aria-label':ui('up')+': '+name}),button('↓',()=>moveEntry(entry,1,'clinicalSection'),{'aria-label':ui('down')+': '+name}),button(ui('remove'),()=>removeSection(entry),{'aria-label':ui('remove')+': '+name,class:'danger'})])]);
  const kind={art:'art',otherMedications:'otherMed',travelMedications:'travel'}[id];
  if(kind) {
   item.append(button('+ '+tr('เพิ่มยา','Add medicine'),()=>addMedication(id,kind),{'aria-label':tr('เพิ่มยา','Add medicine')}),button(ui('restore'),()=>restoreRows(id,kind),{title:tr('คืนรายการยาที่นำออกในหน้านี้','Restore removed medication rows')}));
   for(const row of locations('medicationRow').filter(r=>r.node.attrs.kind===kind&&r.pos>entry.pos&&r.pos<entry.pos+entry.node.nodeSize))item.append(el('div',{class:'row-controls'},[el('span',{},displayValue(s,`${kind}.${row.node.attrs.id}.name`)||tr('ยังไม่ได้ระบุยา','Unnamed medication')),button('↑',()=>moveEntry(row,-1,'medicationRow'),{'aria-label':tr('เลื่อนยาขึ้น','Move medicine up')}),button('↓',()=>moveEntry(row,1,'medicationRow'),{'aria-label':tr('เลื่อนยาลง','Move medicine down')}),button('×',()=>removeRow(row),{'aria-label':tr('นำยาออก','Remove medicine')})]));
  }
  sectionPanel.append(item);
 }
 const removed=Object.keys(s.archives).filter(id=>INSERT_BLOCKS[id]&&!findSection(id));if(removed.length)sectionPanel.append(el('h2',{style:'margin-top:16px'},tr('หัวข้อที่นำออก','Removed sections')),...removed.map(id=>button(ui('restore')+': '+label(INSERT_BLOCKS[id].labels,'en'),()=>addSections([id]))));
}
function fieldScope(entry){
 const $pos=editor.state.doc.resolve(entry.pos+1);let depth=$pos.depth;
 for(let d=$pos.depth-1;d>0;d--)if($pos.node(d).type.name==='phrase'&&$pos.node(d).attrs.guard.includes(entry.node.attrs.id)){depth=d;break;}
 if(depth===$pos.depth)for(let d=$pos.depth-1;d>0;d--)if($pos.node(d).isTextblock&&(($pos.node(d).attrs.guard||[]).includes(entry.node.attrs.id)||$pos.node(d).content.content.some(n=>n.marks.some(m=>m.type.name==='templateText'))||$pos.node(d).childCount===1)){depth=d;break;}
 while(depth>1&&['paragraph','heading','listItem'].includes($pos.node(depth-1).type.name)&&$pos.node(depth-1).childCount===1)depth--;
 let sectionDepth=0;for(let d=depth-1;d>0;d--)if($pos.node(d).type.name==='clinicalSection'){sectionDepth=d;break;}
 const path=[];if(sectionDepth)for(let d=sectionDepth;d<depth-1;d++)path.push($pos.index(d));
 return {pos:$pos.before(depth),size:$pos.node(depth).nodeSize,node:$pos.node(depth).toJSON(),section:sectionDepth?$pos.node(sectionDepth).attrs.id:null,path,index:$pos.index(depth-1)};
}
function removeFields(id,one){
 const entries=locations('field').filter(f=>f.node.attrs.id===id&&(!one||f.node.attrs.occurrence===one.node.attrs.occurrence)),ranges=[];
 for(const entry of entries){const scope=fieldScope(entry);if(!ranges.some(r=>r.pos===scope.pos))ranges.push({...scope,occurrence:entry.node.attrs.occurrence,id});}
 const next=structuredClone(sessionOf(editor.state.doc));for(const range of ranges)next.fieldArchives[range.occurrence]=range;
 const tr=patchSession(closeHistory(editor.state.tr).setMeta('sessionUpdate',true),next);for(const range of ranges.sort((a,b)=>b.pos-a.pos))tr.delete(range.pos,range.pos+range.size);editor.view.dispatch(tr);
}
function restoreField(occurrence){
 let record=sessionOf(editor.state.doc).fieldArchives[occurrence];if(!record)return;
 if(record.section&&!findSection(record.section)){addSections([record.section]);record=sessionOf(editor.state.doc).fieldArchives[occurrence];}
 const pos=Math.max(1,Math.min(record.pos,editor.state.doc.content.size)),next=structuredClone(sessionOf(editor.state.doc));delete next.fieldArchives[occurrence];
 const tr=closeHistory(editor.state.tr).insert(pos,nodeFromJson(record.node));patchSession(tr.setMeta('sessionUpdate',true),next);editor.view.dispatch(tr);
 focusField(editor,fieldsInOrder(editor).find(f=>f.node.attrs.occurrence===occurrence));
}
function renderFieldPanel(){if(!editor||!fieldPanel)return;if(editor.state.selection.node?.type.name==='picture'){pictureTools(editor.state.selection.node,editor.state.selection.from);return;}const entry=activeField(editor),s=sessionOf(editor.state.doc),key=entry?entry.node.attrs.occurrence+':'+s.language+':'+entry.node.attrs.status+':'+entry.node.attrs.error:'';if(lastField===key&&fieldPanel.childNodes.length)return;lastField=key;
 fieldPanel.replaceChildren(el('h2',{},tr('ช่องข้อมูลที่เลือก','Selected field')));
 if(s.omitted.length)fieldPanel.append(...s.omitted.map(id=>button(ui('restore')+': '+label(definition(id).labels,'en'),()=>updateSession(editor,next=>({...next,omitted:next.omitted.filter(k=>k!==id)})))));
 for(const [occurrence,record]of Object.entries(s.fieldArchives||{}))fieldPanel.append(button('Restore occurrence: '+label(definition(record.id).labels,'en'),()=>restoreField(occurrence)));
 if(!entry){fieldPanel.append(el('p',{},tr('คลิกช่องที่มีสี หรือใช้ Tab เพื่อกรอกข้อมูล','Select a highlighted field, or use Tab to continue.')));return;}
 const id=entry.node.attrs.id,def=definition(id);fieldPanel.append(el('strong',{},label(def.labels,'en')),el('p',{},entry.node.attrs.error||(entry.node.attrs.status==='override'?tr('ปรับแก้เอง ค่าจะไม่ถูกคำนวณทับจนกว่าจะกดคำนวณใหม่','Manual override; automatic recalculation is paused.'):entry.node.attrs.status==='calculated'?tr('ค่านี้คำนวณอัตโนมัติและยังแก้ไขได้','Calculated value; you can still edit it.'):tr('ข้อมูลในช่องจะถูกเลือกทั้งหมดเมื่อใช้ Tab','Tab selects the entire value for replacement.'))));
 if(def.inputHint)fieldPanel.append(el('p',{},def.inputHint));
 if(def.options)fieldPanel.append(button(tr('เลือกจากรายการ','Choose from catalogue'),()=>choiceDialog(entry)));
 const actions=el('div',{class:'panel-actions'},[
 button(tr('ล้างค่า','Clear value'),()=>setValue(id,'')),
 button(tr('ละเว้นทุกตำแหน่ง','Omit all occurrences'),()=>updateSession(editor,next=>({...next,omitted:[...new Set([...next.omitted,id])]})),{disabled:entry.node.attrs.required}),
 button(tr('นำตำแหน่งนี้ออก','Remove this occurrence'),()=>removeFields(id,entry),{disabled:entry.node.attrs.required}),
 button(tr('นำทุกตำแหน่งออก','Remove all occurrences'),()=>removeFields(id),{disabled:entry.node.attrs.required}),
 button(tr('แปลงเป็นข้อความ','Convert to text'),()=>{const text=displayValue(sessionOf(editor.state.doc),id);if(!text)return;const s=structuredClone(sessionOf(editor.state.doc));s.converted=[...new Set([...(s.converted||[]),id])];const tr=patchSession(closeHistory(editor.state.tr).setMeta('sessionUpdate',true),s),$pos=editor.state.doc.resolve(entry.pos+1);for(let d=$pos.depth-1;d>0;d--)if(($pos.node(d).attrs.guard||[]).includes(id))tr.setNodeMarkup($pos.before(d),undefined,{...$pos.node(d).attrs,guard:$pos.node(d).attrs.guard.filter(key=>key!==id)});editor.view.dispatch(tr.replaceWith(entry.pos,entry.pos+entry.node.nodeSize,editor.schema.text(text,entry.node.firstChild?.marks)));},{disabled:['OTHER','Other'].includes(valueOf(s,id))})]);
 if(!valueOf(s,id)&&(/^art\.[^.]+\.tablets$/.test(id)||id==='pickup.days'))actions.append(button(id==='pickup.days'?'Use legacy preset: 60 days':'Use legacy preset: 1 tablet',()=>setValue(id,id==='pickup.days'?'60':'1')));
 if(id==='patient.age')actions.append(button(tr('คำนวณอายุใหม่','Recalculate Age'),()=>updateSession(editor,next=>recalculate(next,'patient.age'),{recalculate:'patient.age'})));
 if(id.startsWith('syphilis.dose')||id==='syphilis.start'||id==='syphilis.regimen'||id==='syphilis.duration')actions.append(button(tr('คำนวณกำหนดการใหม่','Recalculate Schedule'),()=>updateSession(editor,next=>recalculate(next,'bpg'),{recalculate:'bpg'})));
 fieldPanel.append(actions);
}
function setValue(id,value){updateSession(editor,s=>{s.values[id]={value:normalise(id,value,s.language),status:definition(id)?.calculated?'override':'manual'};return s;});}
function dropdown(title,content,actions=[],anchor=null){
 document.querySelector('.editor-dropdown')?.close(false);
 const entry=activeField(editor);anchor=anchor||(entry&&editor.view.nodeDOM(entry.pos))||(locations('insertionPoint').find(p=>p.node.attrs.id==='clinical')&&editor.view.nodeDOM(locations('insertionPoint').find(p=>p.node.attrs.id==='clinical').pos))||document.querySelector('#toolbar');
 const node=el('section',{class:'editor-dropdown',role:'region','aria-label':title},[el('h2',{},title),...content,el('div',{class:'dialog-actions'},[button(ui('close'),()=>node.close()),...actions])]);
 node.contentEditable='false';const occurrence=anchor.dataset.occurrence;
 const position=()=>{const rect=anchor.getBoundingClientRect(),width=Math.min(420,window.innerWidth-24);node.style.width=width+'px';const height=node.offsetHeight,below=window.innerHeight-rect.bottom-12;node.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';node.style.top=Math.max(12,Math.min(below>=height?rect.bottom+6:rect.top-height-6,window.innerHeight-height-12))+'px';};
 const outside=event=>{if(!node.contains(event.target)&&!anchor.contains(event.target))node.close(false);};
 const outsideFocus=event=>{if(!node.contains(event.target)&&!editor.view.dom.contains(event.target))node.close(false);};
 const observer=new ResizeObserver(position);
 node.close=(focus=true)=>{observer.disconnect();window.removeEventListener('scroll',position,true);window.removeEventListener('resize',position);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('focusin',outsideFocus);anchor.removeAttribute('aria-controls');anchor.removeAttribute('aria-expanded');node.remove();if(focus){const point=anchor.dataset.insertionPoint&&locations('insertionPoint').find(p=>p.node.attrs.id===anchor.dataset.insertionPoint);focusStop(editor,point||fieldsInOrder(editor).find(f=>f.node.attrs.occurrence===occurrence),false);}};
 app.append(node);position();observer.observe(node);window.addEventListener('scroll',position,true);window.addEventListener('resize',position);document.addEventListener('pointerdown',outside,true);document.addEventListener('focusin',outsideFocus);node.querySelector('input,button')?.focus();return node;
}
function keyboardChoices(modal,list,search,choose,finish,multi=true,anchor=null){
 let index=-1,toggled=false;
 const highlight=()=>{[...list.children].forEach((row,i)=>{row.classList.toggle('is-current-choice',i===index);row.setAttribute('aria-current',String(i===index));row.id||=`${modal.id}-choice-${i}`;});if(index>=0){const row=list.children[index];row?.scrollIntoView({block:'nearest'});(document.activeElement===editor.view.dom?editor.view.dom:search).setAttribute('aria-activedescendant',row.id);}};
 search.addEventListener('input',()=>{index=-1;toggled=false;highlight();});
 list.addEventListener('change',event=>{index=[...list.children].findIndex(row=>row.contains(event.target));toggled=true;highlight();});
 modal.handleKey=event=>{
  if((event.target.closest?.('button')&&event.target!==anchor||event.target.matches?.('input')&&!list.contains(event.target)&&event.target!==search)&&['Enter',' '].includes(event.key))return false;
  if(['ArrowDown','ArrowUp'].includes(event.key)){const count=list.children.length;if(count){index=index<0?(event.key==='ArrowDown'?0:count-1):(index+(event.key==='ArrowDown'?1:-1)+count)%count;toggled=false;highlight();}return true;}
  const input=list.children[index]?.querySelector('input');
  if(event.key===' '&&multi&&input){choose(input,!input.checked);toggled=true;return true;}
  if(event.key==='Enter'||event.key==='Tab'){if(input&&!event.shiftKey&&!toggled)choose(input,true);return finish(event.key==='Tab',event.shiftKey);}
  return false;
 };
}
function choiceDialog(entry,automatic=false){
 const existing=document.querySelector('.editor-dropdown');if(existing?.dataset.occurrence===entry.node.attrs.occurrence){if(!automatic)existing.querySelector('input')?.focus();return;}
 const id=entry.node.attrs.id,def=definition(id),value=valueOf(sessionOf(editor.state.doc),id),multi=def.type==='multi',selected=new Set((Array.isArray(value)?value:[value]).filter(value=>!multi||String(value).trim())),list=el('div',{class:'catalogue-list'}),search=el('input',{class:'catalogue-search',placeholder:tr('ค้นหา','Search'),'aria-label':tr('ค้นหาตัวเลือก','Search options')});
 if(!def.options)return;
 focusField(editor,entry,false);
 const options=[...def.options,...(!multi?[{value:'',labels:['เว้นว่าง','Leave blank']}]:[])];let changed=false;
 const choose=(value,checked=true)=>{if(!multi)selected.clear();if(checked)selected.add(value);else selected.delete(value);if(id==='mpox.risks'&&checked){if(value==='noneKnown'){selected.clear();selected.add(value);}else selected.delete('noneKnown');}changed=true;};
 const checks=()=>list.querySelectorAll('[data-choice-value]').forEach(input=>{input.checked=selected.has(input.dataset.choiceValue);});
 const draw=()=>{list.replaceChildren(...options.filter(o=>o.labels.join(' ').toLowerCase().includes(search.value.toLowerCase())||o.value.toLowerCase().includes(search.value.toLowerCase())).map(o=>el('label',{class:'field-choice'},[el('input',{type:multi?'checkbox':'radio',name:'choice','data-choice-value':o.value,checked:selected.has(o.value),onchange:e=>{choose(o.value,e.target.checked);checks();}}),label(o.labels,language)])));};
 search.addEventListener('input',draw);draw();let modal;
 const finish=(advance=false,back=false)=>{if(changed)setValue(id,multi?[...selected]:[...selected][0]||'');else commitField(editor);modal.close(false);const current=fieldsInOrder(editor).find(f=>f.node.attrs.occurrence===entry.node.attrs.occurrence);focusField(editor,current,false);return advance?moveField(editor,back):true;};
 const actions=[button('Clear value',()=>{setValue(id,'');modal.close();}),button('Remove this occurrence',()=>{modal.close(false);removeFields(id,entry);})];
 actions.unshift(button('Apply selection',()=>{changed=true;finish();},{class:'primary'}));
 modal=dropdown(label(def.labels,'en'),[search,el('p',{class:'choice-hint'},'↑/↓ Choose · Enter Apply · Tab Apply and next'+(multi?' · Space Toggle multiple choices':'')),list],actions,editor.view.nodeDOM(entry.pos));
 modal.dataset.occurrence=entry.node.attrs.occurrence;modal.id='field-options-'+entry.node.attrs.occurrence;const field=editor.view.nodeDOM(entry.pos);field.setAttribute('aria-expanded','true');field.setAttribute('aria-controls',modal.id);
 keyboardChoices(modal,list,search,(input,checked)=>{choose(input.dataset.choiceValue,checked);checks();},finish,multi);
 if(automatic)editor.view.focus();
}
function blockDialog(context={}){
 const existing=document.querySelector('.editor-dropdown');if(context.id&&existing?.dataset.insertionId===context.id){if(!context.automatic)existing.querySelector('input')?.focus();return;}
 const s=sessionOf(editor.state.doc),selected=new Set(),list=el('div',{class:'catalogue-list'}),search=el('input',{class:'catalogue-search',placeholder:tr('ค้นหาหัวข้อ เช่น HIV, ยา, วัณโรค','Search blocks, e.g. patient, CD4, medication'),'aria-label':tr('ค้นหาหัวข้อ','Search blocks')}),fresh=el('input',{type:'checkbox'});
 const draw=()=>{list.replaceChildren(...Object.values(INSERT_BLOCKS).filter(section=>section.documents.includes(s.template)&&!findSection(section.id)&&(!context.allowed||context.allowed.includes(section.id))&&(context.kind!=='closing'||section.closing)&&[section.id,...section.labels].join(' ').toLowerCase().includes(search.value.toLowerCase())).map(section=>el('label',{class:'field-choice'},[el('input',{type:'checkbox','data-section-choice':section.id,checked:selected.has(section.id),onchange:e=>e.target.checked?selected.add(section.id):selected.delete(section.id)}),el('span',{},[label(section.labels,language),s.archives[section.id]?el('small',{},'Restores the previous values and wording'):null])])));};
 search.addEventListener('input',draw);draw();let modal;const point=locations('insertionPoint').find(p=>p.node.attrs.id===context.id);
 const finish=(advance=false,back=false)=>{modal.close(false);if(!back&&selected.size&&addSections([...selected],fresh.checked,context.id))return true;const current=point&&locations('insertionPoint').find(p=>p.node.attrs.id===context.id);focusStop(editor,current||activeField(editor),false);return advance?moveField(editor,back):true;};
 modal=dropdown('Insert Block',[search,el('p',{class:'choice-hint'},'↑/↓ Choose · Space Toggle multiple blocks · Enter/Tab Add and continue'),list,el('label',{class:'field-choice'},[fresh,'Start selected blocks afresh (clears their shared values)'])],[button(ui('add'),()=>finish(),{class:'primary'})],point?editor.view.nodeDOM(point.pos):null);
 modal.id='block-options-'+crypto.randomUUID();if(point)modal.dataset.insertionId=context.id;
 keyboardChoices(modal,list,search,(input,checked)=>{input.checked=checked;if(checked)selected.add(input.dataset.sectionChoice);else selected.delete(input.dataset.sectionChoice);},finish,true,point&&editor.view.nodeDOM(point.pos)?.querySelector('button'));
 if(context.automatic&&point)focusStop(editor,point,false);
}
function afterCurrentParagraph(){const {$from}=editor.state.selection;for(let d=$from.depth;d>0;d--)if($from.node(d).isTextblock)return $from.after(d);return editor.state.selection.to;}
function choosePicture(){
 let position=afterCurrentParagraph();const current=activeField(editor);if(current&&['document.date','document.title','document.addressee','referral.purposes','referral.customPurpose'].includes(current.node.attrs.id)){const body=locations('bodyText')[0];position=body?body.pos+body.node.nodeSize-1:closingPosition();}
 const target=editor,generation=opening,input=el('input',{type:'file',accept:'image/png,image/jpeg',hidden:true});app.append(input);const track=({transaction})=>{position=transaction.mapping.map(position,1);};target.on('transaction',track);
 const finish=()=>{target.off('transaction',track);input.remove();};
 input.addEventListener('change',async()=>{try{if(!input.files[0])return;const attrs=await readPicture(input.files[0]);if(editor!==target||target.isDestroyed||generation!==opening)return;editor.commands.insertContentAt(position,{type:'picture',attrs});editor.chain().focus().setNodeSelection(position).run();renderFieldPanel();}catch(error){showMessage(error.message+' Your letter is preserved.');}finally{finish();}},{once:true});
 input.addEventListener('cancel',finish,{once:true});input.click();
}
function pictureTools(node,pos){
 const update=attrs=>editor.view.dispatch(editor.state.tr.setNodeMarkup(pos,undefined,{...node.attrs,...attrs}));
 const alt=el('input',{'aria-label':'Picture description',value:node.attrs.alt,maxlength:PICTURE_LIMITS.caption,onchange:event=>update({alt:event.target.value})});
 const caption=el('input',{'aria-label':'Picture caption',value:node.attrs.caption,maxlength:PICTURE_LIMITS.caption,placeholder:'Optional caption',onchange:event=>update({caption:event.target.value})});
 const widths=[25,50,75,100];if(!widths.includes(node.attrs.width))widths.push(node.attrs.width);
 fieldPanel.replaceChildren(el('h2',{},'Picture'),el('div',{class:'image-tools'},[el('p',{},'Drag a corner to resize proportionally.'),el('label',{},['Description',alt]),el('label',{},['Caption',caption]),selectControl('Picture width',widths.sort((a,b)=>a-b).map(n=>[n,n===100?'Full width':`${Number(n.toFixed(1))}% width`]),value=>update({width:Number(value)})),button('Remove picture',()=>editor.view.dispatch(closeHistory(editor.state.tr).delete(pos,pos+node.nodeSize)),{class:'danger'})]));
 fieldPanel.querySelector('select').value=String(node.attrs.width);
}
function insertPageBreak(){const {$from}=editor.state.selection;let pos=editor.state.doc.content.size;for(let d=$from.depth;d>0;d--)if($from.node(d).isTextblock){pos=$from.after(d);break;}editor.commands.insertContentAt(pos,{type:'pageBreak'});editor.commands.focus();}
function shortcutHelp(){
 const shortcuts=[['↑ / ↓','Highlight a field choice or block'],['Enter','Apply a choice, add selected blocks, or close an unselected menu'],['Space','Toggle multiple choices/blocks; activate Add medicine'],['Alt+↓','Search choices for the selected field or insertion button'],['Tab','Next field or Add button; add selected blocks and focus their first field'],['Shift+Tab','Previous field or Add button'],['Ctrl/Cmd+Z',ui('undo')],['Ctrl/Cmd+Shift+Z / Ctrl+Y',ui('redo')],['Ctrl/Cmd+B','Bold'],['Ctrl/Cmd+I','Italic'],['Ctrl/Cmd+U','Underline'],['Ctrl/Cmd+P',ui('print')],['Escape','Close contextual overlays']];
 dropdown(ui('help'),[el('table',{class:'shortcuts-table'},el('tbody',{},shortcuts.map(([key,text])=>el('tr',{},[el('td',{},el('kbd',{},key)),el('td',{},text)])))),el('p',{},'Tab follows fields and Add buttons in document order. Selected blocks focus their first new field; unselected menus are skipped. The last stop tabs to PDF Preview, then to the document date. Shift+Tab at the first stop leaves the document. Use Move Up/Down in the section panel to reorder sections.')]);
}
function showMessage(message){banner.hidden=false;banner.replaceChildren(document.createTextNode(message));}
function showErrors(errors){banner.hidden=!errors.length;if(errors.length)banner.replaceChildren(el('strong',{},tr('โปรดตรวจสอบข้อมูลก่อนพิมพ์หรือดาวน์โหลด','Review these fields before printing or downloading')),el('ul',{},errors.map(error=>el('li',{},button(`${error.label}: ${error.message}`,()=>focusField(editor,fieldsInOrder(editor).find(f=>f.node.attrs.id===error.id)))))));}
function payload(){
 const doc=editor.getJSON(),s=sessionOf(doc);
 for(const [id,record]of Object.entries(s.values))if(record.editing)s.values[id]={...record,value:normalise(id,record.value,s.language),editing:false};
 doc.content[0].attrs=recalculate(s);
 return {doc,errors:validateDocument(doc),payload:{type:label(TEMPLATE_NAMES[s.template],'en'),patientName:valueOf(s,'patient.name')||valueOf(s,'document.addressee'),language:s.language,content:toPdf(doc)}};
}
async function exportDocument(action){
 if(busy)return;
 const snapshot=payload();showErrors(snapshot.errors);if(action!=='preview'&&snapshot.errors.length)return;
 busy=true;
 try {
  if(action==='download')await PdfGenerator.save(snapshot.payload);
  else if(action==='print')await PdfGenerator.print(snapshot.payload);
  else {
   const modal=el('dialog',{class:'preview-dialog'},[el('div',{class:'dialog-actions'},[el('strong',{},ui('preview')),button(ui('close'),()=>modal.close())]),el('p',{class:'privacy-hint'},snapshot.errors.length?tr('ตัวอย่างมีข้อมูลที่ต้องตรวจสอบ ยังไม่สามารถพิมพ์หรือดาวน์โหลดฉบับสมบูรณ์ได้','Preview contains incomplete information. Complete validation before final export.'):tr('โปรดตรวจสอบรูปแบบและเนื้อหาก่อนพิมพ์','Review the layout and clinical content before printing.'))]);
   app.append(modal);modal.showModal();let url='';modal.addEventListener('close',()=>{modal.remove();if(url)URL.revokeObjectURL(url);});
   const blob=await PdfGenerator.generateBlob(snapshot.payload);if(!modal.open)return;
   url=URL.createObjectURL(blob);modal.append(el('iframe',{class:'preview-frame',title:ui('preview'),src:url}));
  }
 }catch{showMessage(tr('ไม่สามารถสร้าง PDF ได้ ข้อมูลในเอกสารยังอยู่ครบ กรุณาลองอีกครั้ง','Unable to generate the PDF. Your letter is preserved. Please try again.'));}
 finally{busy=false;}
}
function clearForm(){if(dirty&&!confirm('Clear all patient information, pictures and edits in every retained template? Doctor preferences and the selected template/language are kept.'))return;const template=sessionOf(editor.state.doc).template;saveDoctorPreferences();patientMemory.clear();dirty=false;openTemplate(template,true);}
window.clinical={editor:null,payload,setValue,addSections,switchTemplate:navigate,get layout(){return layout;},get dirty(){return dirty;}};
document.addEventListener('fieldchoices',event=>{if(!editor)return;const entry=fieldsInOrder(editor).find(f=>f.node.attrs.occurrence===event.detail.occurrence);if(entry)choiceDialog(entry,event.detail.automatic);});
document.addEventListener('fieldinputlimit',event=>showMessage('The pasted value exceeds this field’s input limit. The existing value was kept. '+definition(event.detail.id).inputHint));
document.addEventListener('fieldremove',event=>{if(!editor)return;const entry=locations('field').find(f=>f.node.attrs.occurrence===event.detail.occurrence);if(entry){document.querySelector('.editor-dropdown')?.close(false);removeFields(entry.node.attrs.id,entry);editor.view.focus();}});
document.addEventListener('insertblocks',event=>{if(!editor)return;const point=event.detail;if(point.kind==='medicine')addMedication(point.section,{art:'art',otherMedications:'otherMed',travelMedications:'travel'}[point.section]);else blockDialog(point);});
document.addEventListener('keydown',event=>{const menu=document.querySelector('.editor-dropdown');if(!menu||event.isComposing||editor?.view.composing)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();menu.close();}else if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&(menu.contains(event.target)||editor?.view.dom.contains(event.target))&&menu.handleKey?.(event)){event.preventDefault();event.stopPropagation();}},true);
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
window.addEventListener('popstate',()=>{currentPath=location.pathname;openTemplate(templateAtPath(currentPath));});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='p'&&editor&&!document.querySelector('dialog[open]')){event.preventDefault();exportDocument('print');}});
openTemplate(templateAtPath(location.pathname));
