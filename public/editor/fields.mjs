import { legacyOptions, mpoxLabels } from './legacy-options.mjs';
export const TEMPLATE_NAMES = {
 referral: ['หนังสือส่งตัวผู้ป่วย', 'Patient Referral Letter'],
 medical: ['ใบรับรองแพทย์', 'Medical Certificate'],
 medication: ['หนังสือรับรองการพกยา', 'Medication Certificate for Travel'],
 freeform: ['หนังสือแบบกำหนดเอง', 'Free-form / Custom Letter'],
};
export const label = (pair, language) => pair[language === 'en' ? 1 : 0];
export const DOCUMENT_TITLES = [
 {value:'medicalCertificate',labels:['ใบรับรองแพทย์','Medical Certificate']},
 {value:'referralLetter',labels:['หนังสือส่งตัวผู้ป่วย','Referral Letter']},
 {value:'medicalNotes',labels:['บันทึกข้อความ','Medical Notes']},
 {value:'medicalSummary',labels:['หนังสือสรุปประวัติการรักษา','Medical Summary']},
 {value:'medicalConsultation',labels:['หนังสือขอปรึกษาทางการแพทย์','Medical Consultation Letter']},
 {value:'medicationCertificate',labels:['หนังสือรับรองการพกยา','Medication Certificate for Travel']},
];
const options = id => (legacyOptions[id] || []).filter(o => o.value && !['NONE', 'None'].includes(o.value)).map(o => ({
 value: o.value, labels: [o['data-thai'] || o.text.split(' / ')[0].trim(), o['data-english'] || o.text.split(' / ').at(-1).trim()]
}));
const definitions = [
 ['document.date','letterDate','Document date','วันที่ในเอกสาร','date',{required:true}],
 ['patient.name','patientName','Patient name','ชื่อ-นามสกุลผู้ป่วย','text',{required:true}],
 ['patient.dob','dob','Date of birth','วันเกิด','date'],
 ['patient.age','patientAge','Age','อายุ','integer',{dependencies:['patient.dob','document.date','examination.date'],calculated:true}],
 ['patient.salutation','salutation,patientSalutation','Salutation','คำนำหน้าชื่อ','choice',{options:options('salutation')}],
 ['patient.salutationOther','otherSalutation,otherPatientSalutation','Custom salutation','คำนำหน้าชื่ออื่น','text'],
 ['patient.sex','patientGender','Sex','เพศ','choice',{options:options('patientGender')}],
 ['patient.passport','passportNumber','Passport number','เลขที่หนังสือเดินทาง','text',{uppercase:true}],
 ['patient.nationalId','nationalId,nationalIdNumber','National ID','เลขประจำตัวประชาชน','nationalId'],
 ['patient.nationality','nationality','Nationality','สัญชาติ','choice',{options:options('nationality')}],
 ['patient.nationalityOther','otherNationality','Custom nationality','สัญชาติอื่น','text'],
 ['doctor.th','doctorNameThai','Doctor’s name (Thai)','ชื่อแพทย์ภาษาไทย','text',{required:true}],
 ['doctor.en','doctorNameEnglish','Doctor’s name (English)','ชื่อแพทย์ภาษาอังกฤษ','text',{required:true}],
 ['doctor.license','medicalLicense','Medical licence number','เลขที่ใบประกอบวิชาชีพ','text',{required:true}],
 ['document.title','documentTitle','Document title','ชื่อเอกสาร','choice',{options:DOCUMENT_TITLES,allowCustom:true}],
 ['document.addressee','addressee','Addressee','ผู้รับหนังสือ','text'],
 ['document.body','letterBody','Letter body','เนื้อหาหนังสือ','multiline'],
 ['referral.purposes','referralIntent','Referral purpose','วัตถุประสงค์ในการส่งตัว','multi',{options:[...options('referralIntent').map(o=>({...o,labels:[o.value==='continuedCare'?'รับการรักษาต่อ':o.labels[0],o.labels[1].replace('Specialized','Specialised').replace(/^TB treatment$/,'Tuberculosis treatment').replace('Referral for Continued Care','continued care').replace(/^[A-Z](?=[a-z])/,letter=>letter.toLowerCase())]})),{value:'custom',labels:['วัตถุประสงค์อื่น ๆ','Other purpose (specify)']}]}],
 ['referral.customPurpose','referralIntentCustom','Custom referral purpose','วัตถุประสงค์อื่น ๆ ในการส่งต่อ','text'],
 ['hiv.napId','napId','NAP-ID','NAP-ID','napId'],
 ['hiv.diagnosed','firstDiagnosisDateRetro','Initial diagnosis date','วันที่วินิจฉัยครั้งแรก','partialDate'],
 ['hiv.artStart','artStartDate','ART initiation date','วันที่เริ่ม ART','partialDate'],
 ['hiv.initialCD4','initialCD4','CD4 at first visit','ผล CD4 เมื่อมารับบริการครั้งแรก','number',{legacyText:true}],
 ['hiv.initialCD4Percent','initialCD4Percent','CD4 percentage at first visit','ร้อยละ CD4 เมื่อมารับบริการครั้งแรก','percent',{legacyText:true}],
 ['hiv.initialCD4Date','initialCD4Date','Date of CD4 test at first visit','วันที่ตรวจ CD4 เมื่อมารับบริการครั้งแรก','partialDate'],
 ['hiv.adherence','adherence','Reported ART adherence','ความสม่ำเสมอในการรับประทาน ART ตามที่ผู้ป่วยรายงาน','choice',{options:options('adherence')}],
 ['hiv.latestVL','latestVL','Latest HIV viral load','ผล HIV viral load ล่าสุด','text'],
 ['hiv.latestVLDate','latestVLDate','Latest viral load date','วันที่ตรวจ viral load ล่าสุด','partialDate'],
 ['hiv.notes','retroviralNotes','Retroviral infection notes','หมายเหตุเกี่ยวกับ Retroviral infection','multiline'],
 ['oi.tablets','tmxSmpTablets','TMX/SMP tablet quantity','จำนวนเม็ด TMX/SMP','number'],
 ['oi.details','','Other OI prophylaxis','การป้องกันการติดเชื้อฉวยโอกาสอื่น','multiline'],
 ['pickup.date','lastMedicinePickupDate','Last medication pick-up date','วันที่รับยาครั้งล่าสุด','date'],
 ['pickup.days','medicineDuration','Days of medication supplied','จำนวนวันที่ยาครอบคลุม','integer'],
 ['attachments.lab','','Laboratory results enclosure','ผลตรวจทางห้องปฏิบัติการล่าสุด','text'],
 ['syphilis.start','syphilisStartDate','Treatment start date','วันที่เริ่มการรักษา','date'],
 ['syphilis.regimen','syphilisMedication','Treatment regimen','สูตรการรักษา','choice',{options:options('syphilisMedication')}],
 ...[1,2,3].map(n=>[`syphilis.dose${n}`,`syphilisDose${n}Date`,`Benzathine penicillin G dose ${n}`,`กำหนดฉีด Benzathine penicillin G เข็มที่ ${n}`,'date',{calculated:true,dependencies:['syphilis.start','syphilis.regimen']}]),
 ['syphilis.duration','syphilisDuration','Treatment duration (days)','ระยะเวลาการรักษา (วัน)','integer',{calculated:true,dependencies:['syphilis.regimen']}],
 ['syphilis.notes','syphilisNotes','Syphilis treatment notes','หมายเหตุการรักษาซิฟิลิส','multiline'],
 ['mpox.days','mpoxSymptomDurationDays','Duration of symptoms (days)','ระยะเวลาที่มีอาการ (วัน)','integer'],
 ['mpox.symptoms','mpoxSymptomsGroup','Presenting symptoms','อาการสำคัญ','multi',{options:Object.entries(mpoxLabels.symptoms).map(([value,text])=>({value,labels:[text.thai,text.english]}))}],
 ['mpox.symptomOther','mpoxSymptomOtherText','Other symptoms','รายละเอียดอาการอื่น','text'],
 ['mpox.risks','mpoxRiskFactorsGroup','Patient-reported risk factors','ประวัติความเสี่ยงตามที่ผู้ป่วยรายงาน','multi',{options:Object.entries(mpoxLabels.risks).map(([value,text])=>({value,labels:[value==='noneKnown'?'ผู้ป่วยไม่ให้ประวัติความเสี่ยง':text.thai,value==='noneKnown'?'The patient did not report any risk factors':text.english]}))}],
 ['mpox.riskOther','mpoxRiskOtherText','Other risk factors','รายละเอียดความเสี่ยงอื่น','text'],
 ['hcv.regimen','treatedHCVMedication','Previous HCV regimen','สูตรยาที่เคยรักษา HCV','text'],
 ['hcv.completed','treatedHCVCompletionDate','HCV treatment completion date','วันที่รักษา HCV ครบ','partialDate'],
 ['tb.sites','treatedTBSitesSelect','TB disease sites','ตำแหน่งของวัณโรค','multi',{options:options('treatedTBSitesSelect')}],
 ['tb.siteOther','treatedTBSitesOther','Other TB sites','ตำแหน่งวัณโรคอื่น','text'],
 ['tb.regimen','treatedTBMedication','Previous TB regimen','สูตรยาที่เคยรักษาวัณโรค','text'],
 ['tb.completed','treatedTBCompletionDate','TB treatment completion date','วันที่รักษาวัณโรคครบ','partialDate'],
 ['tbActive.sites','','TB disease sites','ตำแหน่งของวัณโรค','multi',{options:options('treatedTBSitesSelect')}],
 ['tbActive.siteOther','','Other TB disease sites','ตำแหน่งวัณโรคอื่น','text'],
 ['tbActive.diagnosisDate','','TB diagnosis date','วันที่วินิจฉัยวัณโรค','partialDate'],
 ['tbActive.specimen','','Specimen and collection site','ชนิดสิ่งส่งตรวจและตำแหน่งที่เก็บ','text'],
 ['tbActive.afb','','Sputum AFB smear: date and result','ผลตรวจเสมหะ AFB และวันที่ตรวจ','multiline'],
 ['tbActive.xpert','','Xpert MTB/RIF or Ultra (GeneXpert): date and result','ผลตรวจ Xpert MTB/RIF หรือ Ultra (GeneXpert) และวันที่ตรวจ','multiline'],
 ['tbActive.culture','','Mycobacterial culture: date and result','ผลเพาะเชื้อวัณโรคและวันที่ตรวจ','multiline'],
 ['tbActive.dst','','Drug susceptibility (C/S, DST): date and result','ผลทดสอบความไวต่อยา (C/S, DST) และวันที่ตรวจ','multiline'],
 ['tbActive.lpa','','Line probe assay (LPA): date and result','ผลตรวจ Line probe assay (LPA) และวันที่ตรวจ','multiline'],
 ['tbActive.resistance','','Drug-resistance profile','ข้อมูลการดื้อยาวัณโรค','text'],
 ['tbActive.treatmentStart','','TB treatment start date','วันที่เริ่มรักษาวัณโรค','partialDate'],
 ['tbActive.regimen','','Current TB regimen, doses and frequency','สูตรยาวัณโรคปัจจุบัน ขนาดยา และความถี่','multiline'],
 ['tbActive.regimenStart','','Current regimen start date','วันที่เริ่มสูตรยาปัจจุบัน','partialDate'],
 ['tbActive.phase','','Current treatment phase','ระยะการรักษาปัจจุบัน','choice',{options:[{value:'intensive',labels:['ระยะเข้มข้น','Intensive phase']},{value:'continuation',labels:['ระยะต่อเนื่อง','Continuation phase']},{value:'other',labels:['ระยะอื่น (ระบุ)','Other (specify)']}]}],
 ['tbActive.phaseOther','','Other treatment phase or stage','ระยะการรักษาอื่น','text'],
 ['tbActive.weight','','Current weight (kg)','น้ำหนักปัจจุบัน (กิโลกรัม)','number'],
 ['tbActive.imaging','','Chest imaging and other investigations','ภาพถ่ายรังสีทรวงอกและผลตรวจเพิ่มเติม','multiline'],
 ['tbActive.response','','Clinical response and follow-up smear / culture','การตอบสนองต่อการรักษาและผลตรวจเสมหะหรือเพาะเชื้อติดตาม','multiline'],
 ['tbActive.adherence','','Adherence and treatment interruptions','ความสม่ำเสมอในการรับยาและช่วงที่ขาดยา','multiline'],
 ['tbActive.adverseEffects','','Adverse effects and treatment changes','อาการไม่พึงประสงค์และการปรับเปลี่ยนการรักษา','multiline'],
 ['tbActive.followUp','','Follow-up and transfer-of-care plan','แผนการติดตามและส่งต่อการดูแลรักษา','multiline'],
 ['tbActive.nextReview','','Next review date','วันที่นัดติดตามครั้งถัดไป','partialDate'],
 ['crag.date','','Positive serum CrAg test date','วันที่ผลตรวจ serum CrAg เป็นบวก','partialDate'],
 ['cmvr.date','','Fundus camera examination date','วันที่ตรวจด้วยกล้องถ่ายภาพจอประสาทตา','partialDate'],
 ['cmvr.fundus','','Fundus camera examination findings','ผลตรวจจากภาพถ่ายจอประสาทตา','multiline'],
 ...['completed','ongoing'].flatMap(prefix=>[
  [`tpt.${prefix}.regimen`,`${prefix}TPTMedication`,'TPT regimen','สูตรยา TPT','choice',{options:options(`${prefix}TPTMedication`)}],
  [`tpt.${prefix}.other`,`${prefix}TPTMedicationOther`,'Other TPT regimen','สูตร TPT อื่น','text'],
  [`tpt.${prefix}.start`,`${prefix}TPTStartDate`,'TPT start month/year','เดือน/ปีที่เริ่ม TPT','monthYear'],
  [`tpt.${prefix}.notes`,`${prefix}TPTNotes`,'TPT notes','หมายเหตุ TPT','multiline'],
 ]),
 ['history.other','otherMedicalHistory','Other medical history','ประวัติการรักษาอื่น','multiline'],
 ['attachments.other','attachmentOtherText','Other attachment description','รายละเอียดเอกสารแนบอื่น','text'],
 ['document.notes','additionalNotes','Additional notes','หมายเหตุเพิ่มเติม','multiline'],
 ['examination.date','consultationDate','Examination date','วันที่ตรวจรักษา','date'],
 ['examination.findings','','Symptoms and examination findings','อาการที่ตรวจพบ','multiline'],
 ['examination.diagnosis','diagnosis','Diagnosis','การวินิจฉัย','multiline'],
 ['leave.start','restStartDate','Medical leave from','พักรักษาตัวตั้งแต่วันที่','date'],
 ['leave.end','restEndDate','Medical leave to','พักรักษาตัวถึงวันที่','date'],
 ['leave.days','restDurationDays','Inclusive leave duration (days)','จำนวนวันพักรักษาตัว','integer',{calculated:true,readonly:true,dependencies:['leave.start','leave.end']}],
 ['leave.notes','advisedRestNotes','Medical leave notes','หมายเหตุการพักรักษาตัว','multiline'],
 ['treatment.syphilisDate','syphilisTreatmentDate','Administered syphilis treatment date','วันที่ได้รับการรักษาซิฟิลิสจริง','date'],
 ['treatment.syphilisNotes','syphilisNotes','Syphilis treatment notes','หมายเหตุการรักษาซิฟิลิส','multiline'],
 ['treatment.tbDate','tbTreatmentCompletionDate','Documented tuberculosis completion date','วันที่รักษาวัณโรคครบตามบันทึก','date'],
 ['treatment.tbNotes','tbNotes','Tuberculosis treatment notes','หมายเหตุการรักษาวัณโรค','multiline'],
 ['doctor.comments','doctorComment','Physician comments','ความเห็นแพทย์','multiline'],
 ['art.name','artMedSelect-*','ART medication','ยา ART','choice',{options:options('art'),allowCustom:false}],
 ['art.tablets','artTablets-*','Tablet count','จำนวนเม็ด','number'],
 ['art.time','artTime-*','Administration time (24-hour)','เวลาให้ยา (24 ชั่วโมง)','time'],
 ['otherMed.name','otherMedName-*','Medication name','ชื่อยา','text'],
 ['otherMed.strength','otherMedStrength-*','Strength','ความแรง','text'],
 ['otherMed.frequency','otherMedSchedule-*','Frequency','ความถี่','choice',{options:['OD','BID','TID','QID','PRN'].map(value=>({value,labels:[value,value]}))}],
 ['otherMed.quantity','otherMedQty-*','Quantity (tablets/bottles/units)','จำนวน (เม็ด/ขวด/หน่วย)','number'],
 ['otherMed.unit','','Quantity unit','หน่วยนับยา','choice',{options:[['tablet','เม็ด','tablets'],['capsule','แคปซูล','capsules'],['bottle','ขวด','bottles'],['unit','หน่วย','units']].map(([value,th,en])=>({value,labels:[th,en]}))}],
 ['travel.name','artMedSelect-*','Travel medication','ยาที่พกขณะเดินทาง','choice',{options:options('travel')}],
 ['travel.other','artMedOther-*','Specify other medication','ระบุยาอื่น','text'],
];
export const FIELDS = Object.fromEntries(definitions.map(([id,original,en,th,type,extra={}])=>[id,{id,originalIds:original?original.split(','):[],labels:[th,en],type,required:false,dependencies:[],...extra}]));
export function definition(id) {
 const base = id.replace(/\.[^.]+\.(name|tablets|time|strength|frequency|quantity|unit|other)$/, '.$1');
 return FIELDS[id] || FIELDS[base];
}
export const legacyFieldMap = Object.fromEntries(Object.values(FIELDS).flatMap(f=>f.originalIds.map(id=>[id,f.id])));
const templateScope = {
 patient:['referral','medical','medication','freeform'],doctor:['referral','medical','medication','freeform'],document:['referral','medical','medication','freeform'],referral:['referral'],hiv:['referral'],oi:['referral'],pickup:['referral'],syphilis:['referral'],mpox:['referral'],hcv:['referral'],tb:['referral'],tbActive:['referral','freeform'],crag:['referral','freeform'],cmvr:['referral','freeform'],tpt:['referral'],history:['referral'],attachments:['referral','freeform'],examination:['medical'],leave:['medical'],treatment:['medical'],art:['referral'],otherMed:['referral'],travel:['medication']
};
const sectionScope={referral:['referralPurpose'],hiv:['hiv'],oi:['hiv','oi'],pickup:['hiv','pickup'],syphilis:['syphilis'],mpox:['mpox'],hcv:['hcvHistory'],tb:['tbHistory'],tbActive:['tbActive'],crag:['crag'],cmvr:['cmvr'],history:['otherHistory'],attachments:['attachments'],examination:['examination'],leave:['leave'],art:['hiv','art'],otherMed:['otherMedications'],travel:['travelMedications']};
for(const field of Object.values(FIELDS)) {
 const prefix=field.id.split('.')[0];field.documents=templateScope[prefix]||[];field.sections=sectionScope[prefix]||[];
 if(prefix==='tpt')field.sections=[field.id.includes('.completed.')?'tptCompleted':'tptOngoing'];
 if(prefix==='treatment')field.sections=[field.id.includes('.syphilis')?'syphilisTreatment':'tbTreatment'];
 if(field.id==='doctor.comments')field.documents=['medical'],field.sections=['comments'];
 if(field.id==='document.notes')field.sections=['notes'];
 if(field.id==='attachments.lab')field.sections=['lab'];
 if(field.id==='examination.date')field.sections=['examination','attendance'];
 if(/^hiv\.(initialCD4|latestVL)/.test(field.id))field.documents=['referral','freeform'],field.sections=['hiv',field.id.startsWith('hiv.initialCD4')?'cd4':'viralLoad'];
 field.validation=({date:'Gregorian date; complete date except optional DOB',partialDate:'Valid date with original precision',monthYear:'Valid month/year',integer:'Whole number, zero or greater',number:'Non-negative number',percent:'0–100 per cent',nationalId:'13 digits, optional separators',napId:'5–20 digits, optional separator',time:'Valid 24-hour time',choice:'Catalogue option',multi:'Catalogue options; conditional other detail'})[field.type]||'Plain text; HTML is never evaluated';
 if(field.legacyText)field.validation='Original free-text clinical value; qualifiers are retained';
 if(['date','partialDate','monthYear'].includes(field.type)){
  field.maxLength=field.type==='monthYear'?7:10;field.maxDigits=field.type==='monthYear'?6:8;
  field.inputHint=`${field.type==='monthYear'?'MM/YYYY':'DD/MM/YYYY'}. CE/BE years are detected automatically. Type digits; you do not need to enter "/". Maximum ${field.maxDigits} digits.`;
  if(field.type==='partialDate'||field.id==='patient.dob')field.inputHint+=' A year or month/year is also accepted.';
 }
 if(field.type==='nationalId'){field.maxLength=17;field.maxDigits=13;field.inputHint='National ID: 1-2345-67890-12-3 (13 digits). Hyphens are added automatically; enter digits only.';}
}
