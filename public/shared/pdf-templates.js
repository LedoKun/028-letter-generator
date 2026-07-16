(function () {
    const h = () => window.PdfGenerator.helpers;

    function trim(value) {
        return String(value || '').trim();
    }

    function yes(value) {
        return !!value;
    }

    const MEMO_HEADING = 'บันทึกข้อความ';
    const DEFAULT_RECIPIENT = 'เจ้าหน้าที่ผู้เกี่ยวข้อง';
    const MPOX_SYMPTOM_LABELS = {
        rashLesions: {
            thai: 'ผื่น ตุ่ม หรือแผลบริเวณผิวหนังหรือเยื่อบุ',
            english: 'skin or mucosal lesions'
        },
        feverChills: { thai: 'ไข้หรือหนาวสั่น', english: 'fever or chills' },
        lymphadenopathy: { thai: 'ต่อมน้ำเหลืองโต', english: 'lymphadenopathy' },
        headache: { thai: 'ปวดศีรษะ', english: 'headache' },
        myalgiaBackPain: { thai: 'ปวดกล้ามเนื้อหรือปวดหลัง', english: 'myalgia or back pain' },
        fatigue: { thai: 'อ่อนเพลีย', english: 'fatigue' },
        respiratory: {
            thai: 'เจ็บคอ คัดจมูก หรือไอ',
            english: 'sore throat, nasal congestion, or cough'
        },
        proctitis: {
            thai: 'ปวดบริเวณทวารหนักหรือมีอาการเข้าได้กับ proctitis',
            english: 'rectal pain or proctitis'
        },
        dysuria: { thai: 'ปัสสาวะแสบขัด', english: 'dysuria' },
        other: { thai: 'อาการอื่น ๆ', english: 'other symptoms' }
    };
    const MPOX_RISK_LABELS = {
        directContact: {
            thai: 'สัมผัสใกล้ชิดกับผู้ที่สงสัยว่าเป็น mpox',
            english: 'close contact with a suspected mpox case'
        },
        intimateContact: {
            thai: 'มีเพศสัมพันธ์กับผู้ที่สงสัยว่าเป็น mpox',
            english: 'sexual intercourse with a suspected mpox case'
        },
        sexualPartners: {
            thai: 'มีเพศสัมพันธ์กับคู่นอนหลายราย',
            english: 'sexual intercourse with multiple partners'
        },
        householdCloseContact: {
            thai: 'อาศัยอยู่ร่วมกับผู้ที่สงสัยว่าเป็น mpox',
            english: 'living with a suspected mpox case'
        },
        contaminatedItems: {
            thai: 'ใช้เสื้อผ้า เครื่องนอน ผ้าเช็ดตัว หรือของใช้ส่วนตัวร่วมกับผู้ที่สงสัยว่าเป็น mpox',
            english: 'sharing personal items with a suspected mpox case'
        },
        occupational: {
            thai: 'อาจสัมผัสผู้ที่สงสัยว่าเป็น mpox จากการปฏิบัติงาน',
            english: 'possible work-related contact with a suspected mpox case'
        },
        animal: {
            thai: 'สัมผัสสัตว์ ซากสัตว์ หรือผลิตภัณฑ์จากสัตว์',
            english: 'contact with animals, carcasses, or animal products'
        },
        noneKnown: {
            thai: 'ไม่รายงานข้อมูลความเสี่ยงข้างต้น',
            english: 'none of the listed risk factors reported'
        },
        other: { thai: 'ข้อมูลความเสี่ยงอื่น ๆ', english: 'other risk factors' }
    };

    function withoutTrailingPercent(value) {
        return trim(value).replace(/\s*%+\s*$/, '');
    }

    function memoRecipient(H, recipient, highlight = false) {
        const value = trim(recipient) || DEFAULT_RECIPIENT;
        return highlight
            ? H.para(['เรียน', H.highlight(value)])
            : H.para(`เรียน${value}`);
    }

    function signatureBlock({ thaiName, englishName, license, alignRight = false, medicalOfficer = false, separateGreeting = false }) {
        const H = h();
        const nameParts = [];
        if (trim(thaiName)) nameParts.push(H.highlight(trim(thaiName)));
        if (trim(englishName)) {
            if (nameParts.length) nameParts.push(' / ');
            nameParts.push(H.highlight(trim(englishName).toUpperCase()));
        }
        const stack = separateGreeting
            ? [
                H.para('ขอแสดงความนับถือ', { margin: [0, 12, 0, 0] }),
                H.para('Respectfully,', { margin: [0, 0, 0, 18] })
            ]
            : [H.para('ขอแสดงความนับถือ / Respectfully,', { margin: [0, 12, 0, 18] })];
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
        const content = [H.title(trim(data.documentTitle) || MEMO_HEADING, 14)];
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
        content.push(memoRecipient(H, data.addressee, true));
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
            H.title(MEMO_HEADING, 14),
            H.para([H.bold('Date: '), H.highlight(trim(data.letterDate) || 'N/A')], { alignment: 'right' }),
            memoRecipient(H),
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
            H.title(MEMO_HEADING, 14)
        ];
        if (trim(data.letterDate)) {
            content.push(H.para([H.bold('วันที่ / Date: '), H.highlight(trim(data.letterDate))], { alignment: 'right' }));
        }
        content.push(memoRecipient(H));
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
        if (med && med.toLowerCase() !== 'select medication') nested.push(H.listItem([H.bold('สูตรยาที่ใช้ / Regimen: '), H.highlight(med)]));
        if (trim(startDate)) nested.push(H.listItem([H.bold('เริ่มการรักษาเมื่อ / Treatment started: '), ...H.partialDatePair(trim(startDate))]));
        if (trim(notes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(notes))]));
        return H.listItem(H.bold(title), nested);
    }

    function artMedicationItem(art) {
        const H = h();
        const parts = [H.highlight(trim(art.medication))];
        const tablets = trim(art.tablets);
        const time = trim(art.time);
        if (tablets) parts.push(' ', H.highlight(tablets), ' tab(s)');
        if (time) parts.push(' เวลา ', H.highlight(time));
        else if (tablets) parts.push(' OD');
        return H.listItem(parts);
    }

    function separateLanguageLines(H, thai, english, options = {}) {
        return {
            stack: [
                H.para(thai),
                H.para(english, { margin: [0, 0, 0, 2] })
            ],
            margin: options.margin || [0, 0, 0, 0]
        };
    }

    function medicinePickupLines(data) {
        const H = h();
        const date = trim(data.lastMedicinePickupDate);
        const duration = trim(data.medicineDuration);
        if (date) {
            const thai = ['ผู้ป่วยได้รับยาครั้งล่าสุดเมื่อวันที่ ', ...H.highlightedDatePair(date)];
            const english = ['Last medication pickup: ', ...H.highlightedDatePair(date)];
            if (duration) {
                thai.push(' โดยได้รับยาสำหรับ ', H.highlight(duration), ' วัน');
                english.push('; ', H.highlight(duration), '-day supply');
            }
            return separateLanguageLines(H, thai, english, { margin: [0, 4, 0, 0] });
        }
        if (duration) {
            return separateLanguageLines(
                H,
                ['ผู้ป่วยได้รับยาสำหรับ ', H.highlight(duration), ' วัน'],
                ['Medication supplied for ', H.highlight(duration), ' days'],
                { margin: [0, 4, 0, 0] }
            );
        }
        return null;
    }

    function joinClinicalList(items, language) {
        if (!items.length) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) {
            return language === 'thai'
                ? `${items[0]} และ ${items[1]}`
                : `${items[0]} and ${items[1]}`;
        }
        const finalSeparator = language === 'thai' ? ' และ ' : ', and ';
        return `${items.slice(0, -1).join(', ')}${finalSeparator}${items[items.length - 1]}`;
    }

    function mpoxOptionText(values, labels, language, otherText) {
        if (!Array.isArray(values)) return '';
        const items = values
            .map(value => {
                const label = labels[value];
                if (!label) return '';
                if (value === 'other' && trim(otherText)) {
                    return `${label[language]}: ${trim(otherText)}`;
                }
                return label[language];
            })
            .filter(Boolean);
        return joinClinicalList(items, language);
    }

    function buildReferral(data) {
        const H = h();
        const content = [];
        const letterType = data.letterType || 'summaryOfHistory';
        const letterDateBE = trim(data.letterDate);
        content.push(H.title(MEMO_HEADING, 14));
        if (letterDateBE) content.push(H.para([H.bold('วันที่ / Date: '), ...H.highlightedDatePair(letterDateBE)], { alignment: 'right' }));
        content.push(memoRecipient(H));
        content.push(separateLanguageLines(
            H,
            [H.bold('เรื่อง '), letterType === 'referralForCare' ? 'ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ' : 'สรุปประวัติการรักษา'],
            [H.bold('Re: '), letterType === 'referralForCare' ? 'Referral for continued care' : 'Medical summary']
        ));
        if (letterType === 'referralForCare') {
            content.push(separateLanguageLines(
                H,
                'ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ พร้อมรายละเอียดการรักษาโดยสรุปดังนี้',
                'We are referring this patient for continued care. The relevant clinical details are provided below.',
                { margin: [18, 0, 0, 4] }
            ));
        }
        content.push(H.para([H.bold('ชื่อผู้ป่วย / Patient Name: '), H.highlight(trim(data.patientName))]));
        if (trim(data.dob)) content.push(H.para([H.bold('วันเกิด / Date of Birth: '), ...H.highlightedDatePair(trim(data.dob))]));
        if (trim(data.nationalId)) content.push(H.para([H.bold('เลขประจําตัวประชาชน / National ID: '), H.highlight(trim(data.nationalId))]));
        if (trim(data.passportNumber)) content.push(H.para([H.bold('เลขที่หนังสือเดินทาง / Passport Number: '), H.highlight(trim(data.passportNumber))]));

        const historyItems = [];
        if (yes(data.includeRetroviral)) {
            const nested = [];
            if (trim(data.napId)) nested.push(H.listItem(['NAP-ID: D4-', H.highlight(trim(data.napId))]));
            if (trim(data.firstDiagnosisDateRetro)) nested.push(H.listItem([H.bold('วันที่ได้รับการวินิจฉัยครั้งแรก / First diagnosis date: '), ...H.highlightedDatePair(trim(data.firstDiagnosisDateRetro))]));
            if (trim(data.artStartDate)) nested.push(H.listItem([H.bold('วันที่เริ่ม ART / ART start date: '), ...H.highlightedDatePair(trim(data.artStartDate))]));
            if (trim(data.initialCD4) || trim(data.initialCD4Percent)) {
                const baselineCd4 = [H.bold('CD4 แรกรับ / Initial CD4: ')];
                if (trim(data.initialCD4)) baselineCd4.push(H.highlight(trim(data.initialCD4)), ' cells/mm3');
                if (trim(data.initialCD4Percent)) {
                    if (trim(data.initialCD4)) baselineCd4.push(' (');
                    baselineCd4.push(H.highlight(withoutTrailingPercent(data.initialCD4Percent)), '%');
                    if (trim(data.initialCD4)) baselineCd4.push(')');
                }
                if (trim(data.initialCD4Date)) baselineCd4.push(' ตรวจเมื่อวันที่ ', ...H.highlightedDatePair(trim(data.initialCD4Date)));
                nested.push(H.listItem(baselineCd4));
            }
            if (trim(data.adherence)) nested.push(H.listItem([H.bold('Adherence: '), H.highlight(trim(data.adherence))]));
            if (trim(data.latestVL)) {
                const hivVl = [H.bold('ผลตรวจ HIV VL ล่าสุด / Latest HIV VL: '), H.highlight(trim(data.latestVL)), ' copies/mL'];
                if (trim(data.latestVLDate)) hivVl.push(' ตรวจเมื่อวันที่ ', ...H.highlightedDatePair(trim(data.latestVLDate)));
                nested.push(H.listItem(hivVl));
            }
            if (Array.isArray(data.artMedications) && data.artMedications.length) {
                nested.push(H.listItem(H.bold('สูตรยา ART ปัจจุบัน / Current ART regimen:'), data.artMedications.map(artMedicationItem)));
            }
            if (yes(data.includeTmxSmp) && trim(data.tmxSmpTablets)) nested.push(H.listItem([H.bold('ยาป้องกันการติดเชื้อฉวยโอกาส / OI prophylaxis: '), 'TMX/SMP 80/400 mg ', H.highlight(trim(data.tmxSmpTablets)), ' tab(s) OD']));
            if (trim(data.retroviralNotes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.retroviralNotes))]));
            historyItems.push(H.listItem(H.bold('Retroviral infection'), nested));
        }
        if (yes(data.includeSyphilisActive) && trim(data.syphilisStartDate)) {
            const nested = [
                H.listItem([H.bold('วันที่เริ่มการรักษา / Treatment start date: '), ...H.highlightedDatePair(trim(data.syphilisStartDate))]),
                H.listItem([H.bold('แผนการรักษา / Regimen: '), H.highlight(trim(data.syphilisMedicationText) || 'Benzathine penicillin G 2.4 million units IM')])
            ];
            if (!data.syphilisMedication || data.syphilisMedication === 'Benzathine') {
                nested.push(H.listItem(H.bold('กำหนดการรักษา / Treatment schedule:'), [
                    H.listItem(['Dose 1: ', ...H.highlightedDatePair(trim(data.syphilisDose1Date))]),
                    H.listItem(['Dose 2: ', ...H.highlightedDatePair(trim(data.syphilisDose2Date))]),
                    H.listItem(['Dose 3: ', ...H.highlightedDatePair(trim(data.syphilisDose3Date))])
                ]));
            }
            if (trim(data.syphilisNotes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.syphilisNotes))]));
            historyItems.push(H.listItem(H.bold('Active syphilis'), nested));
        }
        if (yes(data.includeSuspectedMpox)) {
            const nested = [];
            const duration = trim(data.mpoxSymptomDurationDays);
            if (duration) {
                nested.push(H.listItem([
                    H.bold('เริ่มมีอาการ '),
                    H.highlight(duration),
                    ' วันก่อนส่งต่อ',
                    '\n',
                    H.bold('Symptom onset: '),
                    H.highlight(duration),
                    duration === '1' ? ' day before referral' : ' days before referral'
                ]));
            }
            const symptomsThai = mpoxOptionText(data.mpoxSymptoms, MPOX_SYMPTOM_LABELS, 'thai', data.mpoxSymptomOtherText);
            const symptomsEnglish = mpoxOptionText(data.mpoxSymptoms, MPOX_SYMPTOM_LABELS, 'english', data.mpoxSymptomOtherText);
            if (symptomsThai || symptomsEnglish) {
                nested.push(H.listItem([
                    H.bold('อาการสำคัญ: '),
                    H.highlight(symptomsThai),
                    '\n',
                    H.bold('Presenting symptoms: '),
                    H.highlight(symptomsEnglish)
                ]));
            }
            const riskFactors = Array.isArray(data.mpoxRiskFactors) ? data.mpoxRiskFactors : [];
            if (riskFactors.includes('noneKnown')) {
                nested.push(H.listItem([
                    'ผู้ป่วยไม่รายงานข้อมูลความเสี่ยงข้างต้น',
                    '\n',
                    'The patient did not report any of the listed risk factors.'
                ]));
            } else {
                const riskThai = mpoxOptionText(riskFactors, MPOX_RISK_LABELS, 'thai', data.mpoxRiskOtherText);
                const riskEnglish = mpoxOptionText(riskFactors, MPOX_RISK_LABELS, 'english', data.mpoxRiskOtherText);
                if (riskThai || riskEnglish) {
                    nested.push(H.listItem([
                        H.bold('ผู้ป่วยให้ประวัติว่า'),
                        H.highlight(riskThai),
                        '\n',
                        H.bold('The patient reported '),
                        H.highlight(riskEnglish),
                        '.'
                    ]));
                }
            }
            historyItems.push(H.listItem(H.bold('สงสัยโรคฝีดาษวานร / Suspected mpox'), nested));
        }
        if (yes(data.includeHBV)) historyItems.push(H.listItem(H.bold('HBV co-infection')));
        if (yes(data.includeHCVActive)) historyItems.push(H.listItem(H.bold('Untreated HCV co-infection')));
        if (yes(data.includeTreatedSyphilis)) historyItems.push(H.listItem(H.bold('Treated syphilis')));
        if (yes(data.includeTreatedHCV)) {
            const nested = [];
            if (trim(data.treatedHCVMedication)) nested.push(H.listItem([H.bold('สูตรยาที่ใช้ / Regimen: '), H.highlight(trim(data.treatedHCVMedication))]));
            if (trim(data.treatedHCVCompletionDate)) nested.push(H.listItem([H.bold('วันที่รักษาครบ / Completed on: '), ...H.highlightedDatePair(trim(data.treatedHCVCompletionDate))]));
            historyItems.push(H.listItem(H.bold('Treated HCV'), nested));
        }
        if (yes(data.includeTreatedTB)) {
            const nested = [];
            if (trim(data.treatedTBSites)) nested.push(H.listItem([H.bold('ตำแหน่ง / Site(s): '), H.highlight(trim(data.treatedTBSites))]));
            if (trim(data.treatedTBMedication)) nested.push(H.listItem([H.bold('สูตรยาที่ใช้ / Regimen: '), H.highlight(trim(data.treatedTBMedication))]));
            if (trim(data.treatedTBCompletionDate)) nested.push(H.listItem([H.bold('วันที่รักษาครบ / Completed on: '), ...H.highlightedDatePair(trim(data.treatedTBCompletionDate))]));
            historyItems.push(H.listItem(H.bold('Treated TB'), nested));
        }
        if (yes(data.includeCompletedTPT)) historyItems.push(tptSection('Completed TPT', data.completedTPTMedicationText, data.completedTPTMedicationOther, data.completedTPTStartDate, data.completedTPTNotes));
        if (yes(data.includeOngoingTPT)) historyItems.push(tptSection('Ongoing TPT', data.ongoingTPTMedicationText, data.ongoingTPTMedicationOther, data.ongoingTPTStartDate, data.ongoingTPTNotes));
        if (yes(data.includeOtherHistory) && trim(data.otherMedicalHistory)) historyItems.push(H.listItem([H.bold('ประวัติการรักษาอื่น ๆ / Other medical history: '), H.highlight(trim(data.otherMedicalHistory))]));

        if (historyItems.length) {
            content.push(H.sectionTitle('สรุปประวัติการรักษา / Clinical Summary'));
            content.push({ ul: historyItems, margin: [12, 0, 0, 6] });
        }
        if (yes(data.includeLastMedicinePickup)) {
            const pickupLines = medicinePickupLines(data);
            if (pickupLines) content.push(pickupLines);
        }
        const attachments = [];
        if (yes(data.attachmentLabResults)) attachments.push('ผลตรวจล่าสุด / Latest laboratory results');
        if (yes(data.attachmentOther)) attachments.push(trim(data.attachmentOtherText) ? ['เอกสารอื่น / Other: ', H.highlight(trim(data.attachmentOtherText))] : 'เอกสารอื่น / Other documents');
        if (attachments.length) {
            content.push(H.sectionTitle('เอกสารแนบ / Attachments'));
            content.push({ ul: attachments.map(item => H.listItem(item)), margin: [12, 0, 0, 6] });
        }
        if (yes(data.includeReferralForAdmission)) {
            content.push(separateLanguageLines(
                H,
                'จึงขอส่งผู้ป่วยรายนี้เพื่อพิจารณารับไว้รักษาในโรงพยาบาลของท่าน',
                'Hospital admission is requested for further management.'
            ));
        }
        content.push(separateLanguageLines(
            H,
            'หากต้องการข้อมูลเพิ่มเติม สามารถติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรีได้',
            'For further information, contact Public Health Center 28 Krung Thon Buri.',
            { margin: [0, 8, 0, 0] }
        ));
        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense,
            separateGreeting: true
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
