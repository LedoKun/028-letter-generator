import { definition, label } from './fields.mjs';
import { parseClinicalDate, displayDate, calculateAge, addCalendarDays, inclusiveDays, exactDate } from './dates.mjs';
export const sessionOf = doc => doc.content?.[0]?.attrs || doc.firstChild?.attrs;
export function walk(node,fn) { fn(node);for(const child of node.content||[])walk(child,fn); }
export const valueOf = (session,id) => session.values[id]?.value ?? '';
export function newId(){
 const crypto=globalThis.crypto;
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 return Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function conditionActive(condition,session) {
 if(!condition)return true;
 const [op,id,expected]=condition,v=valueOf(session,id);
 if(op==='equals')return v===expected;
 if(op==='notEquals')return v!==expected;
 if(op==='oneOf')return expected.includes(v);
 if(op==='contains')return Array.isArray(v)&&v.includes(expected);
 if(op==='notContains')return !Array.isArray(v)||!v.includes(expected);
 if(op==='fieldEmpty')return !v||Array.isArray(v)&&!v.length||session.omitted.includes(id)||session.availableFields&&!session.availableFields.includes(id)&&!session.converted?.includes(id);
 if(op==='referralChoices'){const purposes=valueOf(session,'referral.purposes');return !conditionActive(['fieldEmpty','referral.purposes'],session)&&(Array.isArray(purposes)?purposes.some(purpose=>purpose!=='custom'):!!purposes);}
 if(op==='customReferral')return valueOf(session,'referral.purposes').includes('custom')||!!valueOf(session,'referral.customPurpose');
 if(op==='empty')return !v||Array.isArray(v)&&!v.length;
 if(op==='notEmpty')return !!(Array.isArray(v)?v.length:v);
 if(op==='percentOnly')return !session.converted?.includes('hiv.initialCD4')&&(!valueOf(session,'hiv.initialCD4')||session.omitted.includes('hiv.initialCD4')||session.availableFields&&!session.availableFields.includes('hiv.initialCD4'))&&!!valueOf(session,'hiv.initialCD4Percent');
 if(op==='hasClinical')return session.activeSections?.some(section=>['hiv','syphilis','mpox','hbv','hcvActive','syphilisHistory','hcvHistory','tbHistory','tptCompleted','tptOngoing'].includes(section)||section==='otherHistory'&&!!valueOf(session,'history.other')&&!session.omitted.includes('history.other')&&(!session.availableFields||session.availableFields.includes('history.other')||session.converted?.includes('history.other')))||false;
 if(op==='treatmentHistory')return session.template==='medical'&&session.activeSections?.some(id=>['syphilisTreatment','tbTreatment'].includes(id))&&!session.activeSections.some(id=>['examination','attendance','leave'].includes(id));
 if(op==='documentedExamination')return session.activeSections?.includes('examination')&&!session.omitted.includes('examination.date')&&!!exactDate(valueOf(session,'examination.date'));
 if(op==='oneOfSections')return session.activeSections?.some(section=>id.includes(section))||false;
 return false;
}
export function normalise(id,value,language) {
 const def=definition(id);const raw=String(value??'').trim();if(!def)return raw;if(!raw)return def.type==='multi'?[]:raw;
 if(['date','partialDate','monthYear'].includes(def.type))return parseClinicalDate(raw)?.iso||raw;
 if(def.type==='time')return Common.formatTimeInputValue(raw,true);
 if(def.type==='percent')return raw.replace(/\s*%$/,'');
 if(def.type==='nationalId') {const digits=raw.replace(/[-\s]/g,'');return /^\d{13}$/.test(digits)?`${digits[0]}-${digits.slice(1,5)}-${digits.slice(5,10)}-${digits.slice(10,12)}-${digits[12]}`:raw;}
 if(def.type==='napId'){const digits=raw.replace(/^D4[-\s]*/i,'').replace(/[-\s]/g,'');return /^\d{5,20}$/.test(digits)?`${digits.slice(0,4)}-${digits.slice(4)}`:raw;}
 if(def.options) {
  const values=(Array.isArray(value)?value:raw.split(/\s*;\s*/)).map(part=>{part=String(part).trim();return def.options.find(o=>o.value.toLowerCase()===part.toLowerCase()||o.labels.some(l=>l.toLowerCase()===(id==='syphilis.regimen'?part.replace(/\s*\(BPG\)/i,''):part).toLowerCase()))?.value||part;});
  return def.type==='multi'?[...new Set(values.filter(Boolean))]:values[0];
 }
 return def.uppercase?raw.toUpperCase():raw;
}
export function displayValue(session,id) {
 const def=definition(id),v=valueOf(session,id);if(!def)return '';
 if(['date','partialDate','monthYear'].includes(def.type))return displayDate(v,session.language);
 if(def.options){const render=k=>{const text=label(def.options.find(o=>o.value===k)?.labels||[String(k),String(k)],session.language);return /^otherMed\.[^.]+\.unit$/.test(id)&&session.language==='en'&&Number(valueOf(session,id.replace(/unit$/,'quantity')))===1?text.replace(/s$/,''):text;};if(!Array.isArray(v))return render(v);const choices=v.filter(k=>String(k).trim()&&(id!=='referral.purposes'||k!=='custom')).map(render);return choices.length<2?choices.join(''):choices.slice(0,-1).join(', ')+(session.language==='th'?' และ ':choices.length===2?' and ':', and ')+choices.at(-1);}
 return String(v);
}
export function recalculate(session,force='') {
 const values={...session.values},set=(id,value)=>{if(force===id||force==='bpg'&&(id.startsWith('syphilis.dose')||id==='syphilis.duration')||values[id]?.status!=='override')values[id]={value:value===null?'':String(value),status:'calculated'};};
 const age=calculateAge(valueOf(session,'patient.dob'),(session.activeSections?.some(id=>['examination','attendance'].includes(id))?valueOf(session,'examination.date'):'')||valueOf(session,'document.date'));
 if(age!==null || values['patient.age']?.status==='calculated' || force==='patient.age')set('patient.age',age);
 if(valueOf(session,'syphilis.regimen')==='Benzathine')for(const n of [1,2,3])set(`syphilis.dose${n}`,addCalendarDays(valueOf(session,'syphilis.start'),(n-1)*7));
 const regimen=valueOf(session,'syphilis.regimen');if(regimen.startsWith?.('Doxycycline'))set('syphilis.duration',regimen==='Doxycycline2Weeks'?14:28);
 set('leave.days',inclusiveDays(valueOf(session,'leave.start'),valueOf(session,'leave.end')));
 return {...session,values};
}
export function fieldError(id,value,session) {
 const def=definition(id);if(!def)return 'Unsupported field';
 if(!value||Array.isArray(value)&&!value.length)return '';
 const raw=String(value);
 if(['date','partialDate','monthYear'].includes(def.type)) {
  const d=parseClinicalDate(raw);if(!d)return 'Invalid date';
  if(def.type==='date'&&d.precision!=='day'&&id!=='patient.dob')return 'Enter a complete date (DD/MM/YYYY)';
  if(id==='patient.dob'&&session.template==='medication'&&d.precision!=='day')return 'Enter a complete date of birth (DD/MM/YYYY)';
  if(def.type==='monthYear'&&d.precision!=='month')return 'Enter a month and year (MM/YYYY)';
  const reference=(session.activeSections?.some(id=>['examination','attendance'].includes(id))?valueOf(session,'examination.date'):'')||valueOf(session,'document.date');
  if(id==='patient.dob'&&d.precision==='day'&&exactDate(reference)&&calculateAge(raw,reference)===null)return 'Date of birth must not be in the future';
 }
 if(id==='leave.end'&&exactDate(valueOf(session,'leave.start'))&&exactDate(raw)&&inclusiveDays(valueOf(session,'leave.start'),raw)===null)return 'Leave end date must be on or after the start date';
 if(def.type==='time'&&!Common.parseTime24(raw))return 'Enter a valid 24-hour time';
 if(def.type==='integer'&&!/^\d+$/.test(raw))return 'Enter a whole number, zero or greater';
 if(!def.legacyText&&['number','percent'].includes(def.type)&&(!/^\d+(\.\d+)?%?$/.test(raw)||Number(raw.replace('%',''))<0))return 'Enter a non-negative number';
 if(!def.legacyText&&def.type==='percent'&&Number(raw.replace('%',''))>100)return 'Percentage must not exceed 100';
 if(id==='patient.age'&&Number(raw)>150)return 'Review this age';
 if(def.type==='nationalId'&&!/^\d{13}$/.test(raw.replace(/[-\s]/g,'')))return 'National ID must contain 13 digits';
 if(def.type==='napId'&&!/^\d{5,20}$/.test(raw.replace(/-/g,'')))return 'NAP-ID must contain 5–20 digits';
 if(def.options) {
  const choices=Array.isArray(value)?value:[value];if(choices.some(v=>!def.options.some(o=>o.value===v||o.labels.includes(v))))return 'Choose a supported option';
 }
 return '';
}
export function visibleFields(doc,session=sessionOf(doc)) {
 const fields=[];
 const visit=(node,active=true)=>{
  active=active&&conditionActive(node.attrs?.condition,session)&&!(node.attrs?.guard||[]).some(id=>session.omitted.includes(id));
  if(!active)return;
  if(node.type==='field'&&!session.omitted.includes(node.attrs.id))fields.push(node.attrs.id);
  for(const child of node.content||[])visit(child,active);
 };
 visit(doc);return fields;
}
export function fieldRequirements(doc,session=sessionOf(doc)) {
 const active=new Set(visibleFields(doc,session)),sections=new Set();
 walk(doc,n=>{if(n.type==='clinicalSection')sections.add(n.attrs.id);});
 const required=new Set(['document.date']);
 if(session.template!=='freeform')for(const id of ['patient.name',session.language==='th'?'doctor.th':'doctor.en',...(session.template!=='referral'?['doctor.license']:[])])required.add(id);
 else required.add('document.title');
 const need=id=>required.add(id);
 if(sections.has('syphilis')){need('syphilis.start');need('syphilis.regimen');if(valueOf(session,'syphilis.regimen')==='Benzathine')for(const n of [1,2,3])need(`syphilis.dose${n}`);}
 if(sections.has('mpox')) {
  for(const id of ['mpox.days','mpox.symptoms','mpox.risks'])need(id);
  for(const [id,other] of [['mpox.symptoms','mpox.symptomOther'],['mpox.risks','mpox.riskOther']])if(valueOf(session,id).includes('other'))need(other);
 }
 if(sections.has('leave')) {
  need('leave.start');need('leave.end');
 }
 for(const [section,id] of [['examination','examination.date'],['attendance','examination.date'],['syphilisTreatment','treatment.syphilisDate'],['tbTreatment','treatment.tbDate']])if(sections.has(section))need(id);
 if(sections.has('hiv')&&sections.has('pickup')&&active.has('pickup.date'))need('pickup.date');
 walk(doc,node=>{if(node.type==='medicationRow'){const name=`${node.attrs.kind}.${node.attrs.id}.name`;need(name);if(node.attrs.kind==='travel'&&valueOf(session,name)==='OTHER')need(`travel.${node.attrs.id}.other`);}});
 for(const id of active) {
  if(id.endsWith('.name')&&/^(art|otherMed|travel)\./.test(id))need(id);
  if(id.endsWith('.other')&&id.startsWith('travel.')&&valueOf(session,id.replace(/other$/,'name'))==='OTHER')need(id);
  if(id.endsWith('.other')&&id.startsWith('tpt.')&&active.has(id))need(id);
 }
 if(valueOf(session,'patient.salutation')==='OTHER'&&active.has('patient.salutationOther'))need('patient.salutationOther');
 if(valueOf(session,'patient.nationality')==='OTHER'&&active.has('patient.nationalityOther'))need('patient.nationalityOther');
 if(valueOf(session,'referral.purposes').includes('custom')&&active.has('referral.purposes'))need('referral.customPurpose');
 if(active.has('tb.siteOther'))need('tb.siteOther');
 if(session.template==='medication'){
  need('patient.dob');
 }
 return {active,sections,required};
}
export function validateDocument(doc) {
 const session=sessionOf(doc),errors=[],{active,sections,required}=fieldRequirements(doc,session);
 const add=(id,message)=>errors.push({id,message,label:label(definition(id)?.labels||[id,id],'en')});
 if(sections.has('mpox')){
  if(valueOf(session,'mpox.days')!==''&&Number(valueOf(session,'mpox.days'))<=0)add('mpox.days','Enter a symptom duration greater than zero');
  const risks=valueOf(session,'mpox.risks');if(Array.isArray(risks)&&risks.includes('noneKnown')&&risks.length>1)add('mpox.risks','No known risk cannot be combined with other risk factors');
 }
 if(sections.has('leave')&&valueOf(session,'leave.start')&&valueOf(session,'leave.end')&&inclusiveDays(valueOf(session,'leave.start'),valueOf(session,'leave.end'))===null)add('leave.end','Leave end date must be on or after the start date');
 if(session.template==='medication'&&![...active].some(id=>/^travel\.[^.]+\.name$/.test(id)&&valueOf(session,id)))add('travel.name','At least one named medication is required for a travel certificate');
 for(const id of new Set([...active,...required])) {
  const v=valueOf(session,id);
  if(required.has(id)&&(!v||Array.isArray(v)&&!v.length||session.omitted.includes(id)||!active.has(id)&&!session.converted?.includes(id)))add(id,'Required information is missing');
  else {const error=fieldError(id,v,session);if(error)add(id,error);}
 }
 if(session.template==='freeform') {
  const meaningful=node=>{
   if(node.type==='insertionPoint'||node.attrs?.hidden||!conditionActive(node.attrs?.condition,session)||!conditionActive(node.attrs?.printCondition,session)||(node.attrs?.guard||[]).some(id=>session.omitted.includes(id)||!valueOf(session,id)))return false;
   if(node.type==='picture')return !!node.attrs.src;
   if(node.type==='text')return !!node.text.replace(/\u200B/g,'').trim();
   if(node.type==='field')return !!String(displayValue(session,node.attrs.id)).trim();
   return (node.content||[]).some(meaningful);
  };
  let body=false;walk(doc,node=>{if(node.type==='bodyText'&&meaningful(node))body=true;});if(!body)add('document.body','Enter the letter body');
 }
 return errors;
}
export function hydrate(doc) {
 const out=structuredClone(doc),session=sessionOf(out);
 const clean=node=>{
  if(node.type==='field') {
   node.attrs={occurrence:newId(),...node.attrs};
   const text=displayValue(session,node.attrs.id),current=(node.content||[]).map(n=>n.type==='hardBreak'?'\n':n.text||'').join('').replace(/\u200B/g,'');
   if(!node.content?.length||current!==text){const marks=node.content?.[0]?.marks;node.content=(text||'\u200B').split('\n').flatMap((line,i)=>[...(i?[{type:'hardBreak'}]:[]),...(line?[{type:'text',text:line,...(marks?{marks}:{})}]:[])]);}
  } else if(node.content)node.content=node.content.filter(n=>n&&!(n.type==='text'&&!n.text)).map(clean);
  return node;
 };
 return clean(out);
}

export function templateProse(text,attrs,session) {
 const options=[attrs.th,attrs.en,attrs.summaryTh,attrs.summaryEn,attrs.historyTh,attrs.historyEn,attrs.examTh,attrs.withoutTitleEn,attrs.partialTh,attrs.partialEn,attrs.singularEn];
 if(!options.includes(text)&&text!=='\u200B')return text;
 if(attrs.doctorId&&session.language==='en'&&/^(dr\.?|doctor|prof\.?|professor)\s/i.test(valueOf(session,attrs.doctorId)))return attrs.withoutTitleEn;
 if(attrs.examTh&&session.language==='th'&&conditionActive(['documentedExamination'],session))return attrs.examTh;
 if(attrs.historyEn&&conditionActive(['treatmentHistory'],session))return attrs[session.language==='th'?'historyTh':'historyEn'];
 if(attrs.countId&&session.language==='en'&&Number(valueOf(session,attrs.countId))===1)return attrs.singularEn;
 const date=attrs.dateId&&parseClinicalDate(valueOf(session,attrs.dateId));
 if(date&&date.precision!=='day')return attrs[session.language==='th'?'partialTh':'partialEn']||attrs[session.language];
 const summary=typeof attrs.summaryEn==='string'&&conditionActive(['fieldEmpty','referral.purposes'],session)&&conditionActive(['fieldEmpty','referral.customPurpose'],session);
 return attrs[summary?(session.language==='th'?'summaryTh':'summaryEn'):session.language];
}

export function formatFieldInput(id,raw) {
 const type=definition(id)?.type,text=String(raw).replace(/\u200B/g,'');
 if((type==='date'||type==='partialDate')&&(/^\d{5,8}$/.test(text)||/^\d{0,2}\/\d{0,2}\/\d{0,4}$/.test(text)))return Common.formatDateInputValue(text);
 if(type==='monthYear'&&/^\d{1,2}\/?\d{0,4}$/.test(text)&&text.replace(/\D/g,'').length>=3)return Common.formatMonthYearInputValue(text);
 if((type==='nationalId'||type==='napId')&&/^[\d -]*$/.test(text)) {
  const digits=text.replace(/\D/g,'');
  if(type==='napId')return digits.length>4&&digits.length<=20?digits.slice(0,4)+'-'+digits.slice(4):text;
  if(digits.length>13)return text;
  const parts=[digits.slice(0,1),digits.slice(1,5),digits.slice(5,10),digits.slice(10,12),digits.slice(12,13)];return parts.filter(Boolean).join('-');
 }
 return text;
}
export function inputFitsField(id,value){
 const def=definition(id),text=String(value).replace(/\u200B/g,'');
 return !def?.maxLength||text.length<=def.maxLength&&text.replace(/\D/g,'').length<=def.maxDigits;
}
