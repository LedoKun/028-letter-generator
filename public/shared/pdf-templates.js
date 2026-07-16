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
            thai: 'ไม่ให้ประวัติความเสี่ยงตามรายการข้างต้น',
            english: 'none of the listed risk factors reported'
        },
        other: { thai: 'ข้อมูลความเสี่ยงอื่น ๆ', english: 'other risk factors' }
    };
    const TB_SITE_LABELS = {
        Pulmonary: { thai: 'ปอด', english: 'pulmonary' },
        'Lymph nodes': { thai: 'ต่อมน้ำเหลือง', english: 'lymph nodes' },
        Pleural: { thai: 'เยื่อหุ้มปอด', english: 'pleural' },
        Bone: { thai: 'กระดูก', english: 'bone' },
        Meningeal: { thai: 'เยื่อหุ้มสมอง', english: 'meningeal' },
        Disseminated: { thai: 'ชนิดแพร่กระจาย', english: 'disseminated' }
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
        const patientName = fullName.toUpperCase();
        const nationality = (trim(data.nationality) || 'NATIONALITY N/A').toUpperCase();
        const passportNumber = trim(data.passportNumber).toUpperCase();
        const dobCE = trim(data.dob) || 'N/A';
        const dobBE = H.convertCEtoBE(dobCE) || dobCE;

        const meds = (data.includeMedications && Array.isArray(data.artMedications) && data.artMedications.length)
            ? data.artMedications.map(item => H.highlight(trim(item.medication).toUpperCase()))
            : [H.text('ไม่ได้ระบุรายการยา / None specified')];

        const content = [
            H.title(MEMO_HEADING, 14)
        ];
        content.push(separateCeDateLines(
            H,
            'วันที่',
            'Date',
            trim(data.letterDate) || 'N/A',
            { alignment: 'right' }
        ));
        content.push(memoRecipient(H));

        const thaiIdentity = [
            'ขอรับรองว่า ',
            H.highlight(patientName),
            ' สัญชาติ ',
            H.highlight(nationality)
        ];
        const englishIdentity = [
            'This is to certify that ',
            H.highlight(patientName),
            ', a ',
            H.highlight(nationality),
            ' national'
        ];
        if (passportNumber) {
            thaiIdentity.push(' เลขที่หนังสือเดินทาง ', H.highlight(passportNumber));
            englishIdentity.push(', passport no. ', H.highlight(passportNumber));
        }
        thaiIdentity.push(
            ' เกิดเมื่อวันที่ ',
            H.highlight(dobBE),
            ' อยู่ระหว่างการดูแลรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี'
        );
        englishIdentity.push(
            ', born on ',
            H.highlight(dobCE),
            ', is under the care of Public Health Center 28 Krung Thon Buri.'
        );
        content.push(separateLanguageLines(H, thaiIdentity, englishIdentity));
        content.push(separateLanguageLines(
            H,
            'ผู้ป่วยจำเป็นต้องนำยารายการต่อไปนี้ติดตัวเพื่อใช้ในการรักษาระหว่างการเดินทาง',
            'The patient is required to carry the following medications for personal use during travel.'
        ));
        content.push(H.sectionTitle('รายการยาปัจจุบัน / Current Medications'));
        content.push({ ul: meds.map(item => H.listItem(item)), margin: [14, 2, 0, 8] });
        if (trim(data.additionalNotes)) {
            content.push(H.para([H.bold('หมายเหตุเพิ่มเติม / Additional notes: '), H.highlight(trim(data.additionalNotes))], { margin: [0, 8, 0, 0] }));
        }
        content.push(signatureBlock({
            englishName: trim(data.doctorNameEnglish) || 'DOCTOR NAME N/A',
            license: trim(data.medicalLicense) || 'N/A',
            alignRight: true,
            medicalOfficer: true,
            separateGreeting: true
        }));
        return content;
    }

    function buildMedicalCertificate(data) {
        const H = h();
        const content = [H.title(MEMO_HEADING, 14)];
        if (trim(data.letterDate)) {
            content.push(separateCeDateLines(H, 'วันที่', 'Date', trim(data.letterDate), { alignment: 'right' }));
        }
        content.push(memoRecipient(H));
        content.push(separateLanguageLines(H, 'ขอรับรองว่า', 'This is to certify that:'));

        const thaiName = [];
        const englishName = [];
        if (trim(data.patientSalutation)) thaiName.push(H.highlight(trim(data.patientSalutation)), ' ');
        if (trim(data.patientSalutationEnglish)) englishName.push(H.highlight(trim(data.patientSalutationEnglish)), ' ');
        if (trim(data.patientName)) {
            thaiName.push(H.highlight(trim(data.patientName)));
            englishName.push(H.highlight(trim(data.patientName)));
            content.push(separateLanguageLines(
                H,
                [H.bold('ชื่อ-นามสกุล: '), ...thaiName],
                [H.bold('Full name: '), ...englishName],
                { margin: [12, 0, 0, 0] }
            ));
        }
        const thaiGenderAge = [];
        const englishGenderAge = [];
        if (trim(data.patientGender) || trim(data.patientGenderEnglish)) {
            thaiGenderAge.push(H.bold('เพศ: '), H.highlight(trim(data.patientGender) || trim(data.patientGenderEnglish)));
            englishGenderAge.push(H.bold('Sex: '), H.highlight(trim(data.patientGenderEnglish) || trim(data.patientGender)));
        }
        if (trim(data.patientAge)) {
            if (thaiGenderAge.length) thaiGenderAge.push('    ');
            if (englishGenderAge.length) englishGenderAge.push('    ');
            thaiGenderAge.push(H.bold('อายุ: '), H.highlight(trim(data.patientAge)), ' ปี');
            englishGenderAge.push(H.bold('Age: '), H.highlight(trim(data.patientAge)), ' years');
        }
        if (thaiGenderAge.length || englishGenderAge.length) {
            content.push(separateLanguageLines(H, thaiGenderAge, englishGenderAge, { margin: [12, 0, 0, 0] }));
        }
        if (trim(data.nationalIdNumber)) {
            content.push(separateLanguageLines(
                H,
                [H.bold('เลขประจำตัวประชาชน: '), H.highlight(trim(data.nationalIdNumber))],
                [H.bold('National ID: '), H.highlight(trim(data.nationalIdNumber))],
                { margin: [12, 0, 0, 0] }
            ));
        }
        if (trim(data.passportNumber)) {
            content.push(separateLanguageLines(
                H,
                [H.bold('เลขที่หนังสือเดินทาง: '), H.highlight(trim(data.passportNumber))],
                [H.bold('Passport no.: '), H.highlight(trim(data.passportNumber))],
                { margin: [12, 0, 0, 4] }
            ));
        }

        if (yes(data.includeConsultationDiagnosis)) {
            if (trim(data.consultationDate)) {
                const dateCE = trim(data.consultationDate);
                content.push(separateLanguageLines(
                    H,
                    ['ผู้ป่วยเข้ารับการตรวจรักษาเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE)],
                    ['The patient was examined on ', H.highlight(dateCE), '.']
                ));
            }
            if (trim(data.diagnosis)) {
                content.push(separateLanguageLines(
                    H,
                    ['ได้รับการวินิจฉัยว่า ', H.highlight(trim(data.diagnosis))],
                    ['Diagnosis: ', H.highlight(trim(data.diagnosis)), '.']
                ));
            }
        }
        if (yes(data.includeAdvisedRest) && trim(data.restStartDate) && trim(data.restEndDate) && trim(data.restDurationDays)) {
            const startCE = trim(data.restStartDate);
            const endCE = trim(data.restEndDate);
            content.push(separateLanguageLines(
                H,
                [
                    'มีความเห็นว่าควรพักรักษาตัวตั้งแต่วันที่ ',
                    H.highlight(H.convertCEtoBE(startCE) || startCE),
                    ' ถึงวันที่ ',
                    H.highlight(H.convertCEtoBE(endCE) || endCE),
                    ' รวม ',
                    H.highlight(trim(data.restDurationDays)),
                    ' วัน'
                ],
                [
                    'Medical leave is advised from ',
                    H.highlight(startCE),
                    ' to ',
                    H.highlight(endCE),
                    ' (',
                    H.highlight(trim(data.restDurationDays)),
                    trim(data.restDurationDays) === '1' ? ' day).' : ' days).'
                ]
            ));
            if (trim(data.advisedRestNotes)) {
                content.push(H.para([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.advisedRestNotes))], { margin: [12, 0, 0, 4] }));
            }
        }
        if (yes(data.includeSyphilisTreatment) && trim(data.syphilisTreatmentDate)) {
            const dateCE = trim(data.syphilisTreatmentDate);
            content.push(separateLanguageLines(
                H,
                ['ผู้ป่วยได้รับการรักษาซิฟิลิสเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE)],
                ['The patient received syphilis treatment on ', H.highlight(dateCE), '.']
            ));
            if (trim(data.syphilisNotes)) {
                content.push(H.para([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.syphilisNotes))], { margin: [12, 0, 0, 4] }));
            }
        }
        if (yes(data.includeTBTreatment) && trim(data.tbTreatmentCompletionDate)) {
            const dateCE = trim(data.tbTreatmentCompletionDate);
            content.push(separateLanguageLines(
                H,
                ['ผู้ป่วยได้รับการรักษาวัณโรคครบถ้วนเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE)],
                ['The patient completed TB treatment on ', H.highlight(dateCE), '.']
            ));
            if (trim(data.tbNotes)) {
                content.push(H.para([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.tbNotes))], { margin: [12, 0, 0, 4] }));
            }
        }
        if (yes(data.includeDoctorComment) && trim(data.doctorComment)) {
            content.push(H.para([H.bold('ความเห็นแพทย์ / Physician comment: '), H.highlight(trim(data.doctorComment))]));
        }
        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense,
            alignRight: true,
            medicalOfficer: true,
            separateGreeting: true
        }));
        return content;
    }

    function tptSection(thaiTitle, englishTitle, medicationText, otherMedication, startDate, notes) {
        const H = h();
        let med = trim(medicationText);
        if (med.toLowerCase() === 'other' && trim(otherMedication)) med = trim(otherMedication);
        const nested = [];
        if (med && !/^select (medication|regimen)$/i.test(med)) {
            nested.push(pairedDetail(
                H,
                [H.bold('สูตรยา TPT: '), H.highlight(med)],
                [H.bold('TPT regimen: '), H.highlight(med)]
            ));
        }
        if (trim(startDate)) {
            nested.push(pairedDateDetail(H, 'เดือน/ปีที่เริ่ม TPT', 'TPT start month', trim(startDate), true));
        }
        if (trim(notes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(notes))]));
        return H.listItem(H.bold(`${thaiTitle} / ${englishTitle}`), nested);
    }

    function artMedicationItem(art) {
        const H = h();
        const thai = [H.highlight(trim(art.medication))];
        const english = [H.highlight(trim(art.medication))];
        const tablets = trim(art.tablets);
        const time = trim(art.time);
        if (tablets) {
            thai.push(' ', H.highlight(tablets), ' เม็ด');
            english.push(' ', H.highlight(tablets), tablets === '1' ? ' tablet' : ' tablets');
        }
        if (time) {
            thai.push(' เวลา ', H.highlight(time), ' น.');
            english.push(' at ', H.highlight(time));
        } else if (tablets) {
            thai.push(' วันละ 1 ครั้ง');
            english.push(' once daily');
        }
        return pairedDetail(H, thai, english);
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

    function asParts(value) {
        return Array.isArray(value) ? value : [value];
    }

    function pairedDetail(H, thai, english, nested = []) {
        return H.listItem([
            ...asParts(thai),
            '\n',
            ...asParts(english)
        ], nested);
    }

    function pairedDateDetail(H, thaiLabel, englishLabel, beDate, partial = false) {
        const date = trim(beDate);
        const ceDate = partial ? H.convertPartialBEtoCE(date) : H.convertBEtoCE(date);
        return pairedDetail(
            H,
            [H.bold(`${thaiLabel}: `), H.highlight(date)],
            [H.bold(`${englishLabel}: `), H.highlight(ceDate || date)]
        );
    }

    function separateCeDateLines(H, thaiLabel, englishLabel, ceDate, options = {}) {
        const date = trim(ceDate);
        const beDate = H.convertCEtoBE(date);
        return separateLanguageLines(
            H,
            [H.bold(`${thaiLabel}: `), H.highlight(beDate || date)],
            [H.bold(`${englishLabel}: `), H.highlight(date)],
            options
        );
    }

    function medicinePickupLines(data) {
        const H = h();
        const date = trim(data.lastMedicinePickupDate);
        const duration = trim(data.medicineDuration);
        if (date) {
            const ceDate = H.convertBEtoCE(date);
            const thai = ['ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ ', H.highlight(date)];
            const english = ['Last medication pickup: ', H.highlight(ceDate || date)];
            if (duration) {
                thai.push(' พร้อมยาสำหรับใช้ต่อเนื่องอีก ', H.highlight(duration), ' วัน');
                english.push('; ', H.highlight(duration), '-day supply');
            }
            return separateLanguageLines(H, thai, english, { margin: [0, 4, 0, 0] });
        }
        if (duration) {
            return separateLanguageLines(
                H,
                ['มียาสำหรับใช้ต่อเนื่องอีก ', H.highlight(duration), ' วัน'],
                [H.highlight(duration), '-day medication supply'],
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

    function tbSiteText(data, language) {
        const selected = Array.isArray(data.treatedTBSiteValues)
            ? data.treatedTBSiteValues
            : trim(data.treatedTBSites).split(',').map(value => value.trim()).filter(Boolean);
        const items = selected.map(value => {
            const label = TB_SITE_LABELS[value];
            return label ? label[language] : value;
        });
        const otherSites = trim(data.treatedTBSitesOther);
        if (otherSites) items.push(otherSites);
        return joinClinicalList(items, language);
    }

    function buildReferral(data) {
        const H = h();
        const content = [];
        const letterType = data.letterType || 'summaryOfHistory';
        const letterDateBE = trim(data.letterDate);
        content.push(H.title(MEMO_HEADING, 14));
        if (letterDateBE) {
            content.push(separateLanguageLines(
                H,
                [H.bold('วันที่: '), H.highlight(letterDateBE)],
                [H.bold('Date: '), H.highlight(H.convertBEtoCE(letterDateBE) || letterDateBE)],
                { alignment: 'right' }
            ));
        }
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
        content.push(separateLanguageLines(
            H,
            [H.bold('ชื่อผู้ป่วย: '), H.highlight(trim(data.patientName))],
            [H.bold('Patient name: '), H.highlight(trim(data.patientName))]
        ));
        if (trim(data.dob)) {
            content.push(separateLanguageLines(
                H,
                [H.bold('วันเกิด: '), H.highlight(trim(data.dob))],
                [H.bold('Date of birth: '), H.highlight(H.convertBEtoCE(trim(data.dob)) || trim(data.dob))]
            ));
        }
        if (trim(data.nationalId)) {
            content.push(separateLanguageLines(
                H,
                [H.bold('เลขประจำตัวประชาชน: '), H.highlight(trim(data.nationalId))],
                [H.bold('National ID: '), H.highlight(trim(data.nationalId))]
            ));
        }
        if (trim(data.passportNumber)) {
            content.push(separateLanguageLines(
                H,
                [H.bold('เลขที่หนังสือเดินทาง: '), H.highlight(trim(data.passportNumber))],
                [H.bold('Passport no.: '), H.highlight(trim(data.passportNumber))]
            ));
        }

        const historyItems = [];
        if (yes(data.includeRetroviral)) {
            const nested = [];
            if (trim(data.napId)) {
                nested.push(pairedDetail(
                    H,
                    ['NAP-ID: D4-', H.highlight(trim(data.napId))],
                    ['NAP-ID: D4-', H.highlight(trim(data.napId))]
                ));
            }
            if (trim(data.firstDiagnosisDateRetro)) {
                nested.push(pairedDateDetail(
                    H,
                    'วันที่ได้รับการวินิจฉัยครั้งแรก',
                    'First diagnosis date',
                    trim(data.firstDiagnosisDateRetro)
                ));
            }
            if (trim(data.artStartDate)) {
                nested.push(pairedDateDetail(H, 'วันที่เริ่ม ART', 'ART start date', trim(data.artStartDate)));
            }
            if (trim(data.initialCD4) || trim(data.initialCD4Percent)) {
                const baselineCd4Thai = [H.bold('CD4 แรกรับ: ')];
                const baselineCd4English = [H.bold('Baseline CD4: ')];
                if (trim(data.initialCD4)) {
                    baselineCd4Thai.push(H.highlight(trim(data.initialCD4)), ' cells/mm3');
                    baselineCd4English.push(H.highlight(trim(data.initialCD4)), ' cells/mm3');
                }
                if (trim(data.initialCD4Percent)) {
                    if (trim(data.initialCD4)) {
                        baselineCd4Thai.push(' (');
                        baselineCd4English.push(' (');
                    }
                    baselineCd4Thai.push(H.highlight(withoutTrailingPercent(data.initialCD4Percent)), '%');
                    baselineCd4English.push(H.highlight(withoutTrailingPercent(data.initialCD4Percent)), '%');
                    if (trim(data.initialCD4)) {
                        baselineCd4Thai.push(')');
                        baselineCd4English.push(')');
                    }
                }
                if (trim(data.initialCD4Date)) {
                    baselineCd4Thai.push(' ตรวจเมื่อวันที่ ', H.highlight(trim(data.initialCD4Date)));
                    baselineCd4English.push(
                        ' tested on ',
                        H.highlight(H.convertBEtoCE(trim(data.initialCD4Date)) || trim(data.initialCD4Date))
                    );
                }
                nested.push(pairedDetail(H, baselineCd4Thai, baselineCd4English));
            }
            if (trim(data.adherence)) {
                nested.push(pairedDetail(
                    H,
                    [H.bold('ความสม่ำเสมอในการรับประทาน ART: '), H.highlight(trim(data.adherence))],
                    [H.bold('ART adherence: '), H.highlight(trim(data.adherence))]
                ));
            }
            if (trim(data.latestVL)) {
                const hivVlThai = [H.bold('ผลตรวจ HIV VL ล่าสุด: '), H.highlight(trim(data.latestVL)), ' copies/mL'];
                const hivVlEnglish = [H.bold('Latest HIV VL: '), H.highlight(trim(data.latestVL)), ' copies/mL'];
                if (trim(data.latestVLDate)) {
                    hivVlThai.push(' ตรวจเมื่อวันที่ ', H.highlight(trim(data.latestVLDate)));
                    hivVlEnglish.push(
                        ' tested on ',
                        H.highlight(H.convertBEtoCE(trim(data.latestVLDate)) || trim(data.latestVLDate))
                    );
                }
                nested.push(pairedDetail(H, hivVlThai, hivVlEnglish));
            }
            if (Array.isArray(data.artMedications) && data.artMedications.length) {
                nested.push(H.listItem(H.bold('สูตรยา ART ปัจจุบัน / Current ART regimen:'), data.artMedications.map(artMedicationItem)));
            }
            if (yes(data.includeTmxSmp) && trim(data.tmxSmpTablets)) {
                const tablets = trim(data.tmxSmpTablets);
                nested.push(pairedDetail(
                    H,
                    [H.bold('ยาป้องกันการติดเชื้อฉวยโอกาส: '), 'TMX/SMP 80/400 mg ', H.highlight(tablets), ' เม็ด วันละ 1 ครั้ง'],
                    [H.bold('OI prophylaxis: '), 'TMX/SMP 80/400 mg ', H.highlight(tablets), tablets === '1' ? ' tablet once daily' : ' tablets once daily']
                ));
            }
            if (trim(data.retroviralNotes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.retroviralNotes))]));
            historyItems.push(H.listItem(H.bold('Retroviral infection'), nested));
        }
        if (yes(data.includeSyphilisActive) && trim(data.syphilisStartDate)) {
            const nested = [
                pairedDateDetail(H, 'วันที่เริ่มการรักษา', 'Treatment start date', trim(data.syphilisStartDate)),
                pairedDetail(
                    H,
                    [H.bold('สูตรยา: '), H.highlight(trim(data.syphilisMedicationText) || 'Benzathine penicillin G 2.4 million units IM')],
                    [H.bold('Regimen: '), H.highlight(trim(data.syphilisMedicationText) || 'Benzathine penicillin G 2.4 million units IM')]
                )
            ];
            if (!data.syphilisMedication || data.syphilisMedication === 'Benzathine') {
                nested.push(H.listItem(H.bold('กำหนดการฉีดยา / Injection schedule:'), [
                    pairedDateDetail(H, 'เข็มที่ 1', 'Dose 1', trim(data.syphilisDose1Date)),
                    pairedDateDetail(H, 'เข็มที่ 2', 'Dose 2', trim(data.syphilisDose2Date)),
                    pairedDateDetail(H, 'เข็มที่ 3', 'Dose 3', trim(data.syphilisDose3Date))
                ]));
            }
            if (trim(data.syphilisNotes)) nested.push(H.listItem([H.bold('หมายเหตุทางการแพทย์ / Clinical notes: '), H.highlight(trim(data.syphilisNotes))]));
            historyItems.push(H.listItem(H.bold('ซิฟิลิสที่อยู่ระหว่างการรักษา / Active syphilis'), nested));
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
                    'ผู้ป่วยไม่ให้ประวัติความเสี่ยงตามรายการข้างต้น',
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
        if (yes(data.includeHBV)) {
            historyItems.push(H.listItem(H.bold('การติดเชื้อ HBV ร่วม / HBV co-infection')));
        }
        if (yes(data.includeHCVActive)) {
            historyItems.push(H.listItem(H.bold('การติดเชื้อ HCV ร่วม (ยังไม่ได้รับการรักษา) / Untreated HCV co-infection')));
        }
        if (yes(data.includeTreatedSyphilis)) {
            historyItems.push(H.listItem(H.bold('ประวัติซิฟิลิสที่รักษาครบแล้ว / Treated syphilis')));
        }
        if (yes(data.includeTreatedHCV)) {
            const nested = [];
            if (trim(data.treatedHCVMedication)) {
                nested.push(pairedDetail(
                    H,
                    [H.bold('สูตรยา: '), H.highlight(trim(data.treatedHCVMedication))],
                    [H.bold('Regimen: '), H.highlight(trim(data.treatedHCVMedication))]
                ));
            }
            if (trim(data.treatedHCVCompletionDate)) {
                nested.push(pairedDateDetail(
                    H,
                    'วันที่รักษาครบ',
                    'Treatment completion date',
                    trim(data.treatedHCVCompletionDate)
                ));
            }
            historyItems.push(H.listItem(H.bold('ประวัติ HCV ที่รักษาครบแล้ว / Treated HCV'), nested));
        }
        if (yes(data.includeTreatedTB)) {
            const nested = [];
            const sitesThai = tbSiteText(data, 'thai');
            const sitesEnglish = tbSiteText(data, 'english');
            if (sitesThai || sitesEnglish) {
                nested.push(pairedDetail(
                    H,
                    [H.bold('ตำแหน่งของโรค: '), H.highlight(sitesThai)],
                    [H.bold('Disease site: '), H.highlight(sitesEnglish)]
                ));
            }
            if (trim(data.treatedTBMedication)) {
                nested.push(pairedDetail(
                    H,
                    [H.bold('สูตรยา: '), H.highlight(trim(data.treatedTBMedication))],
                    [H.bold('Regimen: '), H.highlight(trim(data.treatedTBMedication))]
                ));
            }
            if (trim(data.treatedTBCompletionDate)) {
                nested.push(pairedDateDetail(
                    H,
                    'วันที่รักษาครบ',
                    'Treatment completion date',
                    trim(data.treatedTBCompletionDate)
                ));
            }
            historyItems.push(H.listItem(H.bold('ประวัติวัณโรคที่รักษาครบแล้ว / Treated TB'), nested));
        }
        if (yes(data.includeCompletedTPT)) {
            historyItems.push(tptSection(
                'ได้รับ TPT ครบแล้ว',
                'Completed TPT',
                data.completedTPTMedicationText,
                data.completedTPTMedicationOther,
                data.completedTPTStartDate,
                data.completedTPTNotes
            ));
        }
        if (yes(data.includeOngoingTPT)) {
            historyItems.push(tptSection(
                'อยู่ระหว่างรับ TPT',
                'Ongoing TPT',
                data.ongoingTPTMedicationText,
                data.ongoingTPTMedicationOther,
                data.ongoingTPTStartDate,
                data.ongoingTPTNotes
            ));
        }
        if (yes(data.includeOtherHistory) && trim(data.otherMedicalHistory)) historyItems.push(H.listItem([H.bold('ประวัติการรักษาอื่น ๆ / Other medical history: '), H.highlight(trim(data.otherMedicalHistory))]));

        if (historyItems.length) {
            content.push(H.sectionTitle('สรุปประวัติการรักษา / Medical Summary'));
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
