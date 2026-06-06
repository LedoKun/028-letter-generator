(function () {
    const h = () => window.PdfGenerator.helpers;

    function trim(value) {
        return String(value || '').trim();
    }

    function yes(value) {
        return !!value;
    }

    function signatureBlock({ thaiName, englishName, license, alignRight = false, medicalOfficer = false }) {
        const H = h();
        const nameParts = [];
        if (trim(thaiName)) nameParts.push(H.highlight(trim(thaiName)));
        if (trim(englishName)) {
            if (nameParts.length) nameParts.push(' / ');
            nameParts.push(H.highlight(trim(englishName).toUpperCase()));
        }
        const stack = [
            H.para('ขอแสดงความนับถือ / Respectfully,', { margin: [0, 12, 0, 18] })
        ];
        if (nameParts.length) {
            stack.push(H.para(['(', ...nameParts, ')'], { alignment: alignRight ? 'right' : 'left' }));
            if (medicalOfficer) stack.push(H.para('แพทย์ / Medical Officer', { alignment: alignRight ? 'right' : 'left' }));
        }
        if (trim(license)) {
            stack.push(H.para([H.bold('เลขที่ใบประกอบวิชาชีพ / Medical License No.: '), H.highlight(trim(license))], { alignment: alignRight ? 'right' : 'left' }));
        }
        stack.push(H.para('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี / Public Health Center 28 Krung Thon Buri', { alignment: alignRight ? 'right' : 'left' }));
        return { stack, margin: [0, 6, 0, 0] };
    }

    function buildFreeForm(data) {
        const H = h();
        const content = [H.title(trim(data.documentTitle) || 'LETTER', 14)];
        const letterDate = trim(data.letterDate);
        if (letterDate) {
            const converted = data._yearEra === 'BE' ? H.convertBEtoCE(letterDate) : H.convertCEtoBE(letterDate);
            content.push(H.para([
                H.bold('วันที่ / Date: '),
                H.highlight(letterDate),
                converted ? ' (' : '',
                converted ? H.highlight(converted) : '',
                converted ? ')' : ''
            ], { alignment: 'right' }));
        }
        if (trim(data.addressee)) {
            content.push(H.para([H.bold('ถึง / To: '), H.highlight(trim(data.addressee))]));
        }
        content.push({
            text: H.text(trim(data.letterBody)).text,
            preserveLeadingSpaces: true,
            margin: [0, 8, 0, 10],
            alignment: 'justify'
        });
        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense
        }));
        return content;
    }

    function buildMedicationCertificate(data) {
        const H = h();
        let fullName = '';
        if (trim(data.salutation)) fullName += `${trim(data.salutation)} `;
        fullName += trim(data.patientName) || 'PATIENT NAME N/A';

        const meds = (data.includeMedications && Array.isArray(data.artMedications) && data.artMedications.length)
            ? data.artMedications.map(item => H.highlight(trim(item.medication).toUpperCase()))
            : [H.highlight('None specified')];

        const content = [
            H.title('Certificate for Carrying Medications', 15),
            H.para([H.bold('Date: '), H.highlight(trim(data.letterDate) || 'N/A')], { alignment: 'right' }),
            H.para('To Whom It May Concern:'),
            H.para([
                H.highlight(fullName.toUpperCase()),
                ', a ',
                H.highlight((trim(data.nationality) || 'NATIONALITY N/A').toUpperCase()),
                ' national',
                trim(data.passportNumber) ? ', holding passport number ' : '',
                trim(data.passportNumber) ? H.highlight(trim(data.passportNumber).toUpperCase()) : '',
                ', born on ',
                H.highlight(trim(data.dob) || 'N/A'),
                ', is currently under the care of Public Health Center 28 Krung Thon Buri. The patient requires ongoing medication for treatment and continuity of care.'
            ]),
            H.para('This certificate confirms that the patient is required to carry the following medications for personal use.'),
            H.para(H.bold('Current Medication(s):')),
            { ul: meds, margin: [14, 2, 0, 8] },
            H.para('Respectfully,', { margin: [0, 12, 0, 18] }),
            H.para([
                H.highlight((trim(data.doctorNameEnglish) || 'DOCTOR NAME N/A').toUpperCase()),
                '\nThai Medical License Number: ',
                H.highlight(trim(data.medicalLicense) || 'N/A'),
                '\nPublic Health Center 28 Krung Thon Buri'
            ])
        ];
        if (trim(data.additionalNotes)) {
            content.push(H.para([H.bold('Additional notes / Remarks: '), H.highlight(trim(data.additionalNotes))], { margin: [0, 8, 0, 0] }));
        }
        return content;
    }

    function buildMedicalCertificate(data) {
        const H = h();
        const content = [
            H.title('ใบรับรองแพทย์ / Medical Certificate', 15)
        ];
        if (trim(data.letterDate)) {
            content.push(H.para([H.bold('วันที่ / Date: '), H.highlight(trim(data.letterDate))], { alignment: 'right' }));
        }
        content.push(H.para('ขอรับรองว่า / This is to certify that:'));

        const patientLines = [];
        const salutationParts = [];
        if (trim(data.patientSalutation)) salutationParts.push(H.highlight(trim(data.patientSalutation)));
        if (trim(data.patientSalutationEnglish)) {
            if (salutationParts.length) salutationParts.push(' / ');
            salutationParts.push(H.highlight(trim(data.patientSalutationEnglish)));
        }
        if (trim(data.patientName)) {
            patientLines.push(H.para([H.bold('ชื่อ-นามสกุล / Full Name: '), ...salutationParts, salutationParts.length ? ' ' : '', H.highlight(trim(data.patientName))]));
        }
        const genderAge = [];
        if (trim(data.patientGender) || trim(data.patientGenderEnglish)) {
            genderAge.push(H.bold('เพศ / Sex: '));
            if (trim(data.patientGender)) genderAge.push(H.highlight(trim(data.patientGender)));
            if (trim(data.patientGenderEnglish)) genderAge.push(trim(data.patientGender) ? ' / ' : '', H.highlight(trim(data.patientGenderEnglish)));
        }
        if (trim(data.patientAge)) {
            if (genderAge.length) genderAge.push('    ');
            genderAge.push(H.bold('อายุ / Age: '), H.highlight(trim(data.patientAge)), ' ปี / Years');
        }
        if (genderAge.length) patientLines.push(H.para(genderAge));
        if (trim(data.nationalIdNumber)) patientLines.push(H.para([H.bold('เลขที่บัตรประจำตัวประชาชน / National ID Number: '), H.highlight(trim(data.nationalIdNumber))]));
        if (trim(data.passportNumber)) patientLines.push(H.para([H.bold('เลขที่หนังสือเดินทาง / Passport Number: '), H.highlight(trim(data.passportNumber))]));
        if (patientLines.length) content.push({ stack: patientLines, margin: [12, 0, 0, 6] });

        if (yes(data.includeConsultationDiagnosis)) {
            if (trim(data.consultationDate)) content.push(H.para([H.bold('เข้ารับการตรวจรักษาเมื่อวันที่ / Examined and treated on: '), H.highlight(trim(data.consultationDate))]));
            if (trim(data.diagnosis)) content.push(H.para([H.bold('การวินิจฉัยโรค / Diagnosis: '), H.highlight(trim(data.diagnosis))]));
        }
        if (yes(data.includeAdvisedRest) && trim(data.restStartDate) && trim(data.restEndDate) && trim(data.restDurationDays)) {
            content.push(H.para(H.bold('คำแนะนำ / Medical Advice:')));
            content.push({
                stack: [
                    H.para(['สมควรพักรักษาตัวตั้งแต่วันที่ / Advised to rest from: ', H.highlight(trim(data.restStartDate))]),
                    H.para(['ถึงวันที่ / Until: ', H.highlight(trim(data.restEndDate))]),
                    H.para(['รวมระยะเวลา / Total duration: ', H.highlight(trim(data.restDurationDays)), ' วัน / day(s).']),
                    trim(data.advisedRestNotes) ? H.para([H.bold('หมายเหตุ / Notes: '), H.highlight(trim(data.advisedRestNotes))]) : ''
                ].filter(Boolean),
                margin: [12, 0, 0, 4]
            });
        }
        if (yes(data.includeSyphilisTreatment) && trim(data.syphilisTreatmentDate)) {
            content.push(H.para(['ผู้ป่วยได้รับการรักษาโรคซิฟิลิสเมื่อวันที่ / The patient received treatment for syphilis on ', H.highlight(trim(data.syphilisTreatmentDate)), '.']));
            if (trim(data.syphilisNotes)) content.push(H.para(H.highlight(trim(data.syphilisNotes)), { margin: [12, 0, 0, 4] }));
        }
        if (yes(data.includeTBTreatment) && trim(data.tbTreatmentCompletionDate)) {
            content.push(H.para(['ผู้ป่วยรักษาวัณโรคเสร็จสิ้นเมื่อวันที่ / The patient completed tuberculosis treatment on ', H.highlight(trim(data.tbTreatmentCompletionDate)), '.']));
            if (trim(data.tbNotes)) content.push(H.para(H.highlight(trim(data.tbNotes)), { margin: [12, 0, 0, 4] }));
        }
        if (yes(data.includeDoctorComment) && trim(data.doctorComment)) {
            content.push(H.para([H.bold('หมายเหตุเพิ่มเติม / Additional Notes: '), H.highlight(trim(data.doctorComment))]));
        }
        content.push({
            stack: [
                H.para('ลงชื่อ / Signature ______________________________', { alignment: 'right', margin: [0, 12, 0, 18] }),
                {
                    stack: [
                        trim(data.doctorNameThai) || trim(data.doctorNameEnglish)
                            ? H.para([
                                '(',
                                trim(data.doctorNameThai) ? H.highlight(trim(data.doctorNameThai)) : '',
                                trim(data.doctorNameThai) && trim(data.doctorNameEnglish) ? ' / ' : '',
                                trim(data.doctorNameEnglish) ? H.highlight(trim(data.doctorNameEnglish).toUpperCase()) : '',
                                ')'
                            ], { alignment: 'right' })
                            : '',
                        trim(data.doctorNameThai) || trim(data.doctorNameEnglish) ? H.para('แพทย์ / Medical Officer', { alignment: 'right' }) : '',
                        trim(data.medicalLicense) ? H.para([H.bold('เลขที่ใบประกอบวิชาชีพ / Medical License No.: '), H.highlight(trim(data.medicalLicense))], { alignment: 'right' }) : '',
                        H.para('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี / Public Health Center 28 Krung Thon Buri', { alignment: 'right' })
                    ].filter(Boolean)
                }
            ]
        });
        return content;
    }

    function tptSection(title, medicationText, otherMedication, startDate, notes) {
        const H = h();
        let med = trim(medicationText);
        if (med.toLowerCase() === 'other' && trim(otherMedication)) med = trim(otherMedication);
        const nested = [];
        if (med && med.toLowerCase() !== 'select medication') nested.push(H.listItem([H.bold('ยาที่ใช้รักษา / Medication: '), H.highlight(med)]));
        if (trim(startDate)) nested.push(H.listItem([H.bold('เริ่มการรักษาเมื่อ / Started on: '), ...H.partialDatePair(trim(startDate))]));
        if (trim(notes)) nested.push(H.listItem([H.bold('บันทึกทางการแพทย์ / Medical notes: '), H.highlight(trim(notes))]));
        return H.listItem(H.bold(title), nested);
    }

    function buildReferral(data) {
        const H = h();
        const content = [];
        const letterType = data.letterType || 'summaryOfHistory';
        const letterDateBE = trim(data.letterDate);
        const letterTitle = letterType === 'referralForCare'
            ? 'หนังสือส่งตัวผู้ป่วย / Referral Letter'
            : 'สรุปประวัติการรักษา / Summary of Medical History';
        content.push(H.title(letterTitle, 14));
        if (letterDateBE) content.push(H.para([H.bold('วันที่ / Date: '), ...H.highlightedDatePair(letterDateBE)], { alignment: 'right' }));
        content.push(H.para([H.bold('เรียน / To: '), 'ผู้เกี่ยวข้อง / To Whom It May Concern']));
        content.push(H.para([H.bold('เรื่อง / Re: '), letterType === 'referralForCare' ? 'ขอส่งตัวผู้ป่วยเพื่อรับการรักษาต่อเนื่อง / Referral for continuing care' : 'สรุปประวัติการรักษา / Summary of medical history']));
        if (letterType === 'referralForCare') {
            content.push(H.para('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งตัวผู้ป่วยรายนี้เพื่อรับการดูแลรักษาต่อเนื่อง / Public Health Center 28 Krung Thon Buri respectfully refers the following patient for continuing care:', { margin: [18, 0, 0, 4] }));
        }
        content.push(H.para([H.bold('ชื่อผู้ป่วย / Patient Name: '), H.highlight(trim(data.patientName))]));
        if (trim(data.dob)) content.push(H.para([H.bold('วันเกิด / Date of birth: '), ...H.highlightedDatePair(trim(data.dob))]));
        if (trim(data.nationalId)) content.push(H.para([H.bold('เลขประจําตัวประชาชน / National ID: '), H.highlight(trim(data.nationalId))]));
        if (trim(data.passportNumber)) content.push(H.para([H.bold('เลขที่หนังสือเดินทาง / Passport Number: '), H.highlight(trim(data.passportNumber))]));

        const historyItems = [];
        if (yes(data.includeRetroviral)) {
            const nested = [];
            if (trim(data.napId)) nested.push(H.listItem(['NAP-ID: D4-', H.highlight(trim(data.napId))]));
            if (trim(data.firstDiagnosisDateRetro)) nested.push(H.listItem([H.bold('วันที่วินิจฉัยครั้งแรก / First diagnosis date: '), ...H.highlightedDatePair(trim(data.firstDiagnosisDateRetro))]));
            if (trim(data.artStartDate)) nested.push(H.listItem([H.bold('วันที่เริ่มยาต้านไวรัส / ART start date: '), ...H.highlightedDatePair(trim(data.artStartDate))]));
            if (trim(data.initialCD4)) nested.push(H.listItem([H.bold('ค่า CD4 แรกรับ / Initial CD4: '), H.highlight(trim(data.initialCD4)), ' cell/mm3', trim(data.initialCD4Date) ? ' - ' : '', ...(trim(data.initialCD4Date) ? H.highlightedDatePair(trim(data.initialCD4Date)) : [])]));
            if (trim(data.initialCD4Percent)) nested.push(H.listItem([H.bold('ร้อยละ CD4 แรกรับ / Initial CD4 percentage: '), H.highlight(trim(data.initialCD4Percent)), '%', trim(data.initialCD4Date) ? ' - ' : '', ...(trim(data.initialCD4Date) ? H.highlightedDatePair(trim(data.initialCD4Date)) : [])]));
            if (trim(data.adherence)) nested.push(H.listItem([H.bold('Adherence: '), H.highlight(trim(data.adherence))]));
            if (trim(data.latestVL)) nested.push(H.listItem([H.bold('Latest VL: '), H.highlight(trim(data.latestVL)), ' copies/mL', trim(data.latestVLDate) ? ' - ' : '', ...(trim(data.latestVLDate) ? H.highlightedDatePair(trim(data.latestVLDate)) : [])]));
            if (Array.isArray(data.artMedications) && data.artMedications.length) {
                nested.push(H.listItem(H.bold('ยาต้านไวรัส / ART medications:'), data.artMedications.map(art => H.listItem([H.highlight(trim(art.medication)), ' ', H.highlight(trim(art.tablets)), ' tablet(s) ', art.time ? ['at ', H.highlight(trim(art.time))] : 'once every 24 hours'].flat()))));
            }
            if (yes(data.includeTmxSmp) && trim(data.tmxSmpTablets)) nested.push(H.listItem(H.bold('ยาป้องกันโรคติดเชื้อฉวยโอกาส / Prophylaxis:'), [H.listItem(['TMX/SMP (80mg/400mg) ', H.highlight(trim(data.tmxSmpTablets)), ' tablet(s) OD'])]));
            if (trim(data.retroviralNotes)) nested.push(H.listItem([H.bold('บันทึกทางการแพทย์ / Medical notes: '), H.highlight(trim(data.retroviralNotes))]));
            historyItems.push(H.listItem(H.bold('Retroviral Infection'), nested));
        }
        if (yes(data.includeSyphilisActive) && trim(data.syphilisStartDate)) {
            const nested = [
                H.listItem([H.bold('วันที่เริ่มการรักษา / Treatment start date: '), ...H.highlightedDatePair(trim(data.syphilisStartDate))]),
                H.listItem([H.bold('ยาที่ใช้รักษา / Medication: '), H.highlight(trim(data.syphilisMedicationText) || 'Benzathine Penicillin G 2.4 million units IM')])
            ];
            if (!data.syphilisMedication || data.syphilisMedication === 'Benzathine') {
                nested.push(H.listItem(H.bold('กำหนดการรักษา / Treatment schedule:'), [
                    H.listItem(['ครั้งที่ 1 / Dose 1: ', ...H.highlightedDatePair(trim(data.syphilisDose1Date))]),
                    H.listItem(['ครั้งที่ 2 / Dose 2: ', ...H.highlightedDatePair(trim(data.syphilisDose2Date))]),
                    H.listItem(['ครั้งที่ 3 / Dose 3: ', ...H.highlightedDatePair(trim(data.syphilisDose3Date))])
                ]));
            } else if (trim(data.syphilisDuration)) {
                nested.push(H.listItem([H.bold('ระยะเวลาการรักษา / Treatment duration: '), H.highlight(trim(data.syphilisDuration))]));
            }
            if (trim(data.syphilisNotes)) nested.push(H.listItem([H.bold('บันทึกทางการแพทย์ / Medical notes: '), H.highlight(trim(data.syphilisNotes))]));
            historyItems.push(H.listItem(H.bold('Syphilis (Active)'), nested));
        }
        if (yes(data.includeTreatedHCV)) {
            const nested = [];
            if (trim(data.treatedHCVMedication)) nested.push(H.listItem([H.bold('ยาที่ใช้รักษา / Medication: '), H.highlight(trim(data.treatedHCVMedication))]));
            if (trim(data.treatedHCVCompletionDate)) nested.push(H.listItem([H.bold('รักษาครบเมื่อวันที่ / Treatment completed on: '), ...H.highlightedDatePair(trim(data.treatedHCVCompletionDate))]));
            historyItems.push(H.listItem(H.bold('Treated HCV'), nested));
        }
        if (yes(data.includeTreatedTB)) {
            const nested = [];
            if (trim(data.treatedTBSites)) nested.push(H.listItem([H.bold('ตำแหน่งโรค / Disease site(s): '), H.highlight(trim(data.treatedTBSites))]));
            if (trim(data.treatedTBMedication)) nested.push(H.listItem([H.bold('Medication: '), H.highlight(trim(data.treatedTBMedication))]));
            if (trim(data.treatedTBCompletionDate)) nested.push(H.listItem([H.bold('รักษาครบเมื่อวันที่ / Treatment completed on: '), ...H.highlightedDatePair(trim(data.treatedTBCompletionDate))]));
            historyItems.push(H.listItem(H.bold('Treated TB'), nested));
        }
        if (yes(data.includeCompletedTPT)) historyItems.push(tptSection('TPT ครบแล้ว / Completed TPT', data.completedTPTMedicationText, data.completedTPTMedicationOther, data.completedTPTStartDate, data.completedTPTNotes));
        if (yes(data.includeOngoingTPT)) historyItems.push(tptSection('อยู่ระหว่าง TPT / Ongoing TPT', data.ongoingTPTMedicationText, data.ongoingTPTMedicationOther, data.ongoingTPTStartDate, data.ongoingTPTNotes));
        if (yes(data.includeOtherHistory) && trim(data.otherMedicalHistory)) historyItems.push(H.listItem([H.bold('ประวัติการรักษาอื่น ๆ / Other medical history: '), H.highlight(trim(data.otherMedicalHistory))]));

        if (historyItems.length) {
            content.push(H.sectionTitle('ประวัติการรักษาโดยสรุป / Summary of Medical History'));
            content.push({ ul: historyItems, margin: [12, 0, 0, 6] });
        }
        if (yes(data.includeLastMedicinePickup) && trim(data.lastMedicinePickupDate)) {
            content.push(H.para(['ผู้ป่วยได้รับยาครั้งล่าสุดเมื่อวันที่ / The patient last collected medication on: ', ...H.highlightedDatePair(trim(data.lastMedicinePickupDate)), trim(data.medicineDuration) ? ' สำหรับ / for ' : '', trim(data.medicineDuration) ? H.highlight(trim(data.medicineDuration)) : '', trim(data.medicineDuration) ? ' วัน / days' : '']));
        } else if (yes(data.includeLastMedicinePickup) && trim(data.medicineDuration)) {
            content.push(H.para(['ผู้ป่วยได้รับยาสำหรับ / The patient received medication for ', H.highlight(trim(data.medicineDuration)), ' วัน / days']));
        }
        const attachments = [];
        if (yes(data.attachmentLabResults)) attachments.push('ผลตรวจทางห้องปฏิบัติการล่าสุด / Latest laboratory results');
        if (yes(data.attachmentOther)) attachments.push(trim(data.attachmentOtherText) ? ['เอกสารอื่น ๆ / Other document(s): ', H.highlight(trim(data.attachmentOtherText))] : 'เอกสารอื่น ๆ / Other document(s)');
        if (attachments.length) {
            content.push(H.sectionTitle('เอกสารแนบ / Attachments:'));
            content.push({ ul: attachments.map(item => H.listItem(item)), margin: [12, 0, 0, 6] });
        }
        if (yes(data.includeReferralForAdmission)) {
            content.push(H.para('จึงเรียนมาเพื่อโปรดพิจารณารับผู้ป่วยรายนี้เข้ารับการรักษาในโรงพยาบาลของท่าน / We would be grateful if you would consider admitting this patient for further hospital care.'));
        }
        content.push(H.para('กรุณาติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรี หากต้องการข้อมูลเพิ่มเติม / Please contact Public Health Center 28 Krung Thon Buri if further information is required.', { margin: [0, 8, 0, 0] }));
        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense
        }));
        if (trim(data.additionalNotes)) {
            content.push(H.para([H.bold('หมายเหตุเพิ่มเติม / Additional Notes: '), H.highlight(trim(data.additionalNotes))], { margin: [0, 8, 0, 0] }));
        }
        return content;
    }

    window.PdfTemplates = {
        buildFreeForm,
        buildMedicationCertificate,
        buildMedicalCertificate,
        buildReferral
    };
})();
