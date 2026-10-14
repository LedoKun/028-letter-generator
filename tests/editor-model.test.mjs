import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIELDS,definition,legacyFieldMap,TEMPLATE_NAMES} from '../public/editor/fields.mjs';
import {createDocument,buildSection,medicationRow,SECTIONS,INSERT_BLOCKS,buildBlock,FINANCIAL,referralPoint,sectionDefaults,REFERRAL_POINTS,availableBlocks} from '../public/editor/templates.mjs';
import {parseClinicalDate,displayDate,calculateAge,addCalendarDays,inclusiveDays,today} from '../public/editor/dates.mjs';
import {hydrate,sessionOf,walk,valueOf,displayValue,normalise,recalculate,validateDocument,fieldRequirements,visibleFields,formatFieldInput,templateProse,fieldError,inputFitsField} from '../public/editor/model.mjs';
import {toPdf} from '../public/editor/pdf.mjs';
globalThis.window={};await import('../public/shared/pdf-generator.js');
function make(template='referral',language='en',values={},sections=[]) {
 const doc=createDocument(template,language,{}),s=sessionOf(doc);
 for(const [id,value]of Object.entries({'document.date':'10/10/2026','patient.name':'FICTIONAL PATIENT','doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ','doctor.license':'ว.12345',...values}))s.values[id]={value:Array.isArray(value)?value:normalise(id,value,language),status:'manual'};
 for(const id of sections){if(section(doc,id))continue;for(const [field,value]of Object.entries(sectionDefaults(id,language)))if(!s.values[field])s.values[field]={value,status:'default'};const point=template==='referral'?referralPoint(id):'clinical';let inserted=false;walk(doc,parent=>{if(inserted)return;const index=parent.content?.findIndex(node=>node.type==='insertionPoint'&&node.attrs.id===point);if(index>=0){parent.content.splice(index,0,buildSection(id,language));inserted=true;}else if(template==='referral'&&parent.type==='clinicalGroup'&&parent.attrs.id===point){parent.content.push(buildSection(id,language));inserted=true;}});assert.ok(inserted,id);}
 s.activeSections=[];walk(doc,n=>{if(n.type==='clinicalSection')s.activeSections.push(n.attrs.id);});doc.content[0].attrs=recalculate(s);
 return hydrate(doc);
}
function pdfText(content){if(Array.isArray(content))return content.map(pdfText).join('');if(!content||typeof content!=='object')return '';return (typeof content.text==='string'?content.text:pdfText(content.text))+(content.stack?pdfText(content.stack):'')+(content.ul?pdfText(content.ul):'')+(content.ol?pdfText(content.ol):'');}
const output=doc=>pdfText(toPdf(doc));
function appendMedicine(doc,sectionId,row){walk(section(doc,sectionId),parent=>{const index=parent.content?.findIndex(n=>n.type==='insertionPoint'&&n.attrs.id==='medicine:'+sectionId);if(index>=0)parent.content.splice(index,0,row);});}
function section(doc,id){let found;walk(doc,node=>{if(node.type==='clinicalSection'&&node.attrs.id===id)found=node;});return found;}
test('referral purpose retains acronym casing and the clinic uses its official name',()=>{
 const option=FIELDS['referral.purposes'].options.find(option=>option.value==='hivCareTreatment');assert.equal(option.labels[1],'HIV care and treatment');
 const doc=make('referral','en',{'referral.purposes':['hivCareTreatment']});const text=output(doc);assert.match(text,/Medical Referral Letter/);assert.match(text,/for HIV care and treatment/);assert.match(text,/Please contact Public Health Center 28 Krung Thon Buri, should you require any further information\./);
 for(const template of Object.keys(TEMPLATE_NAMES))assert.doesNotMatch(output(make(template,'en',{},template==='medical'?['examination','attendance']:[])),/Public Health Centre|Public Health Center 28,/);
});
for(const template of Object.keys(TEMPLATE_NAMES))for(const language of ['th','en'])test(`one blank line follows the title in the editor and PDF: ${template}/${language}`,()=>{
 const doc=make(template,language),index=doc.content.findIndex(node=>node.type==='heading'&&node.attrs.level===1),space=doc.content[index+1];
 assert.equal(space.type,'paragraph');assert.equal(space.attrs.role,'titleSpace');assert.deepEqual(space.content,[]);assert.equal(space.attrs.spacingAfter,8);
 const pdf=toPdf(doc),titleIndex=pdf.findIndex(block=>block.fontSize===16);assert.ok(titleIndex>=0);assert.deepEqual(pdf[titleIndex+1],{text:'',margin:[0,0,0,8]});
});
test('block availability returns only unused choices and restores removed sections',()=>{
 const session=sessionOf(make()),context={allowed:REFERRAL_POINTS.clinical};assert.deepEqual(availableBlocks(session,context).map(block=>block.id),REFERRAL_POINTS.clinical.filter(id=>id!=='otherHistory'));assert.ok(!availableBlocks(session).some(block=>block.id==='otherHistory'));
 session.activeSections.push(...REFERRAL_POINTS.clinical);assert.deepEqual(availableBlocks(session,context),[]);session.activeSections=session.activeSections.filter(id=>id!=='hbv');assert.deepEqual(availableBlocks(session,context).map(block=>block.id),['hbv']);
 session.activeSections.push('oi');assert.deepEqual(availableBlocks(session,{allowed:['oi']}),[]);session.activeSections=session.activeSections.filter(id=>id!=='oi');assert.deepEqual(availableBlocks(session,{allowed:['oi']}).map(block=>block.id),['oi']);
 const point=[];walk(buildSection('hiv','en'),node=>{if(node.type==='insertionPoint'&&node.attrs.id==='hiv.optional')point.push(node);});assert.equal(point[0].attrs.kind,'section');assert.deepEqual(point[0].attrs.allowed,['oi']);
});
for(const [input,th,en]of [['09/10/2026','09/10/2569','09/10/2026'],['09/10/2569','09/10/2569','09/10/2026'],['2026','2569','2026'],['2569','2569','2026'],['10/2569','10/2569','10/2026'],['29/02/2567','29/02/2567','29/02/2024'],['31/12/2026','31/12/2569','31/12/2026']])test(`precision-preserving BE/CE date ${input}`,()=>{
 assert.equal(displayDate(input,'th'),th);assert.equal(displayDate(input,'en'),en);const ce=parseClinicalDate(input).iso;assert.equal(displayDate(ce,'th'),th);assert.equal(parseClinicalDate(displayDate(ce,'th')).iso,ce);
});
for(const invalid of ['31/04/2026','29/02/2026','00/01/2026','01/13/2026','13/2026','bad','10/10/26','2026-02-30'])test(`invalid date retained without fabrication: ${invalid}`,()=>{assert.equal(parseClinicalDate(invalid),null);assert.equal(displayDate(invalid,'th'),invalid);});
for(const [dob,date,age]of [['10/10/2000','09/10/2026',25],['10/10/2543','10/10/2569',26],['10/10/2000','11/10/2026',26],['29/02/2000','28/02/2025',24],['29/02/2000','01/03/2025',25],['10/2000','10/10/2026',null],['2000','10/10/2026',null],['11/10/2026','10/10/2026',null],['31/04/2000','10/10/2026',null]])test(`completed age: ${dob} at ${date}`,()=>assert.equal(calculateAge(dob,date),age));
test('age uses an included examination date and preserves manual correction',()=>{
 const doc=make('medical','en',{'patient.dob':'10/10/2000','examination.date':'09/10/2026'},['examination']);let s=sessionOf(doc);assert.equal(valueOf(s,'patient.age'),'25');
 s.values['patient.age']={value:'30',status:'override'};s.values['document.date']={value:'2027-10-10'};assert.equal(valueOf(recalculate(s),'patient.age'),'30');assert.equal(valueOf(recalculate(s,'patient.age'),'patient.age'),'25');
 s.activeSections=[];assert.equal(valueOf(recalculate(s,'patient.age'),'patient.age'),'27');
 assert.ok(visibleFields(doc).includes('patient.age'));
});
for(const [start,dose2,dose3]of [['06/06/2026','2026-06-13','2026-06-20'],['28/12/2026','2027-01-04','2027-01-11'],['25/02/2024','2024-03-03','2024-03-10'],['25/02/2567','2024-03-03','2024-03-10']])test(`weekly BPG calendar schedule from ${start}`,()=>{
 const doc=make('referral','en',{'syphilis.start':start,'syphilis.regimen':'Benzathine'},['syphilis']),s=sessionOf(doc);
 assert.equal(valueOf(s,'syphilis.dose1'),parseClinicalDate(start).iso);assert.equal(valueOf(s,'syphilis.dose2'),dose2);assert.equal(valueOf(s,'syphilis.dose3'),dose3);assert.match(output(doc),/Scheduled Benzathine penicillin G dose 1/);assert.doesNotMatch(output(doc),/was administered|received.*injection/i);
 for(const n of [1,2,3])assert.ok(visibleFields(doc).includes(`syphilis.dose${n}`));
});
test('BPG overrides survive source changes until explicit recalculation',()=>{
 let s=sessionOf(make('referral','th',{'syphilis.start':'06/06/2569','syphilis.regimen':'Benzathine'},['syphilis']));s.values['syphilis.dose2']={value:'2026-06-15',status:'override'};s.values['syphilis.start']={value:'2026-07-01'};s=recalculate(s);assert.equal(valueOf(s,'syphilis.dose2'),'2026-06-15');s=recalculate(s,'bpg');assert.equal(valueOf(s,'syphilis.dose2'),'2026-07-08');assert.equal(displayDate(valueOf(s,'syphilis.dose2'),'th'),'08/07/2569');
});
for(const [regimen,days]of [['Doxycycline2Weeks','14'],['Doxycycline28Days','28']])test(`${regimen} has duration without a BPG schedule`,()=>{
 const doc=make('referral','en',{'syphilis.start':'06/06/2026','syphilis.regimen':regimen},['syphilis']);assert.equal(valueOf(sessionOf(doc),'syphilis.duration'),days);assert.doesNotMatch(output(doc),/Scheduled Benzathine penicillin G|scheduled injection dates/);assert.ok(!visibleFields(doc).includes('syphilis.dose2'));
});
test('inclusive leave days reject reversed ranges',()=>{assert.equal(inclusiveDays('10/10/2026','12/10/2569'),3);assert.equal(inclusiveDays('10/10/2026','09/10/2026'),null);assert.equal(inclusiveDays('10/2026','12/10/2026'),null);const doc=make('medical','en',{'leave.start':'10/10/2026','leave.end':'09/10/2026'},['leave']);assert.ok(validateDocument(doc).some(e=>e.id==='leave.end'));assert.doesNotMatch(output(doc),/N\/A/);});
test('referral defaults contain latest laboratory results and no disease, admission or financial request',()=>{const doc=make();let ids=[];walk(doc,n=>{if(n.type==='clinicalSection')ids.push(n.attrs.id);});assert.deepEqual(ids,['lab']);assert.match(output(doc),/Latest laboratory results/);assert.doesNotMatch(output(doc),/HIV|Syphilis|HBV|HCV|Mpox|TB|attached|summaris|financial assistance|No history/i);});
for(const [id,pattern]of [['patient.passport',/Passport/],['patient.nationalId',/National ID/]])test(`empty optional identity unit omitted: ${id}`,()=>{let doc=make();assert.doesNotMatch(output(doc),pattern);doc=make('referral','en',{[id]:id==='patient.nationalId'?'1234567890123':'AB1234'});assert.match(output(doc),pattern);sessionOf(doc).omitted.push(id);assert.doesNotMatch(output(doc),pattern);assert.ok(!visibleFields(doc).includes(id));sessionOf(doc).omitted=[];assert.match(output(doc),pattern);});
test('CD4 at first visit count, percentage and date omit cleanly',()=>{
 let doc=make('referral','en',{},['hiv']);assert.doesNotMatch(output(doc),/CD4|Latest HIV viral load|Medication supply|Other Medications|\(\)/);
 doc=make('referral','en',{'hiv.initialCD4':'325'},['hiv']);assert.match(output(doc),/CD4 at first visit: 325 cells\/mm³/);assert.doesNotMatch(output(doc),/\(%|measured on/);
 doc=make('referral','th',{'hiv.initialCD4':'325','hiv.initialCD4Percent':'18%','hiv.initialCD4Date':'10/01/2026','hiv.latestVL':'<20','hiv.latestVLDate':'09/10/2026'},['hiv']);assert.match(output(doc),/ผล CD4 เมื่อมารับบริการครั้งแรก 325 cells\/mm³ \(18%\) ตรวจเมื่อวันที่ 10\/01\/2569/);assert.match(output(doc),/<20 copies\/mL/);
 doc=make('referral','en',{'hiv.initialCD4Percent':'18'},['hiv']);assert.match(output(doc),/CD4 percentage at first visit: 18%/);
});
for(const [values,expected,absent]of [[{'pickup.date':'09/10/2026','pickup.days':'60'},/last collected medication on 09\/10\/2026, with a 60-day supply/,/N\/A/],[{'pickup.date':'09/10/2026','pickup.days':''},/last collected medication on 09\/10\/2026\./,/-day supply/],[{'pickup.date':'','pickup.days':'60'},/A 60-day medication supply was provided/,/last collected medication/],[{'pickup.date':'','pickup.days':''},/Full name/,/last collected medication|medication supply was provided/]])test(`independent pick-up and supply: ${JSON.stringify(values)}`,()=>{const text=output(make('referral','en',values,['pickup']));assert.match(text,expected);assert.doesNotMatch(text,absent);assert.doesNotMatch(text,/adherence|never collected/);});
test('all eleven original disease/history modules have real content and preserved field bindings',()=>{const disease=Object.values(SECTIONS).filter(s=>s.disease);assert.equal(disease.length,11);for(const section of disease){const node=buildSection(section.id,'en');const fields=[];walk(node,n=>{if(n.type==='field'){assert.ok(definition(n.attrs.id),n.attrs.id);fields.push(n.attrs.id);}});if(!['hbv','hcvActive','syphilisHistory'].includes(section.id))assert.ok(fields.length,section.id);assert.ok(section.originalIds[0]);}});
test('ART, OI and independent other medication rows preserve all dosing fields',()=>{
 const doc=make('referral','en',{'art.one.name':'TDF/3TC/DTG','art.one.tablets':'1','art.one.time':'930','oi.tablets':'2','otherMed.one.name':'Fluconazole','otherMed.one.strength':'200 mg','otherMed.one.frequency':'OD','otherMed.one.quantity':'28'},['art','oi','otherMedications']);
 for(const [sectionId,kind]of [['art','art'],['otherMedications','otherMed']])appendMedicine(doc,sectionId,medicationRow(kind,'one','en'));
 const text=output(doc);for(const part of ['TDF/3TC/DTG','1 tablet once daily at 09:30','TMX/SMP 80/400 mg','2 tablets once daily','Fluconazole','200 mg','OD','28'])assert.ok(text.includes(part),part);assert.doesNotMatch(text,/N\/A|None specified/);
});
for(const language of ['th','en'])test(`ART frequency survives entering or clearing administration time: ${language}`,()=>{
 for(const time of ['','2000','']){
  const doc=make('referral',language,{'art.one.name':'TDF/3TC/DTG','art.one.tablets':'1','art.one.time':time},['art']);appendMedicine(doc,'art',medicationRow('art','one',language));
  const text=output(doc);assert.ok(text.includes(language==='th'?'1 เม็ด วันละ 1 ครั้ง':'1 tablet once daily'));
  if(time)assert.ok(text.includes(language==='th'?'วันละ 1 ครั้ง เวลา 20:00 น.':'once daily at 20:00'));else assert.doesNotMatch(text,/เวลา| at /);
 }
});
test('blank medication rows are rejected and empty optional headings omitted',()=>{const doc=make('referral','en',{},['otherMedications']);assert.doesNotMatch(output(doc),/Other Medications/);section(doc,'otherMedications').content.push(medicationRow('otherMed','one','en'));assert.ok(validateDocument(doc).some(e=>e.id==='otherMed.one.name'));});
test('travel medication OTHER requires a named medicine and no fabricated dose',()=>{
 const doc=make('medication','en',{'patient.dob':'10/10/2000'});assert.ok(validateDocument(doc).some(e=>e.id==='travel.name'));
 const s=sessionOf(doc);s.values['travel.1.name']={value:'OTHER'};assert.ok(validateDocument(doc).some(e=>e.id==='travel.1.other'));
 s.values['travel.1.other']={value:'FICTIONAL MEDICINE'};assert.equal(validateDocument(doc).length,0);assert.match(output(doc),/FICTIONAL MEDICINE/);assert.doesNotMatch(output(doc),/\bOTHER\b|N\/A|None specified| tablets|daily/);
});
test('mpox requires symptoms and risk history and keeps suspicion distinct from diagnosis',()=>{
 let doc=make('referral','en',{},['mpox']);assert.ok(validateDocument(doc).some(e=>e.id==='mpox.symptoms'));assert.match(output(doc),/Suspected Mpox/);assert.doesNotMatch(output(doc),/confirmed|No known risk/);
 doc=make('referral','en',{'mpox.days':'4','mpox.symptoms':['rashLesions','other'],'mpox.risks':['noneKnown','animal']},['mpox']);assert.ok(validateDocument(doc).some(e=>e.id==='mpox.symptomOther'));assert.ok(validateDocument(doc).some(e=>e.id==='mpox.risks'&&/cannot/.test(e.message)));
});
test('TB multi-site and TPT partial-date fields keep historical and ongoing status separate',()=>{
 const doc=make('referral','en',{'tb.sites':['Pulmonary','Lymph nodes','Other'],'tb.siteOther':'Skin','tb.regimen':'2HRZE/4HR','tb.completed':'08/08/2566','tpt.completed.regimen':'3HP','tpt.completed.start':'09/2565','tpt.ongoing.regimen':'Other','tpt.ongoing.other':'Clinician-specified regimen','tpt.ongoing.start':'09/2568'},['tbHistory','tptCompleted','tptOngoing']);
 const text=output(doc);for(const part of ['Pulmonary','Lymph nodes','Skin','2HRZE/4HR','08/08/2023','Completed tuberculosis preventive treatment','Ongoing tuberculosis preventive treatment','09/2022','09/2025','Clinician-specified regimen'])assert.ok(text.includes(part),part);assert.doesNotMatch(text,/01\/09\/2022|01\/09\/2025|no history/);
});
for(const language of ['th','en'])test(`financial assistance remains optional, editable and before the closing: ${language}`,()=>{
 const doc=make('referral',language,{},['admission','financial']);const text=output(doc);assert.ok(text.includes(FINANCIAL[language==='th'?0:1]));assert.ok(text.indexOf(FINANCIAL[language==='th'?0:1])<text.indexOf(language==='th'?'ขอแสดงความนับถือ':'Yours faithfully')); assert.doesNotMatch(text,/funding has been approved|cannot afford|destitute|qualifies/);
 const node=section(doc,'financial');node.content[0].content=[{type:'text',text:'Clinician-edited request.'}];assert.match(output(doc),/Clinician-edited request/);walk(doc,parent=>{if(parent.content)parent.content=parent.content.filter(n=>n.type!=='clinicalSection'||n.attrs.id!=='financial');});assert.doesNotMatch(output(doc),/Clinician-edited request|financial assistance/);
});
test('Thai PDF body wraps at words without changing prose, formatting or session data',()=>{
 const doc=make('referral','th',{},['financial']),request=section(doc,'financial');
 request.content[0].content[0].marks.push({type:'bold'},{type:'textStyle',attrs:{fontSize:'14pt'}});
 const before=JSON.stringify(doc),paragraph=toPdf(doc).find(n=>pdfText(n)===FINANCIAL[0]);
 assert.ok(paragraph);assert.equal(JSON.stringify(doc),before);
 const thaiRuns=paragraph.text.filter(run=>/[\u0E00-\u0E7F]/.test(run.text));
 assert.ok(thaiRuns.length>20);for(const run of thaiRuns){assert.equal(run.bold,true);assert.equal(run.fontSize,14);assert.equal([...new Intl.Segmenter('th',{granularity:'word'}).segment(run.text)].length,1);}
 assert.doesNotMatch(pdfText(paragraph),/[\u200B\uFFFD]/);assert.ok(paragraph.text.some(run=>run.text===''));
});
for(const language of ['th','en'])test(`ART adherence uses the requested prefix: ${language}`,()=>{
 const text=output(make('referral',language,{'hiv.adherence':'>95%'},['hiv']));
 assert.match(text,language==='th'?/ART adherence >95%/:/The patient reported ART adherence of >95%\./);
 assert.doesNotMatch(text,/ผู้ป่วยรายงานความสม่ำเสมอในการรับประทาน ART เท่ากับ/);
});
test('formatting and manual prose survive conversion; editing decorations are excluded',()=>{
 const doc=make();doc.content.splice(3,0,{type:'paragraph',attrs:{textAlign:'center',indent:2,spacingAfter:12},content:[{type:'text',text:'Manual 2569 prose.',marks:[{type:'bold'},{type:'italic'},{type:'underline'},{type:'textStyle',attrs:{fontSize:'14pt'}}]}]});const content=toPdf(doc),p=content.find(n=>n.text?.some?.(t=>t.text==='Manual 2569 prose.'));
 assert.equal(p.alignment,'center');assert.deepEqual(p.margin,[24,0,0,12]);assert.equal(p.text[0].bold,true);assert.equal(p.text[0].italics,true);assert.equal(p.text[0].decoration,'underline');assert.equal(p.text[0].fontSize,14);assert.doesNotMatch(JSON.stringify(content),/background|data-field|shortcut|clinical-field|N\/A|is-focused/);
});
for(const template of Object.keys(TEMPLATE_NAMES))for(const language of ['th','en'])test(`manual wording in an empty optional phrase exports: ${template}/${language}`,()=>{
 const doc=make(template,language,{'doctor.license':''});let phrase;
 walk(doc,node=>{if(node.type==='phrase'&&node.attrs.guard?.includes('doctor.license'))phrase=node;});
 assert.ok(phrase);assert.doesNotMatch(output(doc),/MANUAL WORDING/);
 phrase.content.unshift({type:'text',text:'MANUAL WORDING',marks:[{type:'bold'}]});
 assert.match(output(doc),/MANUAL WORDING/);
 const before=JSON.stringify(doc);toPdf(doc);assert.equal(JSON.stringify(doc),before);
});
test('edited template labels survive empty fields and their enclosing guarded bullets',()=>{
 const doc=make('referral','en',{},['hiv']);let phrase;
 walk(doc,node=>{if(node.type==='phrase'&&node.attrs.guard?.includes('hiv.napId'))phrase=node;});
 phrase.content[0].text='Clinician-edited HIV identifier wording';
 assert.match(output(doc),/Clinician-edited HIV identifier wording/);
 assert.doesNotMatch(output(doc),/CD4 at first visit|The latest HIV VL/);
});
test('formatting an untouched optional label does not make its empty phrase printable',()=>{
 const doc=make('referral','en');let phrase;
 walk(doc,node=>{if(node.type==='phrase'&&node.attrs.guard?.includes('patient.passport'))phrase=node;});
 const prefix=phrase.content[0];phrase.content.splice(0,1,{...prefix,text:prefix.text.slice(0,4)},{...prefix,text:prefix.text.slice(4),marks:[...prefix.marks,{type:'italic'}]});
 assert.doesNotMatch(output(doc),/Passport/);
});
test('manual edits to empty medication headings and unnamed rows survive preview validation',()=>{
 const doc=make('referral','en',{},['hiv','otherMedications']),art=section(doc,'art'),other=section(doc,'otherMedications');
 art.content[0].content[0].content[0].content[0].text='Edited ART wording';
 other.content[0].content[0].text='Edited other medication heading';
 assert.match(output(doc),/Edited other medication heading/);
 const row=medicationRow('otherMed','manual','en');row.content[0].content.push({type:'text',text:'Manual medication note'});other.content.push(row);
 const text=output(doc);assert.match(text,/Edited ART wording/);assert.match(text,/Edited other medication heading/);assert.match(text,/Manual medication note/);
 assert.ok(validateDocument(doc).some(error=>error.id==='otherMed.manual.name'));
});
test('deliberate blank paragraphs and standalone hard breaks survive nested export',()=>{
 const doc=make(),point=doc.content.find(node=>node.type==='clinicalGroup'&&node.attrs.id==='closing');
 point.content.unshift({type:'paragraph',content:[]},{type:'paragraph',content:[{type:'phrase',content:[{type:'phrase',attrs:{guard:['patient.passport']},content:[]}]}]},{type:'paragraph',content:[{type:'hardBreak'}]},{type:'paragraph',content:[{type:'text',text:'Manual closing text'}]});
 const pdf=toPdf(doc),index=pdf.findIndex(block=>pdfText(block)==='Manual closing text');
 assert.equal(pdf[index-3].text,'\u00A0');assert.equal(pdf[index-2].text,'\u00A0');assert.equal(pdfText(pdf[index-1]),'\n');
});
test('manual wording still respects explicit omission and inactive conditional branches',()=>{
 const doc=make('referral','en',{},['hiv']);let phrase;
 walk(doc,node=>{if(node.type==='phrase'&&node.attrs.guard?.includes('hiv.napId'))phrase=node;});
 phrase.content.unshift({type:'text',text:'MANUAL IDENTIFIER WORDING'});sessionOf(doc).omitted.push('hiv.napId');
 assert.doesNotMatch(output(doc),/MANUAL IDENTIFIER WORDING/);
 sessionOf(doc).omitted=[];phrase.attrs.condition=['equals','patient.name','ANOTHER PATIENT'];assert.doesNotMatch(output(doc),/MANUAL IDENTIFIER WORDING/);
});
for(const template of Object.keys(TEMPLATE_NAMES))test(`paragraph prompts surround insertion buttons without exporting empty space: ${template}`,()=>{
 const doc=make(template,'en');let prompts=0;
 walk(doc,parent=>{for(const [index,node]of (parent.content||[]).entries()){
  if(node.attrs?.prosePlaceholder)prompts++;
  if(node.type==='insertionPoint'){assert.equal(parent.content[index-1].attrs.prosePlaceholder,true);assert.equal(parent.content[index+1].attrs.prosePlaceholder,true);}
 }});
 assert.ok(prompts);assert.doesNotMatch(output(doc),/\u00A0|Click to add a paragraph/);
});
test('manual page breaks, bulleted and numbered lists export as selectable PDF text',()=>{
 const doc=make();doc.content.splice(3,0,{type:'pageBreak'},...['bulletList','orderedList'].map(type=>({type,content:[{type:'listItem',content:[{type:'paragraph',content:[{type:'text',text:'List item'}]}]}]})));const pdf=toPdf(doc);assert.ok(pdf.some(n=>n.pageBreak==='before'));assert.ok(pdf.some(n=>n.ul));assert.ok(pdf.some(n=>n.ol));assert.match(pdfText(pdf),/List item/);
});
test('PDF conversion is pure even with invalid or omitted values',()=>{const doc=make('referral','en',{'patient.dob':'bad'},['hiv','financial']);sessionOf(doc).archives.hbv=buildSection('hbv','en');sessionOf(doc).omitted.push('patient.passport');const before=JSON.stringify(doc);toPdf(doc);validateDocument(doc);assert.equal(JSON.stringify(doc),before);});
test('official header/footer preserve the approved logo height, text and layout',()=>{
 const current=readFileSync(new URL('../public/shared/pdf-generator.js',import.meta.url),'utf8'),legacy=readFileSync(new URL('./fixtures/legacy-pdf-generator.cjs',import.meta.url),'utf8');
 const header=source=>source.slice(source.indexOf('    function makeHeader('),source.indexOf('    function makeFooter(')).replace(/fontSize:\s*\d+(?:\.\d+)?/g,'fontSize: APPROVED');assert.equal(header(current),header(legacy).replace('Public Health Center 28 - Krung Thon Buri','Public Health Center 28 Krung Thon Buri').replace('width: 223, margin:', 'height: 223 * 1182 / 5300, margin:'));
 const footer=source=>source.slice(source.indexOf('    function makeFooter('),source.indexOf('    function buildDocDefinition(')),literals=source=>[...source.matchAll(/text\('([^']+)'/g)].map(match=>match[1]);assert.deepEqual(literals(footer(current)),literals(footer(legacy)));assert.equal(footer(current).match(/bold\(`([^`]+)`/)[1],footer(legacy).match(/bold\(`([^`]+)`/)[1]);
});
test('examination insertion defaults to today without adding an examination to the template',()=>{
 const date=parseClinicalDate(today()).iso;assert.deepEqual(sectionDefaults('examination'),{'examination.date':date});
 const doc=createDocument('medical','en');assert.equal(valueOf(sessionOf(doc),'examination.date'),'');assert.ok(!section(doc,'examination'));
 const included=make('medical','en',{},['examination']);assert.equal(valueOf(sessionOf(included),'examination.date'),date);
 const corrected=make('medical','en',{'examination.date':'09/10/2026'},['examination']);assert.equal(valueOf(sessionOf(corrected),'examination.date'),'2026-10-09');
 const cleared=make('medical','en',{'examination.date':''},['examination']);assert.equal(valueOf(sessionOf(cleared),'examination.date'),'');assert.ok(validateDocument(cleared).some(error=>error.id==='examination.date'));
});
test('all first-visit CD4 labels use the required terminology and preserve legacy identifiers',()=>{
 assert.equal(legacyFieldMap.initialCD4,'hiv.initialCD4');assert.equal(FIELDS['hiv.initialCD4'].labels[1],'CD4 at first visit');assert.equal(FIELDS['hiv.initialCD4Percent'].labels[1],'CD4 percentage at first visit');assert.equal(FIELDS['hiv.initialCD4Date'].labels[1],'Date of CD4 test at first visit');const source=readFileSync(new URL('../public/editor/fields.mjs',import.meta.url),'utf8')+readFileSync(new URL('../public/editor/templates.mjs',import.meta.url),'utf8')+readFileSync(new URL('../public/shared/pdf-templates.js',import.meta.url),'utf8');assert.doesNotMatch(source,/Baseline CD4/);
});
test('no selected referral purpose becomes a medical summary without unsupported referral prose',()=>{const doc=make('referral','en',{'referral.purposes':[]});const text=output(doc);assert.match(text,/Medical Summary/);assert.doesNotMatch(text,/am writing to refer|Purpose of Referral|Primary purpose/);});
test('a custom purpose can be used alone without dangling subject punctuation',()=>{const doc=make('referral','en',{'referral.purposes':[],'referral.customPurpose':'Clinical assessment'});assert.match(output(doc),/refer the patient detailed below for Clinical assessment/);assert.doesNotMatch(output(doc),/Primary purpose\(s\):/);});
test('partial formatting within a field is preserved when its displayed text is unchanged',()=>{const doc=make('referral','en',{'patient.name':'JOHN SMITH'});walk(doc,n=>{if(n.type==='field'&&n.attrs.id==='patient.name')n.content=[{type:'text',text:'JOHN',marks:[{type:'bold'}]},{type:'text',text:' SMITH'}];});const pdf=toPdf(doc);const runs=pdf.find(p=>p.text?.some?.(r=>r.text==='JOHN')).text;assert.equal(runs.find(r=>r.text==='JOHN').bold,true);assert.equal(runs.find(r=>r.text===' SMITH').bold,undefined);});
test('restored fields retain partial formatting and multiline values',()=>{
 const doc=make('referral','en',{'history.other':'First line\nSecond line'},['otherHistory']);let field;walk(doc,n=>{if(n.type==='field'&&n.attrs.id==='history.other')field=n;});
 field.content=[{type:'text',text:'First line',marks:[{type:'bold'}]},{type:'hardBreak'},{type:'text',text:'Second line'}];
 let restored;walk(hydrate(doc),n=>{if(n.type==='field'&&n.attrs.id==='history.other')restored=n;});assert.deepEqual(restored.content,field.content);
 sessionOf(doc).values['history.other'].value='Updated line\nStill bold';walk(hydrate(doc),n=>{if(n.type==='field'&&n.attrs.id==='history.other')restored=n;});assert.equal(restored.content[1].type,'hardBreak');assert.deepEqual(restored.content[2].marks,[{type:'bold'}]);
});

for(const [id,raw,expected]of [['document.date','09102026','09/10/2026'],['document.date','2026','2026'],['hiv.initialCD4Date','10/2569','10/2569'],['tpt.ongoing.start','102026','10/2026'],['patient.nationalId','1234567890123','1-2345-67890-12-3'],['patient.nationalId','123456','1-2345-6'],['hiv.napId','1234567890','1234-567890'],['hiv.napId','1234','1234'],['patient.name','09102026','09102026']])test(`automatic formatting for ${id}: ${raw}`,()=>assert.equal(formatFieldInput(id,raw),expected));
test('formatting does not discard invalid or excessive data',()=>{for(const [id,raw]of [['patient.nationalId','12345678901234'],['hiv.napId','123456789012345678901'],['patient.nationalId','ABC123'],['patient.dob','INVALID DATE']])assert.equal(formatFieldInput(id,raw),raw);});
test('date and National ID entry limits preserve exact and partial-date precision',()=>{
 for(const [id,value,allowed]of [['document.date','10/10/2569',true],['document.date','10102569',true],['document.date','101025690',false],['document.date','01/01/20260',false],['patient.dob','BAD DATE',true],['patient.dob','VERY LONG INVALID DATE',false],['hiv.initialCD4Date','10/2569',true],['hiv.initialCD4Date','2026',true],['tpt.completed.start','092026',true],['tpt.completed.start','09/2569',true],['tpt.completed.start','0920260',false],['patient.nationalId','1-2345-67890-12-3',true],['patient.nationalId','12345678901234',false],['patient.name','Ordinary prose remains unlimited',true]])assert.equal(inputFitsField(id,value),allowed,`${id}: ${value}`);
 for(const field of Object.values(FIELDS).filter(field=>['date','partialDate','monthYear'].includes(field.type))){assert.match(field.inputHint,/CE\/BE/);assert.match(field.inputHint,/do not need to enter "\/"/);assert.equal(field.maxLength,field.type==='monthYear'?7:10);}
 assert.match(FIELDS['patient.nationalId'].inputHint,/1-2345-67890-12-3/);assert.equal(FIELDS['patient.nationalId'].maxDigits,13);
});
test('template group spacing survives PDF export without changing compact bullets or signing space',()=>{
 const doc=make('referral','en',{'hiv.napId':'1234567890'},['hiv','admission','financial']),pdf=toPdf(doc);
 const summary=pdf.find(node=>pdfText(node)==='Clinical Summary and Treatment History');assert.equal(summary.margin[1],8);
 const financial=pdf.find(node=>pdfText(node)===FINANCIAL[1]);assert.equal(financial.margin[1],8);
 const patient=pdf.find(node=>pdfText(node).startsWith('Full name:'));assert.equal(patient.margin[1],8);
 assert.equal(pdf.find(node=>node.ul).margin[3],2);assert.ok(pdf.find(node=>node.unbreakable).stack.some(node=>node.margin?.[3]===44));
});
test('new blocks include complete related field groups',()=>{
 const expected={identification:['patient.name','patient.dob','patient.age','patient.passport','patient.nationalId'],cd4:['hiv.initialCD4','hiv.initialCD4Percent','hiv.initialCD4Date'],viralLoad:['hiv.latestVL','hiv.latestVLDate'],physician:['doctor.en','doctor.license'],referralPurpose:['referral.purposes','referral.customPurpose']};
 for(const[id,fields]of Object.entries(expected)){const actual=[];walk(buildBlock(id,'en','referral'),n=>{if(n.type==='field')actual.push(n.attrs.id);});for(const field of fields)assert.ok(actual.includes(field),`${id} missing ${field}`);assert.ok(INSERT_BLOCKS[id]);}
});
test('patient identification groups demographics and IDs in three compact paragraphs',()=>{
 for(const template of Object.keys(TEMPLATE_NAMES))for(const language of ['th','en']){
  const block=buildBlock('identification',language,template),rows=block.content.map(paragraph=>{const ids=[];walk(paragraph,n=>{if(n.type==='field')ids.push(n.attrs.id);});assert.equal(paragraph.attrs.spacingAfter,2);return ids;});
  assert.equal(rows.length,3);assert.ok(rows[0].includes('patient.name'));
  assert.deepEqual(rows[1],['patient.dob','patient.age',...(['medical','referral'].includes(template)?['patient.sex']:template==='medication'?['patient.nationality','patient.nationalityOther']:[])]);
  assert.deepEqual(rows[2],['patient.nationalId','patient.passport']);
 }
});
test('TMX/SMP additional text exports without the Other prophylaxis label',()=>{
 for(const language of ['th','en']){
  const doc=make('referral',language,{'oi.tablets':'2','oi.details':'Clinician-entered prophylaxis details'},['oi']);
  assert.match(output(doc),/TMX\/SMP 80\/400 mg/);assert.match(output(doc),/Clinician-entered prophylaxis details/);assert.doesNotMatch(output(doc),/Other prophylaxis:|การป้องกันอื่น/);
  sessionOf(doc).omitted.push('oi.details');assert.doesNotMatch(output(doc),/Clinician-entered prophylaxis details/);
 }
});
test('the field registry covers every template offering a whole block',()=>{
 for(const block of Object.values(INSERT_BLOCKS))for(const template of block.documents)walk(buildBlock(block.id,'en',template),node=>{
  if(node.type==='field')assert.ok(definition(node.attrs.id).documents.includes(template),`${node.attrs.id} missing ${template} in ${block.id}`);
 });
});
test('free-form optional identification and signature blocks leave no empty labels',()=>{
 for(const language of ['th','en']){
  const doc=createDocument('freeform',language);doc.content.find(n=>n.type==='bodyText').content[0].content=[{type:'text',text:'Clinical note.'}];
  doc.content.splice(2,0,buildBlock('identification',language,'freeform'),buildBlock('physician',language,'freeform'));
  assert.deepEqual(validateDocument(doc),[]);
  assert.doesNotMatch(output(doc),/Patient name:|Passport no\.:|National ID:|Medical licence number:|ชื่อผู้ป่วย:|เลขที่ใบประกอบวิชาชีพ:/);
 }
});
test('required fields follow the current template and included clinical statements',()=>{
 assert.equal(fieldRequirements(make('freeform')).required.has('doctor.en'),false);
 assert.equal(fieldRequirements(make('medical')).required.has('patient.dob'),false);
 assert.equal(fieldRequirements(make('medication')).required.has('patient.dob'),true);
 const doc=make('referral','en',{'tpt.completed.regimen':'Other'},['tptCompleted']);walk(doc,node=>{if(node.attrs?.condition)node.attrs.hidden=true;});
 assert.equal(fieldRequirements(doc).required.has('tpt.completed.other'),true);
 assert.equal(fieldRequirements(make('referral','en',{'syphilis.regimen':'Benzathine'},['syphilis'])).required.has('syphilis.dose3'),true);
});
test('safe defaults and referral header ordering match the reviewed letter structure',()=>{
 const en=createDocument('freeform','en'),th=createDocument('freeform','th');assert.equal(valueOf(sessionOf(en),'document.title'),'Medical Notes');assert.equal(valueOf(sessionOf(th),'document.title'),'บันทึกข้อความ');
 const doc=createDocument('referral','th');const ordered=[];walk(doc,n=>{if(n.type==='field')ordered.push(n.attrs.id);});assert.ok(ordered.indexOf('document.addressee')<ordered.indexOf('patient.name'));assert.ok(ordered.indexOf('referral.purposes')<ordered.indexOf('patient.name'));assert.ok(ordered.includes('patient.salutation'));assert.ok(ordered.includes('patient.sex'));
 const s=sessionOf(doc);for(const id of ['pickup.days','pickup.date','art.1.tablets','syphilis.regimen','examination.date'])assert.equal(valueOf(s,id),'');
});
test('letter title and salutation have intentional formatting in PDF',()=>{
 const doc=make('freeform');doc.content.find(n=>n.type==='bodyText').content[0].content=[{type:'text',text:'Body text'}];const pdf=toPdf(doc),title=pdf.find(p=>p.text?.some?.(r=>r.text==='Medical Notes')),to=pdf.find(p=>p.text?.some?.(r=>r.text==='To '));assert.equal(title.fontSize,16);assert.equal(title.bold,true);assert.equal(title.alignment,'center');assert.equal(to.text.find(r=>r.text==='To ').bold,true);
});
test('original referral names and bullet structure avoid duplicate diagnoses',()=>{
 for(const language of ['th','en']){
  const doc=make('referral',language,{'hiv.napId':'D4-1234567890','hiv.initialCD4':'<50','hiv.initialCD4Percent':'<1%'},['hiv','hbv','hcvActive']);
  const text=output(doc);for(const diagnosis of ['Retroviral Infection','HBV Co-Infection','HCV Co-Infection'])assert.equal(text.split(diagnosis).length-1,1,diagnosis);
  assert.match(text,language==='th'?/NAP-ID D4-1234-567890/:/NAP-ID: D4-1234-567890/);assert.match(text,/<50 cells\/mm³ \(<1%\)/);assert.ok(toPdf(doc).some(block=>block.ul));assert.ok(!validateDocument(doc).some(e=>e.id.startsWith('hiv.')));
 }
});
test('referral required information matches the original selected-language physician policy',()=>{
 const doc=make('referral','en',{'doctor.license':''});assert.deepEqual(validateDocument(doc),[]);sessionOf(doc).values['doctor.en'].value='';assert.ok(validateDocument(doc).some(e=>e.id==='doctor.en'));
 const other=make('referral','en',{},['attachments']);assert.deepEqual(validateDocument(other),[]);assert.match(output(other),/Supplementary documentation/);assert.doesNotMatch(output(other),/documentation:/);
});
test('certificate wording uses the sample, preserves diagnoses and expands tuberculosis',()=>{
 const doc=make('medical','th',{'examination.date':'09/10/2026','examination.findings':'ไข้และปวดศีรษะ','examination.diagnosis':'Influenza','leave.start':'10/10/2026','leave.end':'12/10/2026','doctor.comments':'พักผ่อนให้เพียงพอ'},['examination','leave','comments','attendance']);
 const text=output(doc);for(const phrase of ['ข้าพเจ้า','ใบอนุญาตประกอบวิชาชีพเวชกรรมเลขที่','ได้ตรวจร่างกาย','อาการและผลการตรวจร่างกาย','การวินิจฉัยโรค','ความเห็นเพิ่มเติม','เห็นสมควรให้ผู้ป่วยหยุดพักรักษาตัว','รวมเป็นเวลาทั้งสิ้น 3 วัน','ขอแสดงความนับถือ','Influenza'])assert.ok(text.includes(phrase),phrase);
 assert.match(output(make('medical','en',{'treatment.tbDate':'09/10/2026'},['tbTreatment'])),/successfully completed a course of treatment for tuberculosis on 09\/10\/2026/);
 assert.doesNotMatch(output(make('medical')),/was examined|attended|received treatment/);
});
test('partial dates keep grammatical precision and singular quantities are natural',()=>{
 const doc=make('referral','en',{'hiv.diagnosed':'2020','hiv.artStart':'03/2020','hiv.initialCD4':'325','hiv.initialCD4Date':'2026','oi.tablets':'1','pickup.date':'','pickup.days':'1'},['hiv','oi','pickup']);
 const text=output(doc);assert.match(text,/Initial diagnosis recorded in 2020/);assert.match(text,/ART commenced in 03\/2020/);assert.match(text,/measured in 2026/);assert.match(text,/1 tablet once daily/);assert.match(text,/1-day medication supply was provided\./);assert.doesNotMatch(text,/on 2020|01\/03\/2020|1 tablets|1 days/);
 assert.equal(normalise('patient.age',0,'en'),'0');
});
test('required travel medicine names and Other details cannot be bypassed by removing their fields',()=>{
 const doc=make('medication','en',{'patient.dob':'10/10/2000','travel.1.name':'OTHER','travel.1.other':'FICTIONAL MEDICINE'});let row;walk(doc,node=>{if(node.type==='medicationRow')row=node;});row.content[0].content=row.content[0].content.filter(node=>node.type!=='phrase');
 assert.ok(validateDocument(doc).some(e=>e.id==='travel.1.other'));row.content[0].content=[];assert.ok(validateDocument(doc).some(e=>e.id==='travel.1.name'));
 assert.ok(validateDocument(make('medication','en',{'patient.dob':'2000','travel.1.name':'DOLUTEGRAVIR'})).some(e=>e.id==='patient.dob'));
});
test('editing controls and empty optional blocks do not satisfy the free-form body requirement',()=>{
 const doc=createDocument('freeform','en');doc.content.find(n=>n.type==='bodyText').content.push(buildBlock('identification','en','freeform'),buildBlock('cd4','en','freeform'));
 assert.ok(validateDocument(doc).some(e=>e.id==='document.body'));assert.doesNotMatch(output(doc),/Add clinical|Insert a block|insertionPoint/);
});

for(const language of ['th','en'])test(`consultation and leave certificate uses the reviewed form: ${language}`,()=>{
 const doc=make('medical',language,{'examination.date':'09/10/2026','examination.diagnosis':'Clinician-entered diagnosis','leave.start':'10/10/2026','leave.end':'12/10/2026','document.notes':'Clinician-entered notes'},['examination','leave']);
 const text=output(doc);
 assert.ok(text.includes(language==='th'?'ใบรับรองแพทย์':'Medical Certificate'));
 assert.ok(text.includes(language==='th'?'รวมเป็นเวลาทั้งสิ้น 3 วัน':'inclusive, for a total of 3 calendar days'));
 assert.match(text,/Clinician-entered diagnosis/);assert.doesNotMatch(text,/Clinician-entered notes/);assert.equal(valueOf(sessionOf(doc),'document.notes'),'Clinician-entered notes');
 assert.doesNotMatch(text,/CERTIFICATE OF TREATMENT HISTORY|reviewed the medical records|หนังสือรับรองประวัติการรักษาโรค/);
 assert.deepEqual(validateDocument(doc),[]);
});
for(const language of ['th','en'])test(`treatment-only certificate does not assert examination, fitness or clearance: ${language}`,()=>{
 const doc=make('medical',language,{'treatment.syphilisDate':'06/06/2026','treatment.syphilisNotes':'Documented administered treatment','treatment.tbDate':'01/06/2025','treatment.tbNotes':'Documented completion record','syphilis.regimen':'Benzathine','syphilis.start':'10/10/2026'},['syphilisTreatment','tbTreatment']);
 const text=output(doc);
 for(const phrase of language==='th'?['ใบรับรองแพทย์','ผู้ป่วยได้รับการรักษาโรคซิฟิลิส','จนครบกำหนดการรักษาเป็นที่เรียบร้อยแล้ว เมื่อวันที่ 01/06/2568']:['Medical Certificate','hereby certify the medical information','was administered treatment for syphilis','successfully completed a course of treatment for tuberculosis on 01/06/2025'])assert.ok(text.includes(phrase),phrase);
 assert.doesNotMatch(text,/clinically examined|unfit for work|Scheduled Benzathine penicillin G|disease-free|clearance|cured|ได้ทำการตรวจร่างกาย|สมควรหยุดพักรักษาตัว/);
 assert.deepEqual(validateDocument(doc),[]);
});
test('certificate title stays simple across included blocks while preserving manual edits',()=>{
 const doc=make('medical','en',{'treatment.tbDate':'09/10/2026'},['tbTreatment']),s=sessionOf(doc);
 assert.match(output(doc),/Medical Certificate/);
 s.activeSections.push('examination');assert.match(output(doc),/Medical Certificate/);assert.doesNotMatch(output(doc),/reviewed the medical records/);
 const title=doc.content.find(n=>n.type==='heading'&&n.attrs.level===1);title.content[0].text='A clinician-edited certificate title';
 s.activeSections=['tbTreatment'];assert.match(output(doc),/A clinician-edited certificate title/);assert.doesNotMatch(output(doc),/CERTIFICATE OF TREATMENT HISTORY/);
});
test('Thai template prose avoids English sentence and label punctuation',()=>{
 for(const doc of [...Object.keys(TEMPLATE_NAMES).map(type=>createDocument(type,'th')),...Object.keys(INSERT_BLOCKS).map(id=>buildBlock(id,'th'))])walk(doc,node=>{
  for(const mark of node.marks||[])if(mark.type==='templateText')for(const key of ['th','summaryTh','historyTh','partialTh'])if(mark.attrs[key])assert.doesNotMatch(mark.attrs[key].replace(/น\./g,''),/[.;:]/,`${key}: ${mark.attrs[key]}`);
 });
 const doc=make('referral','th',{'mpox.days':'3','mpox.symptoms':['feverChills','headache'],'mpox.risks':['noneKnown']},['mpox']);
 assert.match(output(doc),/ไข้หรือหนาวสั่น และ ปวดศีรษะ/);assert.match(output(doc),/ผู้ป่วยไม่ให้ประวัติความเสี่ยง/);assert.doesNotMatch(output(doc),/[;:]/);
});
test('reviewed referral layout separates identity, purposes and clinical information',()=>{
 const doc=make('referral','th',{'patient.salutation':'MR.','patient.sex':'MALE','referral.purposes':['continuedCare','diagnosticEvaluation'],'referral.customPurpose':'ประเมินอาการเพิ่มเติม'},['hbv']);
 const text=output(doc);
 assert.match(text,/ขอส่งตัวผู้ป่วยรายนี้เพื่อ รับการรักษาต่อ และ การตรวจวินิจฉัยเพิ่มเติม และ ประเมินอาการเพิ่มเติม โดยมีรายละเอียดดังต่อไปนี้/);
 assert.ok(text.indexOf('เรียน ')<text.indexOf('ขอส่งตัวผู้ป่วย'));assert.ok(text.indexOf('ขอส่งตัวผู้ป่วย')<text.indexOf('ชื่อ-นามสกุล'));assert.ok(text.indexOf('ชื่อ-นามสกุล')<text.indexOf('สรุปประวัติการเจ็บป่วยและการรักษา'));
 assert.match(text,/ชื่อ-นามสกุล นาย FICTIONAL PATIENT/);assert.match(text,/เพศ ชาย/);assert.doesNotMatch(text,/รายละเอียดเพิ่มเติมในการส่งตัว|วัตถุประสงค์ในการส่งตัว/);
 assert.equal(text.split('HBV Co-Infection').length-1,1);
});
test('omitted referral purpose fields leave no empty heading or labels',()=>{
 const doc=make('referral','en',{'referral.customPurpose':'Optional purpose'});sessionOf(doc).omitted.push('referral.purposes','referral.customPurpose');
 assert.doesNotMatch(output(doc),/Purpose of Referral|Primary purpose\(s\):|Additional details:/);
});
test('supplied choice values remain stable and use appropriate letter language',()=>{
 const s=sessionOf(make('referral','th',{'referral.purposes':['continuedCare','tbCareTreatment'],'hiv.adherence':'Unknown','mpox.risks':['noneKnown'],'tb.sites':['Pulmonary','Lymph nodes'],'tpt.completed.regimen':'Other'}));
 assert.equal(displayValue(s,'hiv.adherence'),'ไม่ทราบ');assert.equal(displayValue(s,'mpox.risks'),'ผู้ป่วยไม่ให้ประวัติความเสี่ยง');assert.equal(displayValue(s,'tb.sites'),'ปอด และ ต่อมน้ำเหลือง');assert.equal(displayValue(s,'tpt.completed.regimen'),'อื่น ๆ');
 assert.equal(FIELDS['art.name'].options.length,17);assert.deepEqual(FIELDS['syphilis.regimen'].options.map(o=>o.value),['Benzathine','Doxycycline2Weeks','Doxycycline28Days']);
 s.language='en';assert.match(displayValue(s,'referral.purposes'),/tuberculosis treatment/);assert.equal(valueOf(s,'referral.purposes')[1],'tbCareTreatment');
});
test('removing the last other-history field hides the clinical-summary heading without erasing its data',()=>{
 const doc=make('referral','en',{'history.other':'Retained clinical history'},['otherHistory']),s=sessionOf(doc);
 assert.match(output(doc),/Clinical Summary and Treatment History/);
 const block=section(doc,'otherHistory');block.content=block.content.filter(node=>node.type==='heading');s.availableFields=[];
 assert.doesNotMatch(output(doc),/Clinical Summary and Treatment History|Other Medical History/);assert.equal(valueOf(s,'history.other'),'Retained clinical history');
});
for(const template of Object.keys(TEMPLATE_NAMES))for(const language of ['th','en'])test(`shared plain signature and blank signing space: ${template}/${language}`,()=>{
 const doc=make(template,language),signature=doc.content.find(node=>node.type==='clinicalGroup'&&node.attrs.id==='signature');
 assert.ok(signature);assert.equal(signature.content.length,5);assert.equal(signature.content[0].attrs.role,'signatureLead');assert.equal(signature.content[0].attrs.spacingAfter,8);assert.equal(signature.content[2].attrs.spacingAfter,44);
 const text=output(doc),closing=language==='th'?'ขอแสดงความนับถือ':'Yours faithfully,',tail=text.slice(text.lastIndexOf(closing));
 assert.equal(tail,language==='th'?'ขอแสดงความนับถือนพ. ทดสอบเลขที่ใบอนุญาตประกอบวิชาชีพเวชกรรม ว.12345':'Yours faithfully,TEST DOCTORMedical licence number: ว.12345');
 assert.doesNotMatch(tail,/Signature:|Name:|ลงชื่อ|\(|\)|___|\.\.\./);
 const stack=toPdf(doc).find(node=>node.unbreakable&&pdfText(node).includes(closing));assert.ok(stack);assert.equal(stack.stack[0].text,'');assert.equal(stack.stack[0].margin[3],8);assert.ok(stack.stack.some(node=>node.text===''&&node.margin[3]===44));
});
test('English doctor prefix is contextual and never duplicated or stored in patient-session values',()=>{
 for(const name of ['TEST DOCTOR','Dr TEST DOCTOR','Dr. TEST DOCTOR'])for(const template of ['medical','referral']){
  const doc=make(template,'en',{'doctor.en':name}),text=output(doc);
  assert.match(text,/I, Dr\.? TEST DOCTOR/);assert.doesNotMatch(text,/Dr Dr|Dr Dr\./);assert.equal(valueOf(sessionOf(doc),'doctor.en'),name);
  assert.ok(text.includes(`Yours faithfully,${name}Medical licence number:`));
 }
});
test('English punctuation survives a Thai-to-English round trip without exporting invisible anchors',()=>{
 const doc=make('referral','en'),s=sessionOf(doc);s.language='th';walk(doc,node=>{const mark=node.marks?.find(mark=>mark.type==='templateText');if(node.type==='text'&&mark)node.text=templateProse(node.text,mark.attrs,s)||'\u200B';});s.language='en';const english=output(doc);
 assert.match(english,/To: To Whom It May Concern/);assert.match(english,/\(Medical Licence Number: ว.12345\), am writing/);assert.doesNotMatch(english,/\u200B/);
 const attrs={th:'',en:')'};assert.equal(templateProse('\u200B',attrs,s),')');s.language='th';assert.equal(templateProse(')',attrs,s),'');
});
test('referral grouping keeps requests and enclosures in the intended order',()=>{
 const doc=make('referral','en',{'history.other':'Recorded past history'},['hiv','hbv','otherHistory','admission','financial','lab','attachments']);
 const text=output(doc);
 for(const [before,after]of [['Retroviral Infection','HBV Co-Infection'],['HBV Co-Infection','We would be grateful'],['We would be grateful','Please contact Public Health Center'],['Please contact Public Health Center','Enclosures'],['Enclosures','Yours faithfully']])assert.ok(text.indexOf(before)<text.indexOf(after),`${before} before ${after}`);
 assert.equal(section(doc,'hbv').attrs.diagnosis,true);assert.equal(referralPoint('hbv'),'clinical');assert.equal(referralPoint('attachments'),'enclosures');
 const empty=output(make());assert.doesNotMatch(empty,/Co-Infections and Past Medical History|Additional Notes and Requests/);assert.match(empty,/EnclosuresLatest laboratory results/);
});
test('other-medication quantities use an entered unit and omit it cleanly when unspecified',()=>{
 for(const [quantity,unit,expected]of [['28','tablet','28 tablets'],['1','capsule','1 capsule'],['2','bottle','2 bottles'],['28','','28']]){
  const doc=make('referral','en',{'otherMed.one.name':'Fluconazole','otherMed.one.quantity':quantity,'otherMed.one.unit':unit},['otherMedications']);section(doc,'otherMedications').content.push(medicationRow('otherMed','one','en'));
  assert.match(output(doc),new RegExp(`\\(Quantity: ${expected}\\)`));assert.deepEqual(validateDocument(doc),[]);if(!unit)assert.doesNotMatch(output(doc),/tablets|bottles|capsules|units/);
 }
});
test('the original full BPG regimen label still normalises to its unchanged canonical option',()=>{
 assert.equal(normalise('syphilis.regimen','Benzathine penicillin G 2.4 million units IM','en'),'Benzathine');
 assert.equal(normalise('syphilis.regimen','Benzathine penicillin G (BPG) 2.4 million units IM','en'),'Benzathine');
});
test('the summary insertion point accepts exactly the eleven original diagnoses and histories',()=>{
 const doc=createDocument('referral','en');let point;walk(doc,n=>{if(n.type==='insertionPoint'&&n.attrs.id==='clinical')point=n;});
 assert.deepEqual(point.attrs.allowed,Object.values(SECTIONS).filter(s=>s.disease).map(s=>s.id));assert.deepEqual(point.attrs.allowed,REFERRAL_POINTS.clinical);
 for(const id of point.attrs.allowed)assert.equal(referralPoint(id),'clinical');
 for(const id of ['art','oi','pickup','cd4','viralLoad','identification'])assert.equal(referralPoint(id),'details');
});
test('diagnoses, clinical facts and injection dates export at their own bullet depths',()=>{
 const doc=make('referral','th',{'syphilis.start':'10/10/2026','hiv.initialCD4':'325'},['hiv','syphilis','hbv']);
 for(const id of ['hiv','syphilis','hbv']){
  const block=section(doc,id);assert.equal(block.content[0].type,'bulletList');assert.equal(block.content[0].content[0].type,'listItem');
  assert.equal(block.content[0].content[0].content[0].type,'paragraph');assert.ok(block.content[0].content[0].content[0].content[0].marks.some(m=>m.type==='bold'));
  let headings=0;walk(block,n=>{if(n.type==='heading')headings++;});assert.equal(headings,0);
 }
 const levels=[];const visit=(items,depth=0)=>{for(const item of items){if(item.ul)for(const child of item.ul)visit(child.stack||[],depth+1);if(item.stack)visit(item.stack,depth);if(item.text?.map?.(r=>r.text).join('').includes('กำหนดฉีด Benzathine penicillin G'))levels.push(depth);}};
 visit(toPdf(doc));assert.deepEqual(levels,[3,3,3]);assert.doesNotMatch(output(doc),/\bBPG\b|ฉีดยาแล้ว|administered/);
 assert.match(output(doc),/เข็มที่ 1 10\/10\/2569/);assert.match(output(doc),/เข็มที่ 2 17\/10\/2569/);assert.match(output(doc),/เข็มที่ 3 24\/10\/2569/);
});
test('inserted HIV and active syphilis start with the requested editable defaults',()=>{
 const doc=make('referral','en',{},['hiv','syphilis']),s=sessionOf(doc),date=parseClinicalDate(today()).iso;
 assert.equal(valueOf(s,'pickup.date'),date);assert.equal(valueOf(s,'pickup.days'),'60');assert.equal(s.values['pickup.days'].status,'default');
 assert.equal(valueOf(s,'syphilis.start'),date);assert.equal(valueOf(s,'syphilis.regimen'),'Benzathine');assert.equal(valueOf(s,'syphilis.dose2'),addCalendarDays(date,7));
 assert.ok(visibleFields(doc).includes('pickup.date'));assert.ok(visibleFields(doc).includes('pickup.days'));assert.ok(visibleFields(doc).includes('syphilis.dose3'));
 assert.ok(section(doc,'hiv').content[0].content[0].content.some(n=>n.type==='clinicalSection'&&n.attrs.id==='pickup'));
 const existing=make('referral','en',{'pickup.date':'09/10/2026','pickup.days':'30','syphilis.start':'06/06/2026','syphilis.regimen':'Doxycycline2Weeks'},['hiv','syphilis']);
 assert.equal(valueOf(sessionOf(existing),'pickup.days'),'30');assert.equal(valueOf(sessionOf(existing),'syphilis.regimen'),'Doxycycline2Weeks');assert.doesNotMatch(output(existing),/Injection schedule/);
});
test('custom purpose is inline, required only when selected, and omitted purposes yield a complete summary introduction',()=>{
 let doc=make('referral','en',{'referral.purposes':['custom']});assert.ok(validateDocument(doc).some(e=>e.id==='referral.customPurpose'));
 doc=make('referral','en',{'referral.purposes':['custom'],'referral.customPurpose':'cardiology review'});assert.match(output(doc),/for cardiology review\. Details/);assert.deepEqual(validateDocument(doc),[]);
 assert.doesNotMatch(output(doc),/Other purpose|Additional details|Purpose of Referral/);
 sessionOf(doc).omitted.push('referral.purposes','referral.customPurpose');assert.match(output(doc),/provide the following medical summary to support continuity of care\./);assert.doesNotMatch(output(doc),/for \.| and \./);
});
test('redundant notes are absent from every offered block but their canonical values remain compatible',()=>{
 assert.equal(INSERT_BLOCKS.notes,undefined);
 for(const block of Object.values(INSERT_BLOCKS))walk(buildBlock(block.id,'en',block.documents[0]),n=>{if(n.type==='field')assert.doesNotMatch(n.attrs.id,/notes$/i);});
 const doc=make('referral','en',{'hiv.notes':'Retained old note','syphilis.notes':'Retained treatment note','document.notes':'Retained letter note'},['hiv','syphilis']);
 assert.doesNotMatch(output(doc),/Retained|Clinical notes|Additional Notes/);assert.equal(valueOf(sessionOf(doc),'hiv.notes'),'Retained old note');
});
test('multiple-choice values discard empty selections without losing supported or invalid entered values',()=>{
 assert.deepEqual(normalise('tb.sites',['','ปอด','Other','Other'],'th'),['Pulmonary','Other']);
 assert.deepEqual(normalise('mpox.symptoms',['','feverChills','headache'],'en'),['feverChills','headache']);
 for(const empty of ['',[],['',' '],' ; '])assert.deepEqual(normalise('mpox.symptoms',empty,'en'),[]);
 const doc=make('referral','th',{'mpox.days':'4','mpox.symptoms':normalise('mpox.symptoms',['','feverChills','headache'],'th'),'mpox.risks':normalise('mpox.risks',['','noneKnown'],'th'),'tb.sites':normalise('tb.sites',['','Pulmonary'],'th')},['mpox','tbHistory']),s=sessionOf(doc);
 assert.deepEqual(validateDocument(doc),[]);assert.equal(displayValue(s,'tb.sites'),'ปอด');assert.equal(displayValue(s,'mpox.symptoms'),'ไข้หรือหนาวสั่น และ ปวดศีรษะ');
 s.values['tb.sites'].value=['','Pulmonary'];assert.equal(displayValue(s,'tb.sites'),'ปอด');
 const invalid=normalise('tb.sites',['','Unrecognised site'],'en');assert.deepEqual(invalid,['Unrecognised site']);assert.equal(fieldError('tb.sites',invalid,s),'Choose a supported option');
});
test('mpox and TB Other details are validated only when selected, and cleared selections validate correctly',()=>{
 const doc=make('referral','en',{'mpox.days':'4','mpox.symptoms':['other'],'mpox.risks':['other'],'tb.sites':['Other']},['mpox','tbHistory']),s=sessionOf(doc);
 for(const id of ['mpox.symptomOther','mpox.riskOther','tb.siteOther'])assert.ok(validateDocument(doc).some(e=>e.id===id));
 for(const id of ['mpox.symptomOther','mpox.riskOther','tb.siteOther'])s.values[id]={value:'Fictional detail',status:'manual'};assert.deepEqual(validateDocument(doc),[]);
 s.values['mpox.symptoms'].value=[];s.values['mpox.risks'].value=[];s.values['tb.sites'].value=[];const errors=validateDocument(doc);
 assert.ok(errors.some(e=>e.id==='mpox.symptoms'));assert.ok(errors.some(e=>e.id==='mpox.risks'));assert.ok(!errors.some(e=>e.id==='tb.sites'||e.id==='tb.siteOther'));
 s.values['mpox.days'].value='';assert.equal(validateDocument(doc).filter(e=>e.id==='mpox.days').length,1);
});
test('template insertion points match the simplified document controls',()=>{
 const points=template=>{const out=[];walk(createDocument(template,'en'),n=>{if(n.type==='insertionPoint')out.push(n);});return out;};
 const referral=points('referral');assert.deepEqual(referral.map(n=>n.attrs.id),['clinical','closing','enclosures']);assert.deepEqual(referral.find(n=>n.attrs.id==='closing').attrs.allowed,['admission','financial']);
 const medical=points('medical').find(n=>n.attrs.id==='clinical');assert.deepEqual(medical.attrs.allowed,['examination','leave','syphilisTreatment','tbTreatment']);
 assert.deepEqual(points('medication').map(n=>n.attrs.id),['medicine:travelMedications']);assert.deepEqual(points('freeform'),[]);
 assert.deepEqual(SECTIONS.oi.labels,['TMX/SMP 80/400 mg','TMX/SMP 80/400 mg']);
});
for(const language of ['th','en'])test(`latest laboratory results is an editable, omittable default field: ${language}`,()=>{
 const doc=make('referral',language),s=sessionOf(doc),expected=language==='th'?'ผลตรวจทางห้องปฏิบัติการล่าสุด':'Latest laboratory results';
 assert.equal(valueOf(s,'attachments.lab'),expected);assert.ok(visibleFields(doc).includes('attachments.lab'));assert.deepEqual(FIELDS['attachments.lab'].sections,['lab']);
 s.values['attachments.lab']={value:'Clinician-entered laboratory enclosure',status:'manual'};assert.match(output(doc),/Clinician-entered laboratory enclosure/);
 s.omitted.push('attachments.lab');assert.doesNotMatch(output(doc),/Clinician-entered laboratory enclosure|Enclosures|เอกสารแนบ/);assert.equal(valueOf(s,'attachments.lab'),'Clinician-entered laboratory enclosure');
});
test('doxycycline duration is retained in calculations without a duplicate printed line',()=>{
 for(const [regimen,days]of [['Doxycycline2Weeks','14'],['Doxycycline28Days','28']])for(const language of ['th','en']){
  const doc=make('referral',language,{'syphilis.regimen':regimen},['syphilis']);assert.equal(valueOf(sessionOf(doc),'syphilis.duration'),days);
  assert.match(output(doc),new RegExp(`for ${days} days`));assert.doesNotMatch(output(doc),/กำหนดระยะเวลาการรักษา|planned treatment duration/);assert.ok(!visibleFields(doc).includes('syphilis.duration'));
 }
});
test('bullet spacing is compact while explicit paragraph spacing and signing space are preserved',()=>{
 const doc=make('referral','en',{'hiv.napId':'1234567890'},['hiv']);let first;walk(doc,n=>{if(n.type==='paragraph'&&n.content?.some(c=>c.type==='text'&&c.text==='Retroviral Infection'))first=n;});assert.ok(first);
 let pdf=toPdf(doc);const collect=(items,out=[])=>{for(const item of items){if(item.text?.some?.(r=>r.text==='Retroviral Infection'))out.push(item);if(item.ul)for(const row of item.ul)collect(row.stack,out);if(item.stack)collect(item.stack,out);}return out;};
 assert.equal(collect(pdf)[0].margin[3],2);assert.equal(pdf.find(n=>n.ul).margin[3],2);
 first.attrs={...first.attrs,spacingAfter:12};pdf=toPdf(doc);assert.equal(collect(pdf)[0].margin[3],12);
 const signature=pdf.find(n=>n.unbreakable);assert.ok(signature.stack.some(n=>n.margin?.[3]===44));
});
