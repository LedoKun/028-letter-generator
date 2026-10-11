# Template and language review

The interface is English and light. Letter-language switching updates untouched template prose, choice labels, BE/CE displays and the physician-name binding. Entered diagnoses and ordinary edited text are never machine translated.

## Verified original references

The referral's wording, choice values and hierarchy were reviewed in the [original GitHub source](https://github.com/LedoKun/028-letter-generator/blob/aa8599a19ca8045ff924428609084a4070e6ae6d/public/shared/pdf-templates.js), pinned to commit `aa8599a19ca8045ff924428609084a4070e6ae6d`. The running legacy app at `http://localhost:4001` matched the original template, generator, common/date utilities, referral HTML/script/catalogue and other generator scripts byte for byte. Its PDF library, logo and four original font files were also verified against that commit before capturing samples.

[Provenance](legacy-sample-provenance.json) records source hashes, fictional input files, print clock and generated PDF hashes. The legacy generator/template fixtures are unmodified original source; no modernised template or typography transformation was used to generate the ten original-code reference PDFs. Eight cover all four categories in Thai/English; two complete referral references cover all eleven original modules. The six PDFs saved by the user in `docs/samples/legacy` were also read for wording and preserved unchanged; their hashes and separate user-supplied provenance are recorded. Their individual original form inputs were not recreated.

The latest instructions take priority over earlier example letters. Referral clinical phrases and nesting follow the original code, with the explicitly requested changes below. Medical-certificate paragraphs retain the user's latest supplied wording; their title is now always **Medical Certificate / ใบรับรองแพทย์**. Travel wording uses the original confirmation of personal therapeutic use during travel. Free-form content remains authored by the clinician.

## Referral wording and structure

Referral purposes now occur directly after **ขอส่งตัวผู้ป่วยรายนี้เพื่อ** in the introductory paragraph, before patient identification. The English paragraph likewise refers the patient **for [selected purposes]**. The fixed duplicate intention and the separate “Additional details” paragraph are absent. The original continued-care option is phrased as “รับการรักษาต่อ” / “continued care” so it fits that sentence. An Other purpose selection exposes an inline free-text field and requires a value when selected; an already-entered custom purpose remains usable. Omitting both purpose fields gives a complete medical-summary opening.

One clinical summary contains exactly the eleven original diagnoses/history modules. Its contextual insertion point only offers those eleven. Diagnosis names remain in their original clinical terminology in Thai; English tuberculosis and tuberculosis preventive treatment headings expand the abbreviations for non-professional readers. Default bullet paragraph/list after-spacing is 2 pt; explicit paragraph spacing and the 44 pt signing space are preserved. Each diagnosis is an outer bullet, with its facts as nested bullets. ART medicine rows and the three injection dates have another level of indentation. Other Medical History retains the original single labelled bullet with editable multiline history. HBV Co-Infection, HCV Co-Infection and Treated Syphilis remain single diagnosis bullets without a repeated assertion.

Examples retained from the original source include:

- **ได้รับการวินิจฉัยครั้งแรกเมื่อวันที่** / **The diagnosis was first established on**
- **เริ่ม ART เมื่อวันที่** / **ART was initiated on**
- **ผลตรวจ HIV VL ล่าสุดเท่ากับ** / **The latest HIV VL was**
- **เคยได้รับการรักษาด้วยสูตรยา** / **The patient was treated with**
- **รักษา HCV ครบเมื่อวันที่** / **HCV treatment was completed on**

At the user's latest request, Thai referrals label the reported value **ART adherence** (without “of”). English retains **The patient reported ART adherence of**. This also applies to the production compatibility generator; original GitHub fixtures and legacy PDF references remain unchanged.

CD4 retains the requested exception: **CD4 at first visit**, **CD4 percentage at first visit**, **Date of CD4 test at first visit**, and their specified Thai counterparts. Legacy `initialCD4`, percentage/date mappings and free-text qualifiers remain supported. The first-visit value is not reclassified as the latest CD4. Partial dates use “in” / “เมื่อ” without inventing a day.

Inserting Retroviral Infection always includes the original medication-continuity bullet:

> ผู้ป่วยรับยาครั้งล่าสุดเมื่อวันที่ [วันที่] โดยมียาเพียงพอสำหรับ [จำนวนวัน] วัน

