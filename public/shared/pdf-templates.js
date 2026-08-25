(function () {
    const h = () => window.PdfGenerator.helpers;

    function trim(value) {
        return String(value || '').trim();
    }

    function yes(value) {
        return !!value;
    }

    function documentLanguage(data) {
        return data && (data.language === 'th' || data.language === 'en') ? data.language : 'both';
    }

    function localize(language, thai, english) {
        return language === 'th' ? thai : language === 'en' ? english : `${thai} / ${english}`;
    }

    const MEMO_HEADING = 'บันทึกข้อความ / Medical Notes';
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
            thai: 'ไม่ให้ประวัติความเสี่ยง',
            english: 'no risk factors reported'
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
    const REFERRAL_INTENT_LABELS = {
        specializedCare: { thai: 'การดูแลรักษาเฉพาะทาง', english: 'specialized care and management' },
        diagnosticEvaluation: { thai: 'การตรวจวินิจฉัยเพิ่มเติม', english: 'further diagnostic evaluation' },
        hivCareTreatment: { thai: 'การดูแลรักษาการติดเชื้อ HIV', english: 'HIV care and treatment' },
        syphilisCareTreatment: { thai: 'การรักษาซิฟิลิส', english: 'syphilis treatment' },
        mpoxCareTreatment: { thai: 'การดูแลรักษา mpox', english: 'mpox care and treatment' },
        hbvCareTreatment: { thai: 'การดูแลรักษาการติดเชื้อ HBV', english: 'HBV care and treatment' },
        hcvCareTreatment: { thai: 'การดูแลรักษาการติดเชื้อ HCV', english: 'HCV care and treatment' },
        tbCareTreatment: { thai: 'การรักษาวัณโรค', english: 'TB treatment' },
        tptCareTreatment: { thai: 'การให้ยาป้องกันวัณโรค (TPT)', english: 'tuberculosis preventive treatment (TPT)' }
    };

    function withoutTrailingPercent(value) {
        return trim(value).replace(/\s*%+\s*$/, '');
    }

    function dateForLanguage(H, value, language) {
        const date = trim(value);
        if (!date) return '';
        const isBE = /^\d{2}\/(?:\d{2}\/)?\d{4}$/.test(date) && parseInt(date.split('/').pop(), 10) >= 2300;
        const be = isBE ? date : H.convertCEtoBE(date);
        const ce = isBE ? H.convertBEtoCE(date) : date;
        return language === 'th' ? (be || date) : language === 'en' ? (ce || date) : (be && ce && be !== ce ? `${be} (${ce})` : date);
    }

    function documentDateLine(H, value, language, thaiLabel = 'วันที่', englishLabel = 'Date') {
        const date = dateForLanguage(H, value, language);
        return H.para([H.bold(`${localize(language, thaiLabel, englishLabel)}: `), H.highlight(date)], { alignment: 'right', margin: [0, 0, 0, 6] });
    }

    function memoRecipient(H, recipient, language = 'both') {
        const value = trim(recipient) || DEFAULT_RECIPIENT;
        const isDefaultRecipient = value === DEFAULT_RECIPIENT;
        if (language === 'en') return isDefaultRecipient
            ? H.para('To Whom It May Concern:')
            : H.para([H.bold('To: '), value]);
        if (language === 'th') return H.para([H.bold('เรียน '), value]);
        return H.para([H.bold('เรียน '), value, isDefaultRecipient ? ' / To Whom It May Concern:' : '']);
    }

    function signatureBlock({ thaiName, englishName, license, medicalOfficer = false, language = 'both' }) {
        const H = h();
        const nameParts = [];
        if (language !== 'en' && trim(thaiName)) nameParts.push(H.highlight(trim(thaiName)));
        if (language !== 'th' && trim(englishName)) {
            if (nameParts.length) nameParts.push(' / ');
            nameParts.push(H.highlight(trim(englishName).toUpperCase()));
        }
        const stack = [H.para(localize(language, 'ขอแสดงความนับถือ', 'Respectfully,'), { margin: [0, 6, 0, 0], alignment: 'left' })];
        stack.push({ text: '', margin: [0, 12, 0, 0] });
        stack.push({ text: '', margin: [0, 12, 0, 0] });
        if (nameParts.length) {
            stack.push(H.para(['(', ...nameParts, ')'], { alignment: 'left' }));
            if (medicalOfficer) stack.push(H.para(localize(language, 'แพทย์ผู้ตรวจรักษา', 'Attending Physician'), { alignment: 'left' }));
        }
        if (trim(license)) {
            stack.push(H.para([H.bold(`${localize(language, 'เลขที่ใบประกอบวิชาชีพ', 'Medical License No.')}: `), H.highlight(trim(license))], { alignment: 'left' }));
        }
        stack.push(H.para(localize(language, 'ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี', 'Public Health Center 28 Krung Thon Buri'), { alignment: 'left' }));
        return { stack, margin: [0, 4, 0, 0] };
    }

    function buildFreeForm(data) {
        const H = h();
        const language = documentLanguage(data);
        const letterDate = trim(data.letterDate);
        const suppliedTitle = trim(data.documentTitle);
        const title = !suppliedTitle || suppliedTitle.toLowerCase() === MEMO_HEADING.toLowerCase()
            ? localize(language, 'บันทึกข้อความ', 'Medical Notes')
            : suppliedTitle;
        const content = [
            documentDateLine(H, letterDate, language),
            H.title(title, 13)
        ];
        content.push(memoRecipient(H, data.addressee, language));
        content.push({
            text: H.text(trim(data.letterBody)).text,
            preserveLeadingSpaces: true,
            margin: [0, 5, 0, 7],
            alignment: 'justify'
        });
        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense,
            language
        }));
        return content;
    }

    function buildMedicationCertificate(data) {
        const H = h();
        const language = documentLanguage(data);
        let fullName = '';
        if (trim(data.salutation)) fullName += `${trim(data.salutation)} `;
        fullName += trim(data.patientName) || 'PATIENT NAME N/A';
        const patientName = fullName.toUpperCase();
        const nationality = trim(data.nationality).toUpperCase();
        const passportNumber = trim(data.passportNumber).toUpperCase();
        const dobCE = trim(data.dob) || 'N/A';
        const letterDateCE = trim(data.letterDate) || '';

        const meds = (data.includeMedications && Array.isArray(data.artMedications) && data.artMedications.length)
            ? data.artMedications.map(item => H.highlight(trim(item.medication).toUpperCase()))
            : [H.text(localize(language, 'ไม่ได้ระบุรายการยา', 'None specified'))];

        const content = [
            documentDateLine(H, letterDateCE, language, 'วันที่ออกเอกสาร', 'Certificate date'),
            H.title(localize(language, 'หนังสือรับรองการพกยา', 'Medication Certificate for Travel'), 13)
        ];
        content.push(memoRecipient(H, '', language));
        const identity = [
            H.bold(`${localize(language, 'ชื่อ-นามสกุล', 'Full name')}: `),
            H.highlight(patientName)
        ];
        if (nationality) identity.push(
            '    ',
            H.bold(`${localize(language, 'สัญชาติ', 'Nationality')}: `),
            H.highlight(nationality)
        );
        content.push(H.para(identity));
        const identityNumbers = [
            H.bold(`${localize(language, 'วันเกิด', 'Date of birth')}: `),
            H.highlight(dateForLanguage(H, dobCE, language))
        ];
        if (passportNumber) {
            identityNumbers.push(
                '    ',
                H.bold(`${localize(language, 'เลขที่หนังสือเดินทาง', 'Passport no.')}: `),
                H.highlight(passportNumber)
            );
        }
        content.push(H.para(identityNumbers));
        if (language !== 'en') {
            content.push(H.para([
                'หนังสือรับรองฉบับนี้ขอรับรองว่า ',
                H.highlight(patientName),
                ' อยู่ระหว่างการดูแลรักษาที่ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี และมีความจำเป็นต้องนำยารายการต่อไปนี้ติดตัวเพื่อใช้ในการรักษาระหว่างการเดินทาง'
            ]));
        }
        if (language !== 'th') {
            content.push(H.para([
                'This is to certify that ',
                H.highlight(patientName),
                ' is currently under the care of Public Health Center 28 Krung Thon Buri and is required to carry the medications listed below for personal therapeutic use during travel.'
            ]));
        }
        content.push(H.sectionTitle(localize(language, 'รายการยาที่จำเป็นต้องพกติดตัว', 'Medications Required During Travel')));
        content.push({ ul: meds.map(item => H.listItem(item)), margin: [12, 1, 0, 5] });
        if (trim(data.additionalNotes)) {
            content.push(H.para([H.bold(`${localize(language, 'หมายเหตุเพิ่มเติม', 'Additional notes')}: `), H.highlight(trim(data.additionalNotes))], { margin: [0, 5, 0, 0] }));
        }
        content.push(signatureBlock({
            thaiName: trim(data.doctorNameThai),
            englishName: trim(data.doctorNameEnglish) || 'DOCTOR NAME N/A',
            license: trim(data.medicalLicense) || 'N/A',
            medicalOfficer: true,
            language
        }));
        return content;
    }

    function buildMedicalCertificate(data) {
        const H = h();
        const language = documentLanguage(data);
        const letterDateCE = trim(data.letterDate);
        const content = [
            documentDateLine(H, letterDateCE, language),
            H.title(localize(language, 'ใบรับรองแพทย์', 'Medical Certificate'), 13)
        ];

        const thai = [];
        const english = [];

        thai.push(H.para([H.bold('เรียน '), 'เจ้าหน้าที่ผู้เกี่ยวข้อง']));
        english.push(H.para('To Whom It May Concern:'));

        // Full name
        const nameThai = [];
        const nameEng = [];
        if (trim(data.patientSalutation)) {
            nameThai.push(H.highlight(trim(data.patientSalutation)), ' ');
            nameEng.push(H.highlight(trim(data.patientSalutationEnglish) || trim(data.patientSalutation)), ' ');
        } else if (trim(data.patientSalutationEnglish)) {
            nameEng.push(H.highlight(trim(data.patientSalutationEnglish)), ' ');
        }
        if (trim(data.patientName)) {
            nameThai.push(H.highlight(trim(data.patientName)));
            nameEng.push(H.highlight(trim(data.patientName)));
        }
        const patientThai = nameThai.length ? nameThai : [H.highlight('ผู้ป่วยรายนี้')];
        const patientEnglish = nameEng.length ? nameEng : [H.highlight('the patient')];
        const sexThai = trim(data.patientGender) || trim(data.patientGenderEnglish);
        const sexEnglish = trim(data.patientGenderEnglish) || trim(data.patientGender);
        if (sexThai) {
            patientThai.push(', ', H.bold('เพศ: '), H.highlight(sexThai));
            patientEnglish.push(', ', H.bold('Sex: '), H.highlight(sexEnglish));
        }
        if (trim(data.patientAge)) {
            patientThai.push(', ', H.bold('อายุ: '), H.highlight(trim(data.patientAge)), ' ปี');
            patientEnglish.push(', ', H.bold('Age: '), H.highlight(trim(data.patientAge)), ' years');
        }
        if (trim(data.nationalIdNumber)) {
            patientThai.push(', ', H.bold('เลขประจำตัวประชาชน: '), H.highlight(trim(data.nationalIdNumber)));
            patientEnglish.push(', ', H.bold('National ID: '), H.highlight(trim(data.nationalIdNumber)));
        }
        if (trim(data.passportNumber)) {
            patientThai.push(', ', H.bold('เลขที่หนังสือเดินทาง: '), H.highlight(trim(data.passportNumber)));
            patientEnglish.push(', ', H.bold('Passport no.: '), H.highlight(trim(data.passportNumber)));
        }
        if (sexThai || trim(data.patientAge) || trim(data.nationalIdNumber) || trim(data.passportNumber)) patientEnglish.push(',');
        thai.push(H.para([
            'หนังสือรับรองฉบับนี้ขอรับรองว่า ',
            ...patientThai,
            ' อยู่ระหว่างการดูแลรักษาของศูนย์บริการสาธารณสุข 28 กรุงธนบุรี'
        ]));
        english.push(H.para([
            'This is to certify that ',
            ...patientEnglish,
            ' is currently under the care of Public Health Center 28 Krung Thon Buri.'
        ]));

        if (yes(data.includeConsultationDiagnosis)) {
            const thaiClinical = [];
            const englishClinical = [];
            if (trim(data.consultationDate)) {
                const dateCE = trim(data.consultationDate);
                thaiClinical.push('ผู้ป่วยได้เข้ารับการตรวจรักษาเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE));
                englishClinical.push('The patient was evaluated and treated on ', H.highlight(dateCE));
            }
            if (trim(data.diagnosis)) {
                if (thaiClinical.length) thaiClinical.push(' และได้รับการวินิจฉัยว่า ');
                else thaiClinical.push('ผู้ป่วยได้รับการวินิจฉัยว่า ');
                if (englishClinical.length) englishClinical.push(' and was diagnosed with ');
                else englishClinical.push('The patient was diagnosed with ');
                thaiClinical.push(H.highlight(trim(data.diagnosis)));
                englishClinical.push(H.highlight(trim(data.diagnosis)));
            }
            if (thaiClinical.length) thai.push(H.para(thaiClinical));
            if (englishClinical.length) english.push(H.para([...englishClinical, '.']));
        }

        if (yes(data.includeAdvisedRest) && trim(data.restStartDate) && trim(data.restEndDate) && trim(data.restDurationDays)) {
            const startCE = trim(data.restStartDate);
            const endCE = trim(data.restEndDate);
            thai.push(H.para([
                'แพทย์มีความเห็นว่าผู้ป่วยควรพักรักษาตัวตั้งแต่วันที่ ',
                H.highlight(H.convertCEtoBE(startCE) || startCE),
                ' ถึงวันที่ ',
                H.highlight(H.convertCEtoBE(endCE) || endCE),
                ' รวม ',
                H.highlight(trim(data.restDurationDays)),
                ' วัน'
            ]));
            english.push(H.para([
                'In the attending physician’s opinion, the patient should take medical leave from ',
                H.highlight(startCE),
                ' through ',
                H.highlight(endCE),
                ' for a total of ',
                H.highlight(trim(data.restDurationDays)),
                trim(data.restDurationDays) === '1' ? ' day.' : ' days.'
            ]));
            if (trim(data.advisedRestNotes)) {
                thai.push(H.para([H.bold('หมายเหตุ: '), H.highlight(trim(data.advisedRestNotes))], { margin: [12, 0, 0, 2] }));
                english.push(H.para([H.bold('Notes: '), H.highlight(trim(data.advisedRestNotes))], { margin: [12, 0, 0, 2] }));
            }
        }

        if (yes(data.includeSyphilisTreatment) && trim(data.syphilisTreatmentDate)) {
            const dateCE = trim(data.syphilisTreatmentDate);
            thai.push(H.para(['ผู้ป่วยได้เข้ารับการรักษาโรคซิฟิลิสเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE)]));
            english.push(H.para(['The patient received treatment for syphilis on ', H.highlight(dateCE), '.']));
            if (trim(data.syphilisNotes)) {
                thai.push(H.para([H.bold('หมายเหตุ: '), H.highlight(trim(data.syphilisNotes))], { margin: [12, 0, 0, 2] }));
                english.push(H.para([H.bold('Notes: '), H.highlight(trim(data.syphilisNotes))], { margin: [12, 0, 0, 2] }));
            }
        }

        if (yes(data.includeTBTreatment) && trim(data.tbTreatmentCompletionDate)) {
            const dateCE = trim(data.tbTreatmentCompletionDate);
            thai.push(H.para(['ผู้ป่วยได้รับการรักษาวัณโรคครบตามแผนการรักษาเมื่อวันที่ ', H.highlight(H.convertCEtoBE(dateCE) || dateCE)]));
            english.push(H.para(['The patient completed the prescribed course of TB treatment on ', H.highlight(dateCE), '.']));
            if (trim(data.tbNotes)) {
                thai.push(H.para([H.bold('หมายเหตุ: '), H.highlight(trim(data.tbNotes))], { margin: [12, 0, 0, 2] }));
                english.push(H.para([H.bold('Notes: '), H.highlight(trim(data.tbNotes))], { margin: [12, 0, 0, 2] }));
            }
        }

        if (yes(data.includeDoctorComment) && trim(data.doctorComment)) {
            thai.push(H.para([H.bold('ความเห็นของแพทย์: '), H.highlight(trim(data.doctorComment))]));
            english.push(H.para([H.bold('Physician’s remarks: '), H.highlight(trim(data.doctorComment))]));
        }

        if (language !== 'en') content.push({ stack: thai, margin: [0, 4, 0, 6] });
        if (language !== 'th') content.push({ stack: english, margin: [0, 4, 0, 6] });

        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense,
            medicalOfficer: true,
            language
        }));
        return content;
    }

    function collectReferralIntents(data) {
        const intents = Array.isArray(data.referralIntents)
            ? data.referralIntents.filter(intent => intent !== 'continuedCare' && intent !== 'medicalSummary')
            : [];
        const custom = trim(data.referralIntentCustom);
        const labels = intents.map(intent => REFERRAL_INTENT_LABELS[intent]).filter(Boolean);
        if (custom) labels.push({ thai: custom, english: custom });
        return labels;
    }

    function dateDetail(H, th, thaiLabel, englishLabel, beDate, partial = false) {
        const date = trim(beDate);
        const ceDate = partial ? H.convertPartialBEtoCE(date) : H.convertBEtoCE(date);
        if (th) return H.listItem([H.bold(`${thaiLabel}: `), H.highlight(date)]);
        return H.listItem([H.bold(`${englishLabel}: `), H.highlight(ceDate || date)]);
    }

    function baselineCd4(H, th, data) {
        const parts = th ? ['ผล CD4 แรกรับเท่ากับ '] : ['Baseline CD4 was '];
        if (trim(data.initialCD4)) parts.push(H.highlight(trim(data.initialCD4)), ' cells/mm3');
        if (trim(data.initialCD4Percent)) {
            if (trim(data.initialCD4)) parts.push(' (');
            parts.push(H.highlight(withoutTrailingPercent(data.initialCD4Percent)), '%');
            if (trim(data.initialCD4)) parts.push(')');
        }
        if (trim(data.initialCD4Date)) {
            const dateBE = trim(data.initialCD4Date);
            const dateCE = H.convertBEtoCE(dateBE);
            parts.push(th ? ' ตรวจเมื่อวันที่ ' : ', measured on ', H.highlight(th ? dateBE : (dateCE || dateBE)));
        }
        if (!th) parts.push('.');
        return parts;
    }

    function hivVl(H, th, data) {
        const parts = th ? ['ผลตรวจ HIV VL ล่าสุดเท่ากับ '] : ['The latest HIV VL was '];
        parts.push(H.highlight(trim(data.latestVL)), ' copies/mL');
        if (trim(data.latestVLDate)) {
            const dateBE = trim(data.latestVLDate);
            const dateCE = H.convertBEtoCE(dateBE);
            parts.push(th ? ' ตรวจเมื่อวันที่ ' : ', measured on ', H.highlight(th ? dateBE : (dateCE || dateBE)));
        }
        if (!th) parts.push('.');
        return parts;
    }

    function tptSection(H, th, title, medicationText, otherMedication, startDate, notes) {
        let med = trim(medicationText);
        if (med.toLowerCase() === 'other' && trim(otherMedication)) med = trim(otherMedication);
        const nested = [];
        if (med && !/^select (medication|regimen)$/i.test(med)) {
            nested.push(H.listItem(th
                ? ['ผู้ป่วยได้รับ TPT สูตร ', H.highlight(med)]
                : ['The TPT regimen is ', H.highlight(med), '.']));
        }
        if (trim(startDate)) {
            const date = trim(startDate);
            nested.push(H.listItem(th
                ? ['เริ่ม TPT เมื่อเดือน ', H.highlight(date)]
                : ['TPT was started in ', H.highlight(H.convertPartialBEtoCE(date) || date), '.']));
        }
        if (trim(notes)) nested.push(H.listItem(th ? [H.bold('หมายเหตุ: '), H.highlight(trim(notes))] : [H.bold('Notes: '), H.highlight(trim(notes))]));
        return H.listItem(H.bold(title), nested);
    }

    function artMedicationItem(art, th) {
        const H = h();
        const parts = [H.highlight(trim(art.medication))];
        const tablets = trim(art.tablets);
        const time = trim(art.time);
        if (tablets) parts.push(' ', H.highlight(tablets), th ? ' เม็ด' : (tablets === '1' ? ' tablet' : ' tablets'));
        if (time) parts.push(th ? ' เวลา ' : ' at ', H.highlight(time), th ? ' น.' : '');
        else if (tablets) parts.push(th ? ' วันละ 1 ครั้ง' : ' once daily');
        return H.listItem(parts);
    }

    function otherMedicationItem(med, th) {
        const H = h();
        const name = trim(med.name);
        const strength = trim(med.strength);
        const schedule = trim(med.schedule);
        const qty = trim(med.quantity);
        const parts = [H.highlight(name)];
        if (strength) parts.push(' ', H.highlight(strength));
        if (schedule) parts.push(th ? ' รับประทาน ' : ' ', H.highlight(schedule));
        if (qty) parts.push(
            th ? ' จำนวน ' : '; quantity: ',
            H.highlight(qty),
            th ? ' เม็ด/ขวด/หน่วย' : ' tablets/bottles/units'
        );
        return H.listItem(parts);
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

    function buildReferralHistory(data, language) {
        const H = h();
        const th = language === 'thai';
        const items = [];

        if (yes(data.includeRetroviral)) {
            const nested = [];
            if (trim(data.napId)) nested.push(H.listItem(['NAP-ID: D4-', H.highlight(trim(data.napId))]));
            if (trim(data.firstDiagnosisDateRetro)) {
                const date = trim(data.firstDiagnosisDateRetro);
                nested.push(H.listItem(th
                    ? ['ได้รับการวินิจฉัยครั้งแรกเมื่อวันที่ ', H.highlight(date)]
                    : ['The diagnosis was first established on ', H.highlight(H.convertBEtoCE(date) || date), '.']));
            }
            if (trim(data.artStartDate)) {
                const date = trim(data.artStartDate);
                nested.push(H.listItem(th
                    ? ['เริ่ม ART เมื่อวันที่ ', H.highlight(date)]
                    : ['ART was initiated on ', H.highlight(H.convertBEtoCE(date) || date), '.']));
            }
            if (trim(data.initialCD4) || trim(data.initialCD4Percent)) nested.push(H.listItem(baselineCd4(H, th, data)));
            if (trim(data.adherence)) nested.push(H.listItem(th
                ? ['ผู้ป่วยรายงานความสม่ำเสมอในการรับประทาน ART เท่ากับ ', H.highlight(trim(data.adherence))]
                : ['The patient reported ART adherence of ', H.highlight(trim(data.adherence)), '.']));
            if (trim(data.latestVL)) nested.push(H.listItem(hivVl(H, th, data)));
            if (Array.isArray(data.artMedications) && data.artMedications.length) {
                nested.push(H.listItem(th ? H.bold('สูตรยา ART ปัจจุบัน:') : H.bold('Current ART regimen:'), data.artMedications.map(item => artMedicationItem(item, th))));
            }
            if (yes(data.includeTmxSmp) && trim(data.tmxSmpTablets)) {
                const tablets = trim(data.tmxSmpTablets);
                nested.push(H.listItem(th
                    ? ['ผู้ป่วยได้รับ TMX/SMP 80/400 mg ', H.highlight(tablets), ' เม็ด วันละ 1 ครั้ง เพื่อป้องกันการติดเชื้อฉวยโอกาส']
                    : ['The patient receives TMX/SMP 80/400 mg, ', H.highlight(tablets), tablets === '1' ? ' tablet' : ' tablets', ' once daily for OI prophylaxis.']));
            }
            if (yes(data.includeLastMedicinePickup)) {
                const pickupDate = trim(data.lastMedicinePickupDate);
                const daysSupplied = trim(data.medicineDuration);
                const pickupDateDisplay = th ? pickupDate : (H.convertBEtoCE(pickupDate) || pickupDate);
                if (pickupDate && daysSupplied) nested.push(H.listItem(th
                    ? ['ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ ', H.highlight(pickupDateDisplay), ' โดยมียาเพียงพอสำหรับ ', H.highlight(daysSupplied), ' วัน']
                    : ['The patient last collected medication on ', H.highlight(pickupDateDisplay), ', with a ', H.highlight(daysSupplied), '-day supply.']));
                else if (pickupDate) nested.push(H.listItem(th
                    ? ['ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ ', H.highlight(pickupDateDisplay)]
                    : ['The patient last collected medication on ', H.highlight(pickupDateDisplay), '.']));
                else if (daysSupplied) nested.push(H.listItem(th
                    ? ['ผู้ป่วยได้รับยาเพียงพอสำหรับ ', H.highlight(daysSupplied), ' วัน']
                    : ['A ', H.highlight(daysSupplied), '-day medication supply was provided.']));
            }
            if (trim(data.retroviralNotes)) nested.push(H.listItem(th ? [H.bold('หมายเหตุ: '), H.highlight(trim(data.retroviralNotes))] : [H.bold('Notes: '), H.highlight(trim(data.retroviralNotes))]));
            items.push(H.listItem(H.bold('Retroviral infection'), nested));
        }
        if (yes(data.includeSyphilisActive) && trim(data.syphilisStartDate)) {
            const treatmentStartDate = trim(data.syphilisStartDate);
            const nested = [
                H.listItem(th
                    ? ['เริ่มการรักษาโรคซิฟิลิสเมื่อวันที่ ', H.highlight(treatmentStartDate)]
                    : ['Treatment for syphilis commenced on ', H.highlight(H.convertBEtoCE(treatmentStartDate) || treatmentStartDate), '.']),
                H.listItem(th
                    ? ['ได้รับการรักษาด้วย ', H.highlight(trim(data.syphilisMedicationText) || 'Benzathine penicillin G 2.4 million units IM')]
                    : ['The prescribed treatment regimen is ', H.highlight(trim(data.syphilisMedicationText) || 'Benzathine penicillin G 2.4 million units IM'), '.'])
            ];
            if (!data.syphilisMedication || data.syphilisMedication === 'Benzathine') {
                nested.push(H.listItem(H.bold(th ? 'กำหนดการฉีดยา:' : 'Injection schedule:'), [
                    dateDetail(H, th, 'เข็มที่ 1', 'Dose 1', trim(data.syphilisDose1Date)),
                    dateDetail(H, th, 'เข็มที่ 2', 'Dose 2', trim(data.syphilisDose2Date)),
                    dateDetail(H, th, 'เข็มที่ 3', 'Dose 3', trim(data.syphilisDose3Date))
                ]));
            } else if (trim(data.syphilisDuration)) {
                const duration = trim(data.syphilisDuration).replace(/\s*days?$/i, '');
                nested.push(H.listItem(th
                    ? ['กำหนดระยะเวลาการรักษา ', H.highlight(duration), ' วัน']
                    : ['The planned treatment duration is ', H.highlight(duration), duration === '1' ? ' day.' : ' days.']));
            }
            if (trim(data.syphilisNotes)) nested.push(H.listItem(th ? [H.bold('หมายเหตุ: '), H.highlight(trim(data.syphilisNotes))] : [H.bold('Notes: '), H.highlight(trim(data.syphilisNotes))]));
            items.push(H.listItem(H.bold('Active Syphilis'), nested));
        }
        if (yes(data.includeSuspectedMpox)) {
            const nested = [];
            const duration = trim(data.mpoxSymptomDurationDays);
            if (duration) {
                nested.push(H.listItem(th
                    ? ['ผู้ป่วยเริ่มมีอาการมาแล้ว ', H.highlight(duration), ' วัน']
                    : ['Symptoms began ', H.highlight(duration), duration === '1' ? ' day ago.' : ' days ago.']));
            }
            const symptoms = mpoxOptionText(data.mpoxSymptoms, MPOX_SYMPTOM_LABELS, language, data.mpoxSymptomOtherText);
            if (symptoms) {
                nested.push(H.listItem(th
                    ? ['อาการสำคัญ ได้แก่ ', H.highlight(symptoms)]
                    : ['Presenting symptoms include ', H.highlight(symptoms), '.']));
            }
            const riskFactors = Array.isArray(data.mpoxRiskFactors) ? data.mpoxRiskFactors : [];
            if (riskFactors.includes('noneKnown')) {
                nested.push(H.listItem(th ? 'ผู้ป่วยไม่ให้ประวัติความเสี่ยง' : 'The patient did not report any risk factors.'));
            } else {
                const risk = mpoxOptionText(riskFactors, MPOX_RISK_LABELS, language, data.mpoxRiskOtherText);
                if (risk) {
                    nested.push(H.listItem(th ? ['ผู้ป่วยให้ประวัติว่า ', H.highlight(risk)] : ['The patient reported ', H.highlight(risk), '.']));
                }
            }
            items.push(H.listItem(H.bold('Suspected Mpox'), nested));
        }
        if (yes(data.includeHBV)) items.push(H.listItem(H.bold('HBV Co-Infection')));
        if (yes(data.includeHCVActive)) items.push(H.listItem(H.bold('HCV Co-Infection')));
        if (yes(data.includeTreatedSyphilis)) items.push(H.listItem(H.bold('Treated Syphilis')));
        if (yes(data.includeTreatedHCV)) {
            const nested = [];
            if (trim(data.treatedHCVMedication)) nested.push(H.listItem(th
                ? ['เคยได้รับการรักษาด้วยสูตรยา ', H.highlight(trim(data.treatedHCVMedication))]
                : ['The patient was treated with ', H.highlight(trim(data.treatedHCVMedication)), '.']));
            if (trim(data.treatedHCVCompletionDate)) {
                const date = trim(data.treatedHCVCompletionDate);
                nested.push(H.listItem(th
                    ? ['รักษา HCV ครบเมื่อวันที่ ', H.highlight(date)]
                    : ['HCV treatment was completed on ', H.highlight(H.convertBEtoCE(date) || date), '.']));
            }
            items.push(H.listItem(H.bold('Treated HCV'), nested));
        }
        if (yes(data.includeTreatedTB)) {
            const nested = [];
            const sites = tbSiteText(data, language);
            if (sites) nested.push(H.listItem(th ? [H.bold('ตำแหน่งของโรค: '), H.highlight(sites)] : [H.bold('Disease site: '), H.highlight(sites)]));
            if (trim(data.treatedTBMedication)) nested.push(H.listItem(th
                ? ['เคยได้รับการรักษาด้วยสูตรยา ', H.highlight(trim(data.treatedTBMedication))]
                : ['The patient was treated with ', H.highlight(trim(data.treatedTBMedication)), '.']));
            if (trim(data.treatedTBCompletionDate)) {
                const date = trim(data.treatedTBCompletionDate);
                nested.push(H.listItem(th
                    ? ['รักษาวัณโรคครบเมื่อวันที่ ', H.highlight(date)]
                    : ['TB treatment was completed on ', H.highlight(H.convertBEtoCE(date) || date), '.']));
            }
            items.push(H.listItem(H.bold('Treated TB'), nested));
        }
        if (yes(data.includeCompletedTPT)) items.push(tptSection(H, th, 'Completed TPT', data.completedTPTMedicationText, data.completedTPTMedicationOther, data.completedTPTStartDate, data.completedTPTNotes));
        if (yes(data.includeOngoingTPT)) items.push(tptSection(H, th, 'Ongoing TPT', data.ongoingTPTMedicationText, data.ongoingTPTMedicationOther, data.ongoingTPTStartDate, data.ongoingTPTNotes));
        if (yes(data.includeOtherHistory) && trim(data.otherMedicalHistory)) items.push(H.listItem([H.bold('Other Medical History: '), H.highlight(trim(data.otherMedicalHistory))]));
        return items;
    }

    function buildReferral(data) {
        const H = h();
        const language = documentLanguage(data);
        const letterType = data.letterType || 'summaryOfHistory';
        const intents = collectReferralIntents(data);
        const continuedCare = Array.isArray(data.referralIntents) && data.referralIntents.includes('continuedCare');
        const isReferral = letterType === 'referralForCare' || continuedCare || intents.length > 0;
        const letterDateBE = trim(data.letterDate);
        const intentThai = joinClinicalList(intents.map(intent => intent.thai), 'thai');
        const intentEnglish = joinClinicalList(intents.map(intent => intent.english), 'english');
        const content = [
            documentDateLine(H, letterDateBE, language),
            H.title(localize(language, 'บันทึกข้อความ', isReferral ? 'Referral Letter' : 'Medical Consultation Letter'), 13)
        ];

        const thai = [];
        const english = [];

        thai.push(H.para([H.bold('เรียน '), 'เจ้าหน้าที่ผู้เกี่ยวข้อง']));
        english.push(H.para('To Whom It May Concern:'));

        thai.push(H.para([H.bold('เรื่อง '), isReferral ? 'ขอส่งผู้ป่วยเพื่อรับการรักษาต่อ' : 'สรุปประวัติการรักษา']));
        english.push(H.para([H.bold('Re: '), isReferral ? 'Referral for Continued Care' : 'Medical Summary']));
        if (isReferral) {
            if (intents.length) {
                thai.push(H.para([
                    'ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี จึงส่งผู้ป่วยรายนี้เพื่อ ',
                    H.highlight(intentThai),
                    ' พร้อมสรุปข้อมูลการรักษาที่เกี่ยวข้องดังต่อไปนี้'
                ]));
                english.push(H.para([
                    'Public Health Center 28 Krung Thon Buri hereby refers this patient for continued care in relation to ',
                    H.highlight(intentEnglish),
                    '. The relevant clinical information is summarized below.'
                ]));
            } else {
                thai.push(H.para('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งผู้ป่วยรายนี้เพื่อรับการรักษาต่อ พร้อมสรุปข้อมูลการรักษาที่เกี่ยวข้องดังต่อไปนี้'));
                english.push(H.para('Public Health Center 28 Krung Thon Buri hereby refers this patient for continued care. The relevant clinical information is summarized below.'));
            }
        } else {
            thai.push(H.para('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี ขอส่งสรุปประวัติการรักษาของผู้ป่วยรายนี้เพื่อประกอบการดูแลรักษาต่อเนื่อง โดยมีรายละเอียดดังต่อไปนี้'));
            english.push(H.para('Public Health Center 28 Krung Thon Buri hereby provides this medical summary to facilitate continuity of care.'));
        }

        thai.push(H.para([H.bold('ชื่อผู้ป่วย: '), H.highlight(trim(data.patientName))]));
        english.push(H.para([H.bold('Patient name: '), H.highlight(trim(data.patientName))]));
        if (trim(data.dob)) {
            thai.push(H.para([H.bold('วันเกิด: '), H.highlight(trim(data.dob))]));
            english.push(H.para([H.bold('Date of birth: '), H.highlight(H.convertBEtoCE(trim(data.dob)) || trim(data.dob))]));
        }
        if (trim(data.nationalId)) {
            thai.push(H.para([H.bold('เลขประจำตัวประชาชน: '), H.highlight(trim(data.nationalId))]));
            english.push(H.para([H.bold('National ID: '), H.highlight(trim(data.nationalId))]));
        }
        if (trim(data.passportNumber)) {
            thai.push(H.para([H.bold('เลขที่หนังสือเดินทาง: '), H.highlight(trim(data.passportNumber))]));
            english.push(H.para([H.bold('Passport no.: '), H.highlight(trim(data.passportNumber))]));
        }

        const historyThai = buildReferralHistory(data, 'thai');
        const historyEnglish = buildReferralHistory(data, 'english');
        if (historyThai.length) {
            thai.push(H.sectionTitle('สรุปประวัติการรักษา'));
            thai.push({ ul: historyThai, margin: [10, 0, 0, 4] });
        }
        if (historyEnglish.length) {
            english.push(H.sectionTitle('Medical Summary'));
            english.push({ ul: historyEnglish, margin: [10, 0, 0, 4] });
        }

        if (Array.isArray(data.otherMedications) && data.otherMedications.length) {
            thai.push(H.sectionTitle('รายการยาอื่น ๆ'));
            thai.push({ ul: data.otherMedications.map(item => otherMedicationItem(item, true)), margin: [10, 0, 0, 4] });
            english.push(H.sectionTitle('Other Medications'));
            english.push({ ul: data.otherMedications.map(item => otherMedicationItem(item, false)), margin: [10, 0, 0, 4] });
        }

        if (yes(data.attachmentLabResults) || yes(data.attachmentOther)) {
            const attThai = [];
            const attEng = [];
            if (yes(data.attachmentLabResults)) {
                attThai.push('ผลตรวจทางห้องปฏิบัติการล่าสุด');
                attEng.push('Latest laboratory results');
            }
            if (yes(data.attachmentOther)) {
                attThai.push(trim(data.attachmentOtherText) ? `เอกสารอื่น: ${trim(data.attachmentOtherText)}` : 'เอกสารอื่น');
                attEng.push(trim(data.attachmentOtherText) ? `Other: ${trim(data.attachmentOtherText)}` : 'Other documents');
            }
            thai.push(H.sectionTitle('เอกสารแนบ'));
            thai.push({ ul: attThai.map(t => H.listItem(t)), margin: [10, 0, 0, 4] });
            english.push(H.sectionTitle('Attachments'));
            english.push({ ul: attEng.map(t => H.listItem(t)), margin: [10, 0, 0, 4] });
        }

        if (yes(data.includeReferralForAdmission)) {
            thai.push(H.para('จึงเรียนมาเพื่อโปรดพิจารณารับผู้ป่วยรายนี้เข้ารับการรักษาในโรงพยาบาลของท่าน'));
            english.push(H.para('We would be grateful if you would consider admitting this patient for further hospital care.'));
        }

        thai.push(H.para('กรุณาติดต่อศูนย์บริการสาธารณสุข 28 กรุงธนบุรี หากต้องการข้อมูลเพิ่มเติม'));
        english.push(H.para('Please contact Public Health Center 28 Krung Thon Buri if further information is required.'));

        if (trim(data.additionalNotes)) {
            thai.push(H.para([H.bold('หมายเหตุเพิ่มเติม: '), H.highlight(trim(data.additionalNotes))]));
            english.push(H.para([H.bold('Additional Notes: '), H.highlight(trim(data.additionalNotes))]));
        }

        if (language !== 'en') content.push({ stack: thai, margin: [0, 4, 0, 6] });
        if (language !== 'th') content.push({ stack: english, margin: [0, 4, 0, 6] });

        content.push(signatureBlock({
            thaiName: data.doctorNameThai,
            englishName: data.doctorNameEnglish,
            license: data.medicalLicense,
            language
        }));
        return content;
    }

    window.PdfTemplates = {
        buildFreeForm,
        buildMedicationCertificate,
        buildMedicalCertificate,
        buildReferral
    };
})();
