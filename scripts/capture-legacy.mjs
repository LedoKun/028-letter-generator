import { chromium } from '@playwright/test';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://localhost:4001';
const commit='aa8599a19ca8045ff924428609084a4070e6ae6d';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=[];
for(const path of ['public/shared/pdf-generator.js','public/shared/pdf-templates.js','public/shared/print-header-footer.js','public/shared/print-header-footer.css','public/js/common.js','public/referral/index.html','public/referral/script.js','public/referral/referral-data.js','public/medical-certificate/medical-certificate-script.js','public/certificate-medication-letter/certificate-script.js','public/free-form-letter/script.js','public/vendor/pdfmake/pdfmake.min.js','public/media/logo/logo.png',...['NotoSansThai-Regular.ttf','NotoSansThai-Bold.ttf','NotoSans-Regular.ttf','NotoSans-Bold.ttf'].map(font=>'public/vendor/fonts/'+font)]){
 const response=await fetch(new URL(path.replace(/^public\//,''),origin+'/'));assert.ok(response.ok,path);
 const bytes=Buffer.from(await response.arrayBuffer()),original=execFileSync('git',['show',`${commit}:${path}`],{maxBuffer:20*1024*1024});
 assert.equal(sha256(bytes),sha256(original),`${path}: the running legacy code must match the pinned original GitHub commit`);
 if(path.startsWith('public/shared/pdf-'))assert.equal(sha256(await readFile(path.includes('templates')?'tests/fixtures/legacy-pdf-templates.cjs':'tests/fixtures/legacy-pdf-generator.cjs')),sha256(bytes),'Legacy test fixtures must be unmodified original source');
 sources.push({path,sha256:sha256(bytes),bytes:bytes.length,github:`https://github.com/LedoKun/028-letter-generator/blob/${commit}/${path}`});
}
const browser = await chromium.launch({headless:true});
try{
const page = await browser.newPage({ timezoneId:'Asia/Bangkok' });
await page.clock.install({ time: new Date('2026-10-10T03:00:00Z') });
await page.goto(origin+'/');
await page.addScriptTag({url:'/js/common.js'});
await page.addScriptTag({url:'/vendor/pdfmake/pdfmake.min.js'});
await page.addScriptTag({url:'/shared/pdf-generator.js'});
await page.addScriptTag({url:'/shared/pdf-templates.js'});
const base = {letterDate:'10/10/2026',patientName:'FICTIONAL PATIENT',dob:'10/10/2000',doctorNameThai:'นพ. ทดสอบ ระบบ',doctorNameEnglish:'TEST DOCTOR',medicalLicense:'12345'};
const samples = {
 referral: {...base,letterDate:'10/10/2569',dob:'10/10/2543',referralIntents:['continuedCare'],includeRetroviral:true,initialCD4:'325',initialCD4Percent:'18',initialCD4Date:'10/01/2569',latestVL:'<20',latestVLDate:'09/10/2569',artMedications:[{medication:'TDF/3TC/DTG',tablets:'1',time:'20:00'}],includeLastMedicinePickup:true,lastMedicinePickupDate:'09/10/2569',medicineDuration:'60',includeSyphilisActive:true,syphilisStartDate:'06/06/2569',syphilisMedication:'Benzathine',syphilisDose1Date:'06/06/2569',syphilisDose2Date:'13/06/2569',syphilisDose3Date:'20/06/2569',includeOtherHistory:true,otherMedicalHistory:('ประวัติสำหรับทดสอบเอกสาร Fictional clinical history.\n').repeat(150)},
 medical: {...base,patientAge:'26',includeConsultationDiagnosis:true,consultationDate:'10/10/2026',diagnosis:'Fictional diagnosis',includeAdvisedRest:true,restStartDate:'10/10/2026',restEndDate:'12/10/2026',restDurationDays:'3'},
 medication: {...base,includeMedications:true,artMedications:[{medication:'DOLUTEGRAVIR'}],nationality:'THAI',passportNumber:'TEST123'},
 freeform: {...base,documentTitle:'TEST LETTER',addressee:'Test recipient',letterBody:('ข้อความสำหรับทดสอบเท่านั้น Fictional text for regression testing.\n').repeat(150)}
};
await mkdir('docs/samples/legacy',{recursive:true});
await writeFile('tests/fixtures/representative-data.json',JSON.stringify(samples,null,2)+'\n');
const builders={referral:'buildReferral',medical:'buildMedicalCertificate',medication:'buildMedicationCertificate',freeform:'buildFreeForm'};
const complete={...samples.referral,letterDate:'10/10/2569',dob:'10/10/2543',napId:'1234-567890',firstDiagnosisDateRetro:'02/02/2563',artStartDate:'03/03/2563',adherence:'>95%',includeTmxSmp:true,tmxSmpTablets:'2',syphilisMedicationText:'Benzathine penicillin G 2.4 million units IM',includeSuspectedMpox:true,mpoxSymptomDurationDays:'4',mpoxSymptoms:['rashLesions','feverChills','other'],mpoxSymptomOtherText:'Fictional symptom',mpoxRiskFactors:['noneKnown'],includeHBV:true,includeHCVActive:true,includeTreatedSyphilis:true,includeTreatedHCV:true,treatedHCVMedication:'SOF/VEL',treatedHCVCompletionDate:'07/07/2567',includeTreatedTB:true,treatedTBSiteValues:['Pulmonary','Lymph nodes'],treatedTBMedication:'2HRZE/4HR',treatedTBCompletionDate:'08/08/2566',includeCompletedTPT:true,completedTPTMedicationText:'3HP',completedTPTStartDate:'09/2565',includeOngoingTPT:true,ongoingTPTMedicationText:'1HP',ongoingTPTStartDate:'09/2568',otherMedicalHistory:'ประวัติทางการแพทย์สำหรับทดสอบเท่านั้น Fictional medical history.',includeOtherMedications:true,otherMedications:[{name:'Fluconazole',strength:'200 mg',schedule:'OD',quantity:'28'}],includeReferralForAdmission:true,attachmentLabResults:true,attachmentOther:true,attachmentOtherText:'Fictional treatment record'};
await writeFile('tests/fixtures/legacy-complete-referral.json',JSON.stringify(complete,null,2)+'\n');
const captured=[];
for(const [sample,data] of Object.entries({...samples,'referral-complete':complete})) for (const language of ['th','en']) {
 const id=sample==='referral-complete'?'referral':sample;
 const bytes=await page.evaluate(async ({data,builder,id,language})=>{
  const content=window.PdfTemplates[builder]({...data,language});
  if(id==='referral'&&language==='en'&&!JSON.stringify(content).includes('10/10/2000'))throw new Error('Original referral input must use BE DOB, as collected by the legacy form');
  const blob=await window.PdfGenerator.generateBlob({type:id,patientName:data.patientName,language,content});
  return [...new Uint8Array(await blob.arrayBuffer())];
 },{data,builder:builders[id],id,language});
 const file=`docs/samples/legacy/${sample}-${language}.pdf`;
 await writeFile(file,Buffer.from(bytes));
 captured.push({file,language,sha256:sha256(Buffer.from(bytes)),input:sample==='referral-complete'?'tests/fixtures/legacy-complete-referral.json':`tests/fixtures/representative-data.json#${id}`});
 console.log(`Captured original GitHub ${sample}-${language}`);
}
const supplied=[];for(const name of await readdir('docs/samples/legacy'))if(/ - [\da-f-]+\.pdf$/.test(name)){const file='docs/samples/legacy/'+name;supplied.push({file,sha256:sha256(await readFile(file)),provenance:'Legacy app export supplied by the user; reviewed for wording; inputs not recreated'});}
await writeFile('docs/legacy-sample-provenance.json',JSON.stringify({repository:'https://github.com/LedoKun/028-letter-generator',commit,servedFrom:origin,capturedAt:new Date().toISOString(),printedAt:'2026-10-10T03:00:00Z',sourceVerifiedAgainstGitCommit:true,sourceTransformations:[],sources,samples:captured,userProvidedSamples:supplied},null,2)+'\n');
}finally{await browser.close();}