> The patient last collected medication on [date], with a [number]-day supply.

At the user's explicit request, a newly inserted block defaults to today and 60 days. Both fields stay highlighted, editable and keyboard-accessible; previously entered values and deliberate manual clearing are retained. Date-only, duration-only and neither-value output are handled without a heading, unsupported details or dangling punctuation. OI prophylaxis is independently optional. Existing ART/pick-up blocks are reused inside a newly inserted Retroviral Infection block without duplication or lost medicine rows/prose. ART tablet count and administration time remain unfilled; as in the original code, an entered tablet count with no time displays “วันละ 1 ครั้ง” / “once daily”.

Active Syphilis defaults its start date to today and uses the original first regimen choice, **Benzathine penicillin G 2.4 million units IM**. The original alternative doxycycline choices are retained without a dosing change. Duration is already stated in those choices, so the separate duration bullet is removed; its canonical 14/28-day calculation remains compatible. The nested schedule says **กำหนดฉีด Benzathine penicillin G เข็มที่ 1 [วันที่]**, etc., and **Scheduled Benzathine penicillin G dose 1 on [date]**, etc. The full medicine name is used in the document and field labels. The old abbreviated regimen input remains accepted for compatibility. Calendar calculations are Day 0/7/14 only for the selected Benzathine regimen; manual overrides require explicit recalculation. These are scheduled dates, not an administration record.

Latest laboratory results / ผลตรวจทางห้องปฏิบัติการล่าสุด is included by default in referrals as an inline text field, with highlighting, keyboard navigation, × removal and restoration. Default text switches language; edited text is not translated. The prophylaxis selection is labelled TMX/SMP 80/400 mg in both languages, retaining the original tablet and Other prophylaxis fields. Other medicines, admission/financial requests and enclosures remain independent. The redundant patient-details/co-infection/request subtitles, generic Additional Notes block and child Notes fields are removed. Their canonical definitions/values remain compatible in memory; freely edited prose, Other Medical History and certificate physician comments remain available. The referral canvas no longer has generic patient/administrative or Other Medications insertion buttons; the toolbar preserves those functions. Its closing-request menu contains only admission and financial requests. The medical-certificate contextual menu offers only examination, leave, syphilis treatment and tuberculosis treatment. Physician comments, document date, addressee, attendance and identity blocks remain available through the main catalogue. Travel and free-form closing insertion points are removed; the free-form body has only its empty-body English writing hint. The contact paragraph precedes enclosures and the common signature. Thai enclosure lists are numbered continuously; English enclosure lists use bullets.

## Other documents and conditional meaning

The ergonomics revision changes spacing, not clinical wording: patient identification, summary/enclosures headings, examination/treatment/leave paragraphs and closing requests use 8 pt before their groups. The subject has 8 pt after it. Nested clinical bullet rows retain 2 pt spacing and the signing space retains 44 pt. These margins are supported in both the editor and PDF output; no extra headings or clinical statements are inserted.

| Document / item | Wording and safeguards |
| --- | --- |
| Medical Certificate | The title always stays Medical Certificate / ใบรับรองแพทย์, including treatment-only letters and Undo/Redo. Manual title edits are preserved. The supplied “I, Dr … hereby certify …” opening and plain examination/findings/diagnosis/leave/treatment paragraphs are retained. The Thai physical-examination claim appears only with an included examination and valid date. |
| Examination and leave | Findings and diagnosis remain editable. Examination date is required for an included examination assertion. Medical leave counts both calendar endpoints and rejects invalid ranges. Generic leave notes are removed; ordinary prose can be edited. |
| Actual treatment | Certificate syphilis treatment and completed tuberculosis statements use separate documented dates. Scheduled injection dates are never imported as administered doses. Treatment-only certificates do not claim examination, fitness for work or disease clearance. English spells out tuberculosis. |
| Travel medication certificate | Original confirmation of the patient's care and personal therapeutic use during travel. Original medicines/Other, nationality/Other and identity fields remain; at least one named medication and applicable Other details are required. No dose, fitness-to-fly or immigration statement is invented. Generic Additional Notes is removed; the body remains editable. |
| Free-form letter | Default Medical Notes / บันทึกข้อความ, editable addressee and rich body. Optional identity/signature fields omit cleanly. Body validation ignores empty optional groups and insertion controls. |
| Mpox | Original symptom/risk categories and Other details remain. “ผู้ป่วยไม่ให้ประวัติความเสี่ยง” / “The patient did not report any risk factors” requires the explicit no-risk-reported selection and does not assert a patient denial. Diagnosis remains suspected. |
| Historical HCV/tuberculosis and TPT | Separate original condition/status modules. Completion statements only use entered completion dates. Completed/ongoing preventive treatment remains distinct, with month/year precision. Generic child notes are removed; clinical prose stays editable. |
| Omission | Empty or removed fields/sections do not imply a negative clinical finding. Canonical data stays in memory for reuse/restoration. Removed field occurrences cannot leave unsupported headings in the PDF. |

