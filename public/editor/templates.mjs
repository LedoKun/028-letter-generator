import { TEMPLATE_NAMES, label } from './fields.mjs';
import { today, parseClinicalDate } from './dates.mjs';
export const FINANCIAL = [
 'ทั้งนี้ หากเห็นสมควร ขอความอนุเคราะห์ทีมของท่านพิจารณาแนวทางให้ความช่วยเหลือด้านค่าใช้จ่ายในการรักษาหรือด้านสังคมสงเคราะห์ที่เหมาะสมสำหรับผู้ป่วยเพิ่มเติมด้วย',
 'Where appropriate, we also kindly request that your team consider any available financial assistance or social welfare support for this patient.'
];
export const REFERRAL_POINTS={clinical:['hiv','syphilis','mpox','hbv','hcvActive','syphilisHistory','hcvHistory','tbHistory','tptCompleted','tptOngoing','otherHistory'],medications:['otherMedications'],closing:['admission','financial','physician'],enclosures:['lab','attachments']};
export const referralPoint=id=>Object.entries(REFERRAL_POINTS).find(([,ids])=>ids.includes(id))?.[0]||'details';
export function sectionDefaults(id,language='th'){
 const date=parseClinicalDate(today()).iso;
 return id==='hiv'||id==='pickup'?{'pickup.date':date,'pickup.days':'60'}:id==='syphilis'?{'syphilis.start':date,'syphilis.regimen':'Benzathine'}:id==='examination'?{'examination.date':date}:id==='lab'?{'attachments.lab':label(['ผลตรวจทางห้องปฏิบัติการล่าสุด','Latest laboratory results'],language)}:{};
}
export function writer(language) {
 const T=(th,en)=>({type:'text',text:label([th,en],language)||'\u200B',marks:[{type:'templateText',attrs:{th,en}}]});
 const R=(th,en,summaryTh,summaryEn)=>({...T(th,en),marks:[{type:'templateText',attrs:{th,en,summaryTh,summaryEn}}]});
 const M=(th,en,historyTh,historyEn,examTh=null)=>({...T(th,en),marks:[{type:'templateText',attrs:{th,en,historyTh,historyEn,examTh}}]});
 const D=(id,th,en,partialTh,partialEn)=>({...T(th,en),marks:[{type:'templateText',attrs:{th,en,dateId:id,partialTh,partialEn}}]});
 const Q=(id,th,singularEn,en)=>({...T(th,en),marks:[{type:'templateText',attrs:{th,en,countId:id,singularEn}}]});
 const B=(th,en)=>{const node=T(th,en);node.marks.push({type:'bold'});return node;};
 const F=id=>({type:'field',attrs:{id},content:[]});
 const P=(content,attrs={})=>({type:'paragraph',attrs,content:content.filter(Boolean)});
 const G=(id,content,condition=null,printCondition=null)=>({type:'phrase',attrs:{guard:[id],condition,printCondition},content});
 const line=(id,th,en,suffixTh='',suffixEn='',condition=null,printCondition=null)=>P([G(id,[B(th,en),F(id),...(suffixTh||suffixEn?[T(suffixTh,suffixEn)]:[])],condition,printCondition)]);
 const dateLine=(id,th,en,partialTh,partialEn)=>{const prefix=D(id,th,en,partialTh,partialEn);prefix.marks.push({type:'bold'});return P([G(id,[prefix,F(id),T('','.')])]);};
 const H=(th,en)=>({type:'heading',attrs:{level:2,spacingBefore:8},content:[T(th,en)]});
 return {T,R,M,D,Q,B,F,P,G,line,dateLine,H};
}
export const insertionPoint=(id,hint,kind='blocks',section=null,allowed=null)=>({type:'insertionPoint',attrs:{id,hint,kind,section,allowed}});
function bullets(content,type='bulletList'){
 const output=[];let list;
 for(const node of content){
  if(node.type==='paragraph'){
   if(!list){list={type,content:[]};output.push(list);}
   const phrase=node.content?.length===1&&node.content[0].type==='phrase'?node.content[0]:null;
   list.content.push({type:'listItem',attrs:{condition:node.attrs?.condition||phrase?.attrs.condition||null,guard:node.attrs?.guard||phrase?.attrs.guard||[]},content:[node]});
  }else{output.push(node);list=null;}
 }
 return output;
}
const names={
 hiv:['Retroviral Infection','Retroviral Infection'],syphilis:['Active Syphilis','Active Syphilis'],mpox:['Suspected Mpox','Suspected Mpox'],
 hbv:['HBV Co-Infection','HBV Co-Infection'],hcvActive:['HCV Co-Infection','HCV Co-Infection'],syphilisHistory:['Treated Syphilis','Treated Syphilis'],
 hcvHistory:['Treated HCV','Treated HCV'],tbHistory:['Treated TB','Treated tuberculosis (TB)'],tptCompleted:['Completed TPT','Completed tuberculosis preventive treatment (TPT)'],tptOngoing:['Ongoing TPT','Ongoing tuberculosis preventive treatment (TPT)'],
 otherHistory:['Other Medical History','Other Medical History'],art:['สูตรยา ART ปัจจุบัน','Current ART regimen'],oi:['TMX/SMP 80/400 mg','TMX/SMP 80/400 mg'],
 pickup:['การรับยาครั้งล่าสุดและจำนวนวันที่ยาครอบคลุม','Last Medication Pick-up / Supply'],otherMedications:['รายการยาอื่น ๆ','Other Medications'],
 admission:['ขอพิจารณารับไว้รักษาในโรงพยาบาล','Hospital Admission Request'],lab:['ผลตรวจทางห้องปฏิบัติการล่าสุด','Latest Laboratory Results'],attachments:['เอกสารแนบอื่น','Other Attachments'],
 financial:['ข้อความขอคำแนะนำด้านความช่วยเหลือค่าใช้จ่าย','Include Financial Assistance Request'],
 examination:['การตรวจวินิจฉัย','Clinical Examination and Diagnosis'],leave:['ความเห็นแพทย์และการหยุดพักรักษาตัว','Fitness for Work / Leave Advised'],
 syphilisTreatment:['ประวัติการรักษาโรคซิฟิลิส','Syphilis Treatment History'],tbTreatment:['ประวัติการรักษาโรควัณโรค','Tuberculosis (TB) Treatment History'],comments:['ความเห็นเพิ่มเติมของแพทย์','Other Comments'],
 travelMedications:['รายการยาสำหรับการเดินทาง','Travel Medications'],attendance:['รับรองการมารับการตรวจรักษา','Attendance Confirmation']
};
const legacy=['includeRetroviral','includeSyphilisActive','includeSuspectedMpox','includeHBV','includeHCVActive','includeTreatedSyphilis','includeTreatedHCV','includeTreatedTB','includeCompletedTPT','includeOngoingTPT','includeOtherHistory'];
export const SECTIONS=Object.fromEntries(Object.entries(names).map(([id,labels],i)=>[id,{
 id,labels,originalIds:i<11?[legacy[i]]:({oi:['includeTmxSmp'],pickup:['includeLastMedicinePickup'],admission:['includeReferralForAdmission'],lab:['attachmentLabResults'],attachments:['attachmentOther'],examination:['includeConsultationDiagnosis'],leave:['includeAdvisedRest'],syphilisTreatment:['includeSyphilisTreatment'],tbTreatment:['includeTBTreatment'],comments:['includeDoctorComment'],travelMedications:['includeMedications']}[id]||[]),
 documents:['examination','leave','syphilisTreatment','tbTreatment','comments','attendance'].includes(id)?['medical']:id==='travelMedications'?['medication']:['financial','admission','attachments','lab'].includes(id)?['referral','freeform']:['referral'],
 disease:i<11,closing:['admission','financial','attachments','lab'].includes(id)
}]));
export function buildSection(id,language){
 const {T,D,Q,B,F,P,G,line,dateLine,H}=writer(language),content=[];
 const heading=()=>content.push(H(...SECTIONS[id].labels));
 if(id==='hiv'){
  content.push(line('hiv.napId','NAP-ID D4-','NAP-ID: D4-'),dateLine('hiv.diagnosed','ได้รับการวินิจฉัยครั้งแรกเมื่อวันที่ ','The diagnosis was first established on ','วินิจฉัยครั้งแรกเมื่อ ','Initial diagnosis recorded in '),dateLine('hiv.artStart','เริ่ม ART เมื่อวันที่ ','ART was initiated on ','เริ่ม ART เมื่อ ','ART commenced in '));
  const measured=()=>D('hiv.initialCD4Date',' ตรวจเมื่อวันที่ ',', measured on ',' ตรวจเมื่อ ',', measured in ');
  content.push(P([G('hiv.initialCD4',[B('ผล CD4 เมื่อมารับบริการครั้งแรก ','CD4 at first visit: '),F('hiv.initialCD4'),T(' cells/mm³',' cells/mm³'),G('hiv.initialCD4Percent',[T(' (',' ('),F('hiv.initialCD4Percent'),T('%)','%)')]),G('hiv.initialCD4Date',[measured(),F('hiv.initialCD4Date')])])]));
  content.push(P([G('hiv.initialCD4Percent',[B('ร้อยละ CD4 เมื่อมารับบริการครั้งแรก ','CD4 percentage at first visit: '),F('hiv.initialCD4Percent'),T('%','%'),G('hiv.initialCD4Date',[measured(),F('hiv.initialCD4Date')])])],{condition:['percentOnly']}));
  content.push(line('hiv.adherence','ART adherence ','The patient reported ART adherence of ','','.'));
  content.push(P([G('hiv.latestVL',[T('ผลตรวจ HIV VL ล่าสุดเท่ากับ ','The latest HIV VL was '),F('hiv.latestVL'),T(' copies/mL',' copies/mL'),G('hiv.latestVLDate',[D('hiv.latestVLDate',' ตรวจเมื่อวันที่ ',', measured on ',' ตรวจเมื่อ ',', measured in '),F('hiv.latestVLDate')]),T('','.')])]));
  content.push(buildSection('art',language),insertionPoint('hiv.optional','Add TMX/SMP 80/400 mg','section','hiv',['oi']),buildSection('pickup',language));
 }else if(id==='syphilis'){
  content.push(dateLine('syphilis.start','เริ่มการรักษาโรคซิฟิลิสเมื่อวันที่ ','Treatment for syphilis commenced on ','เริ่มการรักษาเมื่อ ','Treatment commenced in '),line('syphilis.regimen','ได้รับการรักษาด้วย ','The prescribed treatment regimen is ','','.'));
  const schedule=[1,2,3].map(n=>line(`syphilis.dose${n}`,`กำหนดฉีด Benzathine penicillin G เข็มที่ ${n} `,`Scheduled Benzathine penicillin G dose ${n} on `));
  content.push({type:'bulletList',content:[{type:'listItem',attrs:{condition:['equals','syphilis.regimen','Benzathine']},content:[P([B('กำหนดการฉีดยา','Injection schedule:')]),...bullets(schedule)]}]});
 }else if(id==='mpox'){
  content.push(P([G('mpox.days',[T('ผู้ป่วยเริ่มมีอาการมาแล้ว ','Symptoms began '),F('mpox.days'),Q('mpox.days',' วัน',' day ago.',' days ago.')])]),line('mpox.symptoms','อาการสำคัญ ได้แก่ ','Presenting symptoms include ','','.'),line('mpox.symptomOther','อาการอื่น ๆ ','Other symptoms: ','','',['contains','mpox.symptoms','other']));
  content.push(P([G('mpox.risks',[{type:'phrase',attrs:{condition:['notContains','mpox.risks','noneKnown']},content:[T('ผู้ป่วยให้ประวัติว่า ','The patient reported ')]},F('mpox.risks'),T('','.')])]),line('mpox.riskOther','ประวัติความเสี่ยงอื่น ๆ ','Other risk factors: ','','',['contains','mpox.risks','other']));
 }else if(['hbv','hcvActive','syphilisHistory'].includes(id)){
  // Diagnosis-only entries already have their single outer bullet.
 }else if(id==='hcvHistory'){
  content.push(line('hcv.regimen','เคยได้รับการรักษาด้วยสูตรยา ','The patient was treated with ','','.'),dateLine('hcv.completed','รักษา HCV ครบเมื่อวันที่ ','HCV treatment was completed on ','รักษา HCV ครบเมื่อ ','HCV treatment completed in '));
 }else if(id==='tbHistory'){
  content.push(line('tb.sites','ตำแหน่งของโรค ','Disease site: '),line('tb.siteOther','ตำแหน่งอื่น ','Other site: ','','',['contains','tb.sites','Other']),line('tb.regimen','เคยได้รับการรักษาด้วยสูตรยา ','The patient was treated with ','','.'),dateLine('tb.completed','รักษาวัณโรคครบเมื่อวันที่ ','Tuberculosis treatment was completed on ','รักษาวัณโรคครบเมื่อ ','Tuberculosis treatment completed in '));
 }else if(id==='tptCompleted'||id==='tptOngoing'){
  const prefix=id==='tptCompleted'?'completed':'ongoing';
  content.push(line(`tpt.${prefix}.regimen`,'ผู้ป่วยได้รับ TPT สูตร ','The tuberculosis preventive treatment regimen is ','','.',null,['notEquals',`tpt.${prefix}.regimen`,'Other']),line(`tpt.${prefix}.other`,'ผู้ป่วยได้รับ TPT สูตร ','The tuberculosis preventive treatment regimen is ','','.', ['equals',`tpt.${prefix}.regimen`,'Other']),line(`tpt.${prefix}.start`,'เริ่ม TPT เมื่อเดือน ','Tuberculosis preventive treatment was started in ','','.'));
 }else if(id==='otherHistory'){content.push(P([G('history.other',[B(...SECTIONS[id].labels),T(' ',' '),F('history.other')])]));}
 else if(id==='oi'){content.push(P([G('oi.tablets',[T('ผู้ป่วยได้รับ TMX/SMP 80/400 mg ','The patient receives TMX/SMP 80/400 mg, '),F('oi.tablets'),Q('oi.tablets',' เม็ด วันละ 1 ครั้ง เพื่อป้องกันการติดเชื้อฉวยโอกาส',' tablet once daily for OI prophylaxis.',' tablets once daily for OI prophylaxis.')])]),line('oi.details','การป้องกันอื่น ','Other prophylaxis: '));}
 else if(id==='pickup'){
  content.push(P([G('pickup.date',[T('ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ ','The patient last collected medication on '),F('pickup.date'),G('pickup.days',[T(' โดยมียาเพียงพอสำหรับ ',', with a '),F('pickup.days'),T(' วัน','-day supply')]),T('','.')])]),P([G('pickup.days',[T('ผู้ป่วยได้รับยาเพียงพอสำหรับ ','A '),F('pickup.days'),T(' วัน','-day medication supply was provided.')],['fieldEmpty','pickup.date'])]));
 }else if(['art','otherMedications','travelMedications'].includes(id)){
  if(id==='art')content.push({type:'bulletList',content:[{type:'listItem',content:[P([B(...SECTIONS[id].labels)],{role:'sectionLabel'}),insertionPoint('medicine:'+id,'Add medicine','medicine',id)]}]});
  else {heading();content.push(insertionPoint('medicine:'+id,'Add medicine','medicine',id));}
 }else if(id==='admission'){content.push(P([T('จึงเรียนมาเพื่อโปรดพิจารณารับผู้ป่วยรายนี้เข้ารับการรักษาในโรงพยาบาลของท่าน','We would be grateful if you would consider admitting this patient for further hospital care.')]));}
 else if(id==='financial'){content.push(P([T(...FINANCIAL)]));}
 else if(id==='lab'){content.push(...bullets([P([G('attachments.lab',[F('attachments.lab')])])],language==='th'?'orderedList':'bulletList'));}
 else if(id==='attachments'){content.push(...bullets([P([T('เอกสารอื่น ๆ','Supplementary documentation'),G('attachments.other',[T(' ได้แก่ ',': '),F('attachments.other')])])],language==='th'?'orderedList':'bulletList'));}
 else if(id==='examination'){
  content.push(P([T('ผู้ป่วยรายนี้ได้รับการตรวจรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี เมื่อวันที่ ','The above-named patient was clinically examined at Public Health Center 28 Krung Thon Buri on '),F('examination.date'),T('','.')],{guard:['examination.date']}),line('examination.findings','อาการและผลการตรวจร่างกาย ','Symptoms and examination findings: '),line('examination.diagnosis','การวินิจฉัยโรค ','Diagnosis: '));
 }else if(id==='leave'){
  content.push(P([T('เห็นสมควรให้ผู้ป่วยหยุดพักรักษาตัว ตั้งแต่วันที่ ','The patient has been advised to take medical leave from '),F('leave.start'),T(' ถึง ',' to '),F('leave.end'),T(' รวมเป็นเวลาทั้งสิ้น ',' inclusive, for a total of '),F('leave.days'),Q('leave.days',' วัน',' calendar day.',' calendar days.')],{guard:['leave.start','leave.end','leave.days']}));
 }else if(id==='syphilisTreatment'){content.push(P([G('treatment.syphilisDate',[T('ผู้ป่วยได้รับการรักษาโรคซิฟิลิส เมื่อวันที่ ','The patient was administered treatment for syphilis on '),F('treatment.syphilisDate'),T('','.')])]));}
 else if(id==='tbTreatment'){content.push(P([G('treatment.tbDate',[T('ผู้ป่วยได้รับการรักษาวัณโรคจนครบกำหนดการรักษาเป็นที่เรียบร้อยแล้ว เมื่อวันที่ ','The patient successfully completed a course of treatment for tuberculosis on '),F('treatment.tbDate'),T('','.')])]));}
 else if(id==='comments'){content.push(line('doctor.comments','ความเห็นเพิ่มเติม ','Other comments: '));}
 else if(id==='attendance'){content.push(line('examination.date','ขอรับรองว่าผู้ป่วยมารับการตรวจรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี เมื่อวันที่ ','I confirm that the patient attended Public Health Center 28 Krung Thon Buri for medical assessment on ','','.'));}
 if(['admission','financial','examination','leave','syphilisTreatment','tbTreatment','comments','attendance'].includes(id)&&content[0]?.type==='paragraph')content[0].attrs={...content[0].attrs,spacingBefore:8};
 const disease=SECTIONS[id].disease;
 return {type:'clinicalSection',attrs:{id,diagnosis:disease&&id!=='otherHistory'},content:disease?id==='otherHistory'?bullets(content):[{type:'bulletList',content:[{type:'listItem',content:[P([B(...SECTIONS[id].labels)]),...bullets(content)]}]}]:['oi','pickup'].includes(id)?bullets(content):content.length?content:[P([])]};
}
export function medicationRow(kind,id,language){
 const {F,T,Q,P,G}=writer(language),name=`${kind}.${id}.name`,content=[F(name)];
 if(kind==='art')content.push(G(`${kind}.${id}.tablets`,[T(' ',' '),F(`${kind}.${id}.tablets`),Q(`${kind}.${id}.tablets`,' เม็ด',' tablet',' tablets'),{type:'phrase',attrs:{condition:['fieldEmpty',`${kind}.${id}.time`]},content:[T(' วันละ 1 ครั้ง',' once daily')]}]),G(`${kind}.${id}.time`,[T(' เวลา ',' at '),F(`${kind}.${id}.time`),T(' น.','')]));
 if(kind==='otherMed'){
  for(const[field,th,en]of[['strength',' ',' '],['frequency',' รับประทาน ',' ']])content.push(G(`${kind}.${id}.${field}`,[T(th,en),F(`${kind}.${id}.${field}`)]));
  content.push(G(`${kind}.${id}.quantity`,[T(' จำนวน ',' (Quantity: '),F(`${kind}.${id}.quantity`),G(`${kind}.${id}.unit`,[T(' ',' '),F(`${kind}.${id}.unit`)]),T('',')')]));
 }
 if(kind==='travel')content.push(G(`travel.${id}.other`,[F(`travel.${id}.other`)],['equals',name,'OTHER']));
 return {type:'medicationRow',attrs:{id,kind},content:[P(content)]};
}
export function createDocument(template,language='th',doctor={}){
 const {T,R,M,B,F,P,G,line,H}=writer(language),physician=()=>({...F(language==='th'?'doctor.th':'doctor.en'),attrs:{id:language==='th'?'doctor.th':'doctor.en',languageBound:true}});
 const introduction=()=>({...T('ข้าพเจ้า ','I, Dr '),marks:[{type:'templateText',attrs:{th:'ข้าพเจ้า ',en:'I, Dr ',doctorId:'doctor.en',withoutTitleEn:'I, '}}]});
 const group=(id,content)=>({type:'clinicalGroup',attrs:{id},content});
 const groupHeading=(th,en,ids)=>({...H(th,en),attrs:{level:2,spacingBefore:8,condition:['oneOfSections',ids]}});
 const values={'document.date':{value:parseClinicalDate(today()).iso,status:'default'}};
 for(const[id,value]of Object.entries(doctor))if(id.startsWith('doctor.'))values[id]={value,status:'preference'};
 const body=[P([T('วันที่ ','Date: '),F('document.date')],{textAlign:'right'})];
 if(template==='freeform'){values['document.title']={value:language==='th'?'บันทึกข้อความ':'Medical Notes',status:'default'};body.push({type:'heading',attrs:{level:1,textAlign:'center'},content:[F('document.title')]});}
 else body.push(template==='referral'?{type:'heading',attrs:{level:1,textAlign:'center'},content:[R('หนังสือส่งตัวผู้ป่วย','Medical Referral Letter','หนังสือสรุปประวัติการรักษา','Medical Summary')]}:template==='medical'?{type:'heading',attrs:{level:1,textAlign:'center'},content:[T('ใบรับรองแพทย์','Medical Certificate')]}:{...H(...TEMPLATE_NAMES[template]),attrs:{level:1,textAlign:'center'}});
 body.push(P([],{spacingAfter:8,role:'titleSpace'}));
 values['document.addressee']={value:language==='th'?'เจ้าหน้าที่ผู้เกี่ยวข้อง':template==='referral'?'To Whom It May Concern':'Whom It May Concern',status:'default'};
 if(template!=='medical')body.push(P([G('document.addressee',[B('เรียน ',template==='referral'?'To: ':'To '),F('document.addressee'),T('',template==='referral'?'':':')])]));
 if(template==='referral'){
  values['referral.purposes']={value:['continuedCare'],status:'default'};
  const subject=R('เรื่อง ส่งตัวผู้ป่วยเพื่อรับการตรวจวินิจฉัยและดูแลรักษาต่อ','Re: Patient referral for ongoing clinical assessment and management','เรื่อง สรุปประวัติการรักษา','Re: Medical summary');subject.marks.push({type:'bold'});
  body.push(P([subject],{spacingAfter:8}),P([introduction(),physician(),G('doctor.license',[T(' ใบอนุญาตประกอบวิชาชีพเวชกรรมเลขที่ ',' (Medical Licence Number: '),F('doctor.license'),T('',')')]),R(' ขอส่งตัวผู้ป่วยรายนี้เพื่อ ',', am writing to refer the patient detailed below for ',' ขอส่งสรุปประวัติการรักษาของผู้ป่วยรายนี้เพื่อประกอบการดูแลรักษาต่อ',', provide the following medical summary to support continuity of care'),...referralPurpose(language),R(' โดยมีรายละเอียดดังต่อไปนี้','. Details are provided below.',' โดยมีรายละเอียดดังต่อไปนี้','.') ]));
 }
 if(template==='medical')body.push(P([introduction(),physician(),G('doctor.license',[T(' ใบอนุญาตประกอบวิชาชีพเวชกรรมเลขที่ ',', medical licence number '),F('doctor.license')]),M(' ขอรับรองข้อมูลทางการแพทย์ของผู้ป่วยดังต่อไปนี้',', hereby certify the medical information for the patient detailed below.',' ขอรับรองประวัติการรักษาของผู้ป่วยดังต่อไปนี้',', hereby certify the medical information for the patient detailed below.',' ได้ตรวจร่างกาย')]));
 if(template==='freeform')body.push({type:'bodyText',content:[P([])]});
 else{
  const identity=buildBlock('identification',language,template).content;
  if(template==='referral')body.push(group('details',identity));else body.push(...identity);
  if(template==='referral'){
   Object.assign(values,Object.fromEntries(Object.entries(sectionDefaults('lab',language)).map(([id,value])=>[id,{value,status:'default'}])));
   body.push(group('summary',[
    {...H('สรุปประวัติการเจ็บป่วยและการรักษา','Clinical Summary and Treatment History'),attrs:{level:2,spacingBefore:8,condition:['hasClinical']}},
    group('clinical',[insertionPoint('clinical','Add a diagnosis or treatment history','blocks',null,REFERRAL_POINTS.clinical)])
   ]),group('medications',[]));
  }
  if(template==='medication'){
   body.push(P([T('หนังสือรับรองฉบับนี้ขอรับรองว่าผู้ป่วยรายนี้อยู่ระหว่างการดูแลรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี และมีความจำเป็นต้องนำยารายการต่อไปนี้ติดตัวเพื่อใช้ในการรักษาระหว่างการเดินทาง','This is to certify that the patient named above is currently under the care of Public Health Center 28 Krung Thon Buri and is required to carry the medications listed below for personal therapeutic use during travel.')]));
   const medicines=buildSection('travelMedications',language);medicines.content.splice(1,0,medicationRow('travel','1',language));body.push(medicines);
  }
  if(template==='medical')body.push(insertionPoint('clinical','Add examination, treatment or medical leave','blocks',null,['examination','leave','syphilisTreatment','tbTreatment']));
 }
 if(template==='referral')body.push(group('closing',[insertionPoint('closing','Add a closing request','closing',null,['admission','financial'])]));
 if(template!=='medical')body.push(P([T('หากท่านต้องการข้อมูลเพิ่มเติม กรุณาติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรี','Please contact Public Health Center 28 Krung Thon Buri, should you require any further information.')],{role:'closing',spacingBefore:8}));
 if(template==='referral')body.push(group('enclosures',[groupHeading('เอกสารแนบ','Enclosures',REFERRAL_POINTS.enclosures),buildSection('lab',language),insertionPoint('enclosures','Add enclosures','closing',null,REFERRAL_POINTS.enclosures)]));
 body.push(group('signature',[P([],{spacingAfter:8,role:'signatureLead'}),P([T('ขอแสดงความนับถือ','Yours faithfully,')],{role:'signature'}),P([],{spacingAfter:44,role:'signatureSpace'}),P([physician()]),P([G('doctor.license',[T('เลขที่ใบอนุญาตประกอบวิชาชีพเวชกรรม ','Medical licence number: '),F('doctor.license')])])]));
 return {type:'doc',content:[{type:'sessionData',attrs:{template,language,values,archives:{},fieldArchives:{},omitted:[]}},...body]};
}
function referralPurpose(language){
 const {T,F,G}=writer(language);
 return [G('referral.purposes',[F('referral.purposes')]),G('referral.customPurpose',[{type:'phrase',attrs:{condition:['referralChoices']},content:[T(' และ ',' and ')]},F('referral.customPurpose')],['customReferral'])];
}
export const INSERT_BLOCKS={...SECTIONS,
 identification:{id:'identification',labels:['ข้อมูลผู้ป่วย','Patient identification'],documents:['referral','medical','medication','freeform'],closing:false},
 dobAge:{id:'dobAge',labels:['วันเกิดและอายุ','Date of birth and Age'],documents:['referral','medical','medication','freeform'],closing:false},
 physician:{id:'physician',labels:['ข้อมูลแพทย์','Physician information'],documents:['referral','medical','medication','freeform'],closing:true},
 documentDate:{id:'documentDate',labels:['วันที่ในเอกสาร','Document date'],documents:['referral','medical','medication','freeform'],closing:false},
 documentTitle:{id:'documentTitle',labels:['ชื่อเอกสาร','Document title'],documents:['freeform'],closing:false},
 addressee:{id:'addressee',labels:['ผู้รับหนังสือ','Addressee'],documents:['referral','medical','medication','freeform'],closing:false},
 referralPurpose:{id:'referralPurpose',labels:['วัตถุประสงค์การส่งต่อ','Referral purpose'],documents:['referral'],closing:false},
 cd4:{id:'cd4',labels:['ผล CD4 เมื่อมารับบริการครั้งแรก','CD4 at first visit'],documents:['referral','freeform'],closing:false},
 viralLoad:{id:'viralLoad',labels:['ผล HIV viral load ล่าสุด','Latest HIV viral load'],documents:['referral','freeform'],closing:false}
};
export function availableBlocks(session,context={}){
 return Object.values(INSERT_BLOCKS).filter(section=>section.documents.includes(session.template)&&!session.activeSections?.includes(section.id)&&(!context.allowed||context.allowed.includes(section.id))&&(context.kind!=='closing'||section.closing));
}
export function buildBlock(id,language,template='referral'){
 if(SECTIONS[id])return buildSection(id,language);
 const {T,B,F,P,G,line}=writer(language),content=[];
 if(id==='identification'){
  content.push(P([G('patient.name',[B('ชื่อ-นามสกุล ','Full name: '),G('patient.salutation',[F('patient.salutation'),T(' ',' ')],null,['notEquals','patient.salutation','OTHER']),G('patient.salutationOther',[F('patient.salutationOther'),T(' ',' ')],['equals','patient.salutation','OTHER']),F('patient.name')])]),...buildBlock('dobAge',language,template).content,line('patient.nationalId','เลขประจำตัวประชาชน ','National ID: '),line('patient.passport','หนังสือเดินทางเลขที่ ','Passport no.: '));
  if(['medical','referral'].includes(template))content.push(line('patient.sex','เพศ ','Sex: '));
  if(template==='medication')content.push(line('patient.nationality','สัญชาติ ','Nationality: ','','',null,['notEquals','patient.nationality','OTHER']),line('patient.nationalityOther','สัญชาติอื่น ','Other nationality: ','','',['equals','patient.nationality','OTHER']));
 }else if(id==='dobAge')content.push(P([G('patient.dob',[B('วัน/เดือน/ปีเกิด ','Date of birth: '),F('patient.dob'),T('  ','  ')]),G('patient.age',[B('อายุ ','Age: '),F('patient.age'),T(' ปี',' years')])]));
 else if(id==='physician')content.push(P([{...F(language==='th'?'doctor.th':'doctor.en'),attrs:{id:language==='th'?'doctor.th':'doctor.en',languageBound:true}}]),line('doctor.license','เลขที่ใบอนุญาตประกอบวิชาชีพเวชกรรม ','Medical licence number: '));
 else if(id==='documentDate')content.push(line('document.date','วันที่ ','Date: '));
 else if(id==='documentTitle')content.push({type:'heading',attrs:{level:1,textAlign:'center'},content:[F('document.title')]});
 else if(id==='addressee')content.push(P([G('document.addressee',[B('เรียน ','To '),F('document.addressee'),T('',':')])]));
 else if(id==='referralPurpose')content.push(P(referralPurpose(language)));
 else if(id==='cd4'||id==='viralLoad'){
  const prefix=id==='cd4'?'hiv.initialCD4':'hiv.latestVL';
  const visit=node=>{if(node.type==='paragraph'){let match=false;const find=n=>{if(n.type==='field'&&n.attrs.id.startsWith(prefix))match=true;(n.content||[]).forEach(find);};find(node);if(match)content.push(node);}else (node.content||[]).forEach(visit);};visit(buildSection('hiv',language));
 }
 if(!content.length)throw new Error('Unsupported block');
 if(id==='identification')content[0].attrs={...content[0].attrs,spacingBefore:8};
 return {type:'clinicalSection',attrs:{id},content:['cd4','viralLoad'].includes(id)?bullets(content):content};
}
