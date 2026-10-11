import { chromium } from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const server=spawn('python3',['-m','http.server','4176','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch();
const rows=[],routes={referral:'referral',medical:'medical-certificate',medication:'certificate-medication-letter',freeform:'free-form-letter'};
mkdirSync('docs/samples/current',{recursive:true});mkdirSync('pdf-results',{recursive:true});
function raster(file,prefix,page=1){execFileSync('pdftoppm',['-r','144','-f',String(page),'-singlefile',file,prefix]);const raw=readFileSync(prefix+'.ppm'),match=raw.toString('ascii',0,60).match(/^P6\s+(\d+)\s+(\d+)\s+255\s/);assert.ok(match);return {width:Number(match[1]),height:Number(match[2]),data:raw.subarray(match[0].length)};}
function words(file,page=1){const xml=execFileSync('pdftotext',['-f',String(page),'-l',String(page),'-bbox',file,'-'],{encoding:'utf8'});return [...xml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/word>/g)].map(m=>({x:Number(m[1]),y:Number(m[2]),right:Number(m[3]),bottom:Number(m[4]),text:m[5]}));}
function compare(a,b,region,mask){assert.equal(a.width,b.width);assert.equal(a.height,b.height);let differing=0;for(let y=region[0];y<region[1];y++)for(let x=0;x<a.width;x++){if(mask?.(x,y))continue;const pos=(y*a.width+x)*3;if(a.data[pos]!==b.data[pos]||a.data[pos+1]!==b.data[pos+1]||a.data[pos+2]!==b.data[pos+2])differing++;}return differing;}
function logoHeight(file,page=1){const rows=execFileSync('pdfimages',['-list',file],{encoding:'utf8'}).split('\n').map(line=>line.trim().split(/\s+/)),image=rows.find(row=>row[0]===String(page)&&row[2]==='image');assert.ok(image,'Missing PDF logo');return Number(image[4])*72/Number(image[13]);}
try{
 await new Promise(async(resolve,reject)=>{const deadline=Date.now()+5000;while(Date.now()<deadline){try{const r=await fetch('http://localhost:4176');if(r.ok)return resolve();}catch{}await new Promise(r=>setTimeout(r,50));}reject(new Error('PDF test server did not start'));});
 const referencePage=await browser.newPage({timezoneId:'Asia/Bangkok'});await referencePage.clock.install({time:new Date('2026-10-10T03:00:00Z')});await referencePage.goto('http://localhost:4176');
 let referenceSource=readFileSync('tests/fixtures/legacy-pdf-generator.cjs','utf8').replace("const THAI_FONT = 'NotoSansThai'","const THAI_FONT = 'Sarabun'").replace("const EN_FONT = 'NotoSans'","const EN_FONT = 'Sarabun'").replace("const keys = ['bold'","const keys = ['fontSize', 'bold'");
 const start=referenceSource.indexOf('        const fonts = {'),end=referenceSource.indexOf('        window.pdfMake.addFonts',start);referenceSource=referenceSource.slice(0,start)+`        const fonts={Sarabun:{normal:toAbsoluteUrl('/vendor/fonts/Sarabun-Regular.ttf'),bold:toAbsoluteUrl('/vendor/fonts/Sarabun-Bold.ttf'),italics:toAbsoluteUrl('/vendor/fonts/Sarabun-Italic.ttf'),bolditalics:toAbsoluteUrl('/vendor/fonts/Sarabun-BoldItalic.ttf')}};\n`+referenceSource.slice(end);
 const headerStart=referenceSource.indexOf('    function makeHeader('),footerStart=referenceSource.indexOf('    function makeFooter('),definitionStart=referenceSource.indexOf('    function buildDocDefinition(');referenceSource=referenceSource.slice(0,headerStart)+referenceSource.slice(headerStart,footerStart).replace('fontSize: 12.5','fontSize: 9').replaceAll('fontSize: 8.5','fontSize: 6.5').replace('Public Health Center 28 - Krung Thon Buri','Public Health Center 28 Krung Thon Buri').replace('width: 223, margin:', 'height: 223 * 1182 / 5300, margin:')+referenceSource.slice(footerStart,definitionStart).replace('fontSize: 7,','fontSize: 6.5,')+referenceSource.slice(definitionStart);
 referenceSource=referenceSource.replace("const LOGO_URL = '/media/logo/logo.png';","const LOGO_URL = '/media/logo/028-logo.png';");
 referenceSource=referenceSource.replace('window.PdfGenerator =','window.ReferencePdfGenerator =');await referencePage.addScriptTag({content:referenceSource});
 const referenceBytes=await referencePage.evaluate(async()=>[...new Uint8Array(await(await ReferencePdfGenerator.generateBlob({type:'Typography reference',content:[{text:'Reference'}]})).arrayBuffer())]);
 const referenceFile='pdf-results/approved-reference.pdf';writeFileSync(referenceFile,Buffer.from(referenceBytes));const approvedImage=raster(referenceFile,'pdf-results/approved-reference'),referenceWords=words(referenceFile),pageLabel=referenceWords.find(w=>w.text==='Page:'&&w.y>700);assert.ok(pageLabel);await referencePage.close();
 for(const [sample,path]of Object.entries({...routes,'medical-history':'medical-certificate','referral-wording':'referral'}))for(const language of ['th','en']){
  const type=sample==='medical-history'?'medical':sample==='referral-wording'?'referral':sample,historyOnly=sample==='medical-history',compact=sample==='referral-wording';
  const context=await browser.newContext({timezoneId:'Asia/Bangkok'}),page=await context.newPage();
  await page.clock.install({time:new Date('2026-10-10T03:00:00Z')});await page.addInitScript(lang=>localStorage.setItem('documentLanguage',lang),language);
  await page.goto(`http://localhost:4176/${path}/index.html`);await page.waitForFunction(()=>document.activeElement?.classList.contains('tiptap'));
  await page.evaluate(({type,language,historyOnly,compact})=>{
   const data={'document.date':'10/10/2026','patient.name':'FICTIONAL PATIENT','patient.dob':'10/10/2000','doctor.en':'TEST DOCTOR','doctor.th':'นพ. ทดสอบ ระบบ','doctor.license':'12345'};
   if(type==='referral'){
    clinical.addSections(['hiv','syphilis','mpox','hbv','hcvActive','syphilisHistory','hcvHistory','tbHistory','tptCompleted','tptOngoing','otherHistory','otherMedications','oi','pickup','admission','lab','attachments','financial']);
    Object.assign(data,{'hiv.napId':'1234-567890','hiv.diagnosed':'02/02/2020','hiv.artStart':'03/03/2020','hiv.initialCD4':'325','hiv.initialCD4Percent':'18','hiv.initialCD4Date':'10/01/2026','hiv.adherence':'>95%','hiv.latestVL':'<20','hiv.latestVLDate':'09/10/2026','oi.tablets':'2','pickup.date':compact?'10/10/2026':'09/10/2026','pickup.days':'60','syphilis.regimen':'Benzathine','syphilis.start':compact?'10/10/2026':'06/06/2026','mpox.days':'4','mpox.symptoms':['rashLesions','feverChills','other'],'mpox.symptomOther':'Fictional symptom','mpox.risks':['noneKnown'],'hcv.regimen':'SOF/VEL','hcv.completed':'07/07/2024','tb.sites':['Pulmonary','Lymph nodes'],'tb.regimen':'2HRZE/4HR','tb.completed':'08/08/2023','tpt.completed.regimen':'3HP','tpt.completed.start':'09/2022','tpt.ongoing.regimen':'1HP','tpt.ongoing.start':'09/2025','history.other':('ประวัติสำหรับทดสอบเอกสาร Fictional clinical history.\n').repeat(compact?1:150),'attachments.other':'Fictional treatment record','document.notes':'Fictional additional notes.'});
   }
   if(type==='medical'){
    clinical.addSections(historyOnly?['syphilisTreatment','tbTreatment','comments']:['examination','leave','syphilisTreatment','tbTreatment','comments','attendance']);Object.assign(data,{'treatment.syphilisDate':'09/10/2026','treatment.syphilisNotes':'Documented administration; fictional record','treatment.tbDate':'01/06/2026','treatment.tbNotes':'Fictional completion record','doctor.comments':'Fictional physician comment'});
    if(!historyOnly)Object.assign(data,{'examination.date':'10/10/2026','examination.findings':'Fictional examination findings','examination.diagnosis':'Fictional diagnosis','leave.start':'10/10/2026','leave.end':'12/10/2026','leave.notes':'Fictional leave notes'});
   }
   if(type==='medication')Object.assign(data,{'travel.1.name':'DOLUTEGRAVIR','patient.nationality':'THAI','patient.passport':'TEST123'});
   if(type==='freeform'){
    Object.assign(data,{'document.title':'TEST LETTER','document.addressee':'Test recipient'});const e=clinical.editor;e.state.doc.descendants((n,p)=>{if(n.type.name==='bodyText')e.commands.insertContentAt(p+1,{type:'paragraph',content:[{type:'text',text:('ข้อความสำหรับทดสอบเท่านั้น Fictional text for regression testing.\n').repeat(150)}]});});
   }
   for(const [id,value]of Object.entries(data))clinical.setValue(id,value);
  },{type,language,historyOnly,compact});
  if(type==='referral')for(const [section,kind,med]of [['art','art','TDF/3TC/DTG'],['otherMedications','otherMed','Fluconazole']]){
   await page.locator(`[data-section-control="${section}"]`).getByRole('button',{name:'Add medicine',exact:true}).click();
   const id=await page.locator(`.tiptap [data-kind="${kind}"]`).last().getAttribute('data-medication-row');
   await page.evaluate(({kind,id,med})=>{clinical.setValue(`${kind}.${id}.name`,med);if(kind==='art'){clinical.setValue(`${kind}.${id}.tablets`,'1');clinical.setValue(`${kind}.${id}.time`,'20:00');}else{clinical.setValue(`${kind}.${id}.strength`,'200 mg');clinical.setValue(`${kind}.${id}.frequency`,'OD');clinical.setValue(`${kind}.${id}.quantity`,'28');clinical.setValue(`${kind}.${id}.unit`,'tablet');}},{kind,id,med});
  }
  const errors=await page.evaluate(()=>clinical.payload().errors);assert.deepEqual(errors,[],`${type}-${language} validation`);
  const before=await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON()));
  const bytes=await page.evaluate(async()=>[...new Uint8Array(await(await PdfGenerator.generateBlob(clinical.payload().payload)).arrayBuffer())]);
  assert.equal(await page.evaluate(()=>JSON.stringify(clinical.editor.getJSON())),before,'PDF generation mutated document');
  const file=`docs/samples/current/${sample}-${language}.pdf`;writeFileSync(file,Buffer.from(bytes));
  const info=execFileSync('pdfinfo',[file],{encoding:'utf8'}),pageCount=Number(info.match(/Pages:\s+(\d+)/)[1]);assert.match(info,/595\.28 x 841\.89 pts/);
  const extracted=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8'});assert.doesNotMatch(extracted,/N\/A|None specified|Next field|Previous field|CD4 percentage at first visit\s*$/m);
  assert.match(extracted,/Public Health Center 28 Krung Thon Buri/);assert.doesNotMatch(extracted,/Public Health Centre|Public Health Center 28 - Krung Thon Buri/);
  if(type==='referral'&&language==='en')assert.match(extracted,/Medical Referral Letter/);
  if(type==='referral'&&language==='th'){
   const pageWords=Array.from({length:pageCount},(_,i)=>words(file,i+1)),financial=pageWords.find(items=>items.some(word=>word.text==='ทั้งนี้'));
   assert.ok(financial,'Financial request is missing');const opening=financial.find(word=>word.text==='ทั้งนี้'),request=financial.find(word=>word.text.startsWith('ขอความอนุเคราะห์ทีม'));
   assert.ok(request,'Financial request text is not searchable');assert.ok(Math.abs(request.y-opening.y)<0.1,'Thai financial request leaves an unnecessarily short opening line');
   assert.match(extracted,/ART adherence >95%/);assert.doesNotMatch(extracted,/[\u200B\uFFFD]/);
  }
  assert.doesNotMatch(extracted,/Signature:|Name: Dr|ลงชื่อ|_{3,}|\.{4,}|Baseline CD4/);
  assert.doesNotMatch(extracted,/\bBPG\b|Fictional additional notes|Fictional leave notes|Documented administration; fictional record/);
  if(type==='referral'){assert.match(extracted,/Latest laboratory results|ผลตรวจทางห้องปฏิบัติการล่าสุด/);assert.doesNotMatch(extracted,/Purpose of Referral|Additional details|Co-Infections and Past Medical History|Additional Notes and Requests|รายละเอียดเพิ่มเติมในการส่งตัว/);if(compact)assert.match(extracted,language==='th'?/24\/10\/2569/:/24\/10\/2026/);}
  const signatureWords=words(file,pageCount),closing=signatureWords.find(word=>word.text===(language==='th'?'ขอแสดงความนับถือ':'Yours'));
  assert.ok(closing,`${sample}-${language}: closing must share the final page with the physician`);
  const physician=signatureWords.find(word=>word.y>closing.bottom&&word.text===(language==='th'?'นพ.':'TEST'));
  assert.ok(physician,`${sample}-${language}: plain physician name is missing`);
  const signatureGapPoints=physician.y-closing.bottom;assert.ok(signatureGapPoints>=40,`${sample}-${language}: signature space was lost`);
  assert.match(extracted,type==='freeform'?/TEST LETTER/:/FICTIONAL PATIENT/);assert.match(extracted,/Valid only with an official stamp/);assert.match(extracted,/10\/10\/2026 \(DD\/MM\/YYYY\)/);assert.ok(/\u0E/.test(JSON.stringify(extracted))||/[ก-๙]/.test(extracted));
  if(historyOnly){assert.match(extracted,language==='th'?/ใบรับรองแพทย์/:/Medical Certificate/);assert.doesNotMatch(extracted,/clinically examined|unfit for work|Scheduled Benzathine penicillin G|ได้ทำการตรวจร่างกาย/);}
  const baseline=`docs/samples/legacy/${type}-${language}.pdf`,legacyLogoHeight=logoHeight(baseline);
  for(let index=1;index<=pageCount;index++){
   const actual=raster(file,`pdf-results/current-${type}-${language}-${index}`,index);
   const header=compare(approvedImage,actual,[0,Math.floor(33*144/25.4)]);
   const mask=(x,y)=>x>=pageLabel.right*2-1&&y>=pageLabel.y*2-2&&y<=pageLabel.bottom*2+2;
   const footer=compare(approvedImage,actual,[Math.ceil((297-30)*144/25.4),actual.height],mask);
   assert.ok(Math.abs(logoHeight(file,index)-legacyLogoHeight)<0.2,'New clinic logo height differs from the legacy height');
   assert.equal(header,0,`${type}-${language} page ${index}: header differs from approved typography`);assert.equal(footer,0,`${type}-${language} page ${index}: footer differs from approved typography`);
  }
  rows.push({type,sample,language,pages:pageCount,searchable:true,approvedLogoPixelsIdentical:true,logoHeightMatchesLegacy:true,logoHeightPoints:Math.round(logoHeight(file)*100)/100,headerMatchesApprovedTypography:true,footerMatchesApprovedTypography:true,signatureMatchesRequestedLayout:true,signatureGapPoints:Math.round(signatureGapPoints*100)/100,nonDestructive:true,sha256:createHash('sha256').update(Buffer.from(bytes)).digest('hex')});console.log(`${sample}-${language}: ${pageCount} pages; approved header/footer, replacement logo height and signature verified`);await context.close();
 }
 writeFileSync('docs/pdf-regression-results.json',JSON.stringify({generatedAt:new Date().toISOString(),printedAt:'2026-10-10T03:00:00Z',samples:rows},null,2)+'\n');
}finally{await browser.close();server.kill();}