Choice values retain all 17 ART entries, three syphilis regimens, mpox symptoms/risks, tuberculosis sites, TPT regimens, medication schedules and original identity choices. Thai choices use Thai phrases except preserved clinical terms/medicine names. Empty multi-selection entries are discarded at selection/normalisation and excluded from rendering; meaningful unknown entries still validate as unsupported. Conditional Other details and exclusive no-risk reporting remain enforced. Multiple selections use the original natural list pattern: comma-separated items with a final “และ” / “and”. Thai authored prose avoids English colons, semicolons and sentence-ending full stops. Entered prose, medical abbreviations such as น., decimal doses, times and the protected official header/footer are preserved.

Original selected-language physician validation is retained for referrals, with optional licence there. Applicable regimen/duration/symptom/risk/Other/date/time validation remains. Explicit pick-up date omission permits duration-only output; it does not indicate no collection occurred. Original Other-attachment selection can print a generic other-documents enclosure without a description. Unnamed included medicines and missing required Other details block final export.

All four documents use local Sarabun, bold centred 16 pt titles, 11 pt body text, the authorised 9 pt clinic-name lines and 6.5 pt institutional/footer text. The common signature has one blank paragraph before **Yours faithfully, / ขอแสดงความนับถือ**, then 44 pt of blank signing space, the entered plain physician name and the licence number. No signature/name labels, dotted line or physician-name parentheses are added. Existing recognised English doctor titles are not duplicated. The user-authorised clinic name is “Public Health Center 28 Krung Thon Buri” in both the body and protected letterhead. The English name separator is removed and the user-supplied clinic logo replaces the former logo at its original display height, with proportional width. The header text typography and protected content remain as approved. At the user’s subsequent request, the original Health Department logo is also displayed proportionally on the right of each official footer at the text block’s full height, without increasing footer height or changing existing text positions. Referral titles use “Medical Referral Letter”, and purpose choices retain “HIV care and treatment” acronym casing. All four template titles are followed by one empty paragraph, also retained in PDF output.

## Financial assistance

OFF by default, deliberately inserted before the closing/signature for referral/free-form documents. The approved paragraphs remain:

> ทั้งนี้ หากเห็นสมควร ขอความอนุเคราะห์ทีมของท่านพิจารณาแนวทางให้ความช่วยเหลือด้านค่าใช้จ่ายในการรักษาหรือด้านสังคมสงเคราะห์ที่เหมาะสมสำหรับผู้ป่วยเพิ่มเติมด้วย

> Where appropriate, we also kindly request that your team consider any available financial assistance or social welfare support for this patient.

The withdrawn coordination offer is absent. No poverty, eligibility, approval or funding obligation is asserted.

## Approval status

This is an engineering/editorial review, not clinical approval or a dosing recommendation. A qualified clinician has not approved the final wording or retained original medication/regimen catalogue. Earlier external template searches were background only; the wording authorities for this revision are the verified original GitHub source, the user's legacy PDFs and explicit later instructions. Review the [current Thai referral](samples/current/referral-wording-th.pdf), [current English referral](samples/current/referral-wording-en.pdf), [medical certificate](samples/current/medical-en.pdf) and [original-code references](samples/legacy) before clinical deployment.

Adding the medical-certificate examination block now presets today’s exact date, formatted in the letter language. This default is editable and does not overwrite existing or deliberately cleared information. The template still requires deliberate examination-block inclusion before asserting examination.
