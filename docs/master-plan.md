# Clinical Document Editor — Consolidated Master Plan

Repository: `LedoKun/028-letter-generator`

Status: review plan. This document describes the intended final behaviour, not a claim that the latest changes have been implemented or verified. Latest user decisions take precedence over conflicting earlier decisions. Enhance the existing application and reuse its working editor, canonical fields, date utilities, clinical catalogues and pdfmake infrastructure.

Final wording amendment (10 October 2026): referral clinical phrasing and hierarchy now use the **original GitHub code**, verified against the legacy app at localhost:4001 and the user's six saved PDFs. The current request supersedes earlier supplied referral examples where they conflict: purposes belong inline in the opening, no separate Additional details block, all eleven diagnoses in one summary with nested bullets, full Benzathine penicillin G wording, today as treatment-start and HIV pick-up defaults, 60-day HIV supply, latest laboratory results included by default, and no redundant child notes or Additional Notes block. Legacy note definitions remain compatible; free prose, Other Medical History and certificate physician comments remain available. **Medical Certificate / ใบรับรองแพทย์** is the only medical-certificate title, irrespective of included sections. Earlier detailed requirements below are subject to this amendment. Clinical field identity/validation, first-visit CD4 terminology, separate scheduled/administered dates, shared in-memory data and the plain common signature remain required. See [template-language-review.md](template-language-review.md), [legacy-sample-provenance.json](legacy-sample-provenance.json) and [verification.md](verification.md).

11 October 2026 amendment: remove referral patient/administrative and Other Medications canvas buttons, and physician information from the closing-request menu. Keep their workflows in the main Insert Block catalogue. Latest laboratory results becomes a highlighted editable default field with omission/restoration and language-aware untouched wording. Use TMX/SMP 80/400 mg for the prophylaxis menu. Fix empty multiple selections and their validation without dropping unknown entered values. Use 2 pt default bullet after-spacing while preserving explicit formatting and signature/header/footer spacing. Doxycycline keeps its existing regimen duration/calculation without a duplicate duration paragraph. The medical-certificate insertion point excludes attendance, identification, DOB/Age and physician information. Travel/free-form closing buttons are removed; free form keeps only its empty-body writing hint and immediate body typing. Earlier controls in this historical plan are superseded by this amendment.

Signature/body amendment (10 October 2026): all four documents use the requested courteous closing, blank signing space, plain physician name and licence number. Certificates use plain examination, leave and documented-treatment sentences; English introductions prefix Dr contextually. Referrals group medically distinct modules without merging their data. Thai enclosures are numbered; optional medicine quantity units are selected explicitly. Official header/footer content stays protected.

## 1. Final workflow

Open directly into Referral Letter → type immediately → Tab through placeholders → choose values beneath the relevant placeholder → insert only relevant blocks → edit prose and formatting → switch document types without losing session information → preview, print or download → deliberately clear the patient session when finished.

Keep exactly four built-in document types:

1. Patient Referral Letter.
2. Medical Certificate.
3. Medication Certificate for Travel.
4. Free-form / Custom Letter.

Remove the template-selection page. Opening the root application starts a referral; existing direct document links continue to open their corresponding document. There are no user-created reusable templates or persistent patient drafts.

## 2. Interface and typography

Use a light interface with white A4 pages. Application labels, buttons, menu titles, search controls, validation and shortcut help remain English. Document content can be Thai or British English.

Replace “← Select Template” with an in-place dropdown containing the four document types. Place the Thai/English letter-language selector immediately beside it. Remove the separate app bar. Centre the branding in the main toolbar and hide the branding when space is limited.

The main toolbar provides template selection, letter language, current document type, Undo, Redo, Clear Form, PDF Preview, Print, Download PDF and Keyboard Shortcuts Help. Formatting provides bold, italic, underline, font size, paragraph styles, alignment, bulleted/numbered lists, indentation, paragraph spacing, Insert Block, Insert Picture and Manual Page Break. Expose commands only when their output can be represented reliably in PDF.

Use local Sarabun regular, bold, italic and bold italic for Thai and English. Titles are prominent, bold and centred; target 16 pt titles and 11 pt body text. Use bold “เรียน”, “To” and subject prefixes where applicable. Patient identification follows the document headers, including title, addressee and subject.

Protect the official header/footer from editing. Preserve the original logo, wording, contact details, rules, margins, positioning, printed-date format, stamp-validity statement and page numbering. Apply only the authorised typography changes: both official clinic-name lines at 9 pt, institutional text and footer at 6.5 pt, with the shared font family. The editable physician signature block remains in the document body.

## 3. Shared session and template switching

Separate four concepts: built-in document type, document block, placeholder and canonical data.

| State | Behaviour |
| --- | --- |
| Shared patient/physician facts | Name, DOB, identity numbers, nationality, doctor names, licence and other directly equivalent facts are reusable. Changes to a shared fact update its bound occurrences across documents. |
| Clinical data | Retain laboratory results, histories, medicines, calculations and other entered facts even when the active template has no corresponding visible field. Reuse only fields with compatible clinical meaning and precision. |
| Each document’s editing state | Retain its body text, formatting, pictures, included/removed blocks, archives, omission settings and context-specific values/overrides. |
| Active document | Determines visible content, applicable validation, calculations and the PDF snapshot. |

On first opening another template, populate compatible fields from the active patient session. On returning to an already edited template, restore its existing document and retained data rather than recreating its default body. Shared facts reflect the latest entered value; document-specific prose and clinical context are preserved. Restore the previous editing position where possible; new documents autofocus their first applicable placeholder.

Switching templates is non-destructive and needs no discard warning. It does not automatically insert diseases, factual assertions or irrelevant sections. Scheduled Benzathine penicillin G dates remain distinct from records of administered treatment. Month/year information never becomes an invented complete date.

All patient information, pictures and retained documents exist in memory only. Reloading or closing discards the session; warn before those actions would discard edited work. Only permitted doctor preferences and the letter-language preference may be stored persistently. Remove legacy patient-data persistence and never silently restore a previous patient.

## 4. Inline placeholders and selections

Use structured editor-native placeholders backed by stable canonical IDs and explicit mappings to legacy field IDs. Maintain labels, types, applicable templates/blocks, validation, formatting, dependencies, values, calculation status and omission state independently of their visible occurrences.

Empty and filled placeholders remain highlighted in the editor. Focused, calculated, manually overridden and invalid states remain distinguishable. Repeated occurrences synchronise; field changes must not regenerate surrounding manually edited prose.

Focus the first included editable field after the document date without a click. Tab and Shift+Tab follow visible document order, including populated fields, calculated Age and applicable Benzathine penicillin G dates. Select the complete value for replacement and skip omitted/inapplicable fields. The last field tabs to PDF Preview; Tab from Preview returns to the document date. Shift+Tab at the first field leaves the editor. Retained template states preserve their previous editing position.

Provide one selection pattern for document fields and blocks: a dropdown anchored near the placeholder or insertion point, floating outside document pagination. Choice fields open automatically on focus. Up/Down highlight an option; Enter applies and closes, and Tab applies and advances. Without a candidate, Enter closes and Tab advances without clearing the value. Space toggles multiple choices; mouse selection, search and free-text/Other entry remain available. Long lists scroll inside the menu without moving document text or creating pages. Escape cancels pending selection and returns focus without immediately reopening the menu.

Date fields have English hover/accessibility hints for DD/MM/YYYY, automatic CE/BE detection and slash-free entry. TPT retains its MM/YYYY precision. Limit full-date entry to eight digits/ten formatted characters and month/year entry to six digits/seven characters. National IDs have a format hint and a thirteen-digit/seventeen-character limit. Reject oversized pastes without changing existing values; retain invalid bounded entries for correction. Add 8 pt before major letter groups while preserving 2 pt bullet spacing and 44 pt signing space.

Application action labels remain English. Document-facing choice phrases use the letter language: original Thai resources for Thai letters and English resources for English letters. Preserve original clinical terms, medicine names and regimen names where they were authored as medical terminology. Template and formatting dropdowns remain English application controls. Do not machine translate clinician-entered diagnoses or prose.

Every placeholder gets an accessible × control. It removes that visible occurrence and its associated semantic label/phrase/punctuation, retains the underlying value and unrelated information, and supports Undo/restoration. A remaining occurrence of the same field stays bound. Required-information checks still apply before final export. Keep distinct actions for clearing a value, omitting a field, removing an occurrence/all occurrences and converting an occurrence into ordinary text.

Show concise shortcut guidance near the toolbar and provide accurate help for implemented commands, including Tab, Shift+Tab, Undo/Redo, bold/italic/underline, opening choices and Escape. A print shortcut generates/prints the PDF.

## 5. Blocks and visible insertion points

Use one searchable Insert Block catalogue instead of separate Insert Field and Insert Clinical Section workflows. Choosing a field concept inserts its whole related block with all relevant placeholders. Permit multiple blocks in one insertion operation.

Display non-printing, clickable insertion placeholders where information belongs:

| Document | Insertion places |
| --- | --- |
| Referral | Clinical information after the opening; medicines in their lists; attachments, notes, admission and financial requests before the closing/signature. |
| Medical certificate | Examination/findings/diagnosis, documented treatment, medical leave, physician comments and an explicitly selected attendance statement. |
| Medication travel certificate | Additional medicines in the medication list and optional notes. |
| Free-form letter | Supported blocks within the body and optional administrative statements before the closing. |

Clicking an insertion placeholder opens the same dropdown beneath that point. Toolbar insertion uses the relevant document insertion position. Empty block controls are editing aids and never printed assertions or empty PDF headings.

Blocks support editing, removal, restoration, Move Up/Move Down and Undo/Redo. Medication entries support the same operations. Removing a block removes its visible content and Tab stops, excludes it from PDF and reflows pages while preserving its entered values and edited content. Reinsertion restores wording, bindings and formatting; an explicit start-afresh option resets only the chosen block’s relevant content/data and makes any effect on shared values clear.

Use real bullets for clinical details beneath multi-detail headings, including the supplied HIV example. Diagnosis-only blocks such as HBV/HCV co-infection show one concise diagnosis line rather than repeating a heading as a second sentence. Preserve their distinct block identities. Administrative requests and closing text remain paragraphs. Empty optional items leave no blank bullets.

## 6. Referral: restore the original clinical content

Use the original referral phrasing, blocks, placeholders, options, calculations and validation as implemented in the original HTML and scripts. Audit the original source and retained fixtures rather than relying solely on the README or current replacement templates. Do not substitute newly invented disease wording. Preserve explicit agreed exceptions: CD4 at first visit terminology, no disease sections by default, clean omission, the new editor workflow, optional financial assistance, typography and in-memory state.

Keep original diagnosis names and medical terminology. Preserve clinician-entered diagnosis text exactly. In English template prose, expand unexplained TB to tuberculosis; retain the original identifier/term where needed for compatibility. Preserve “CD4 at first visit”, its percentage and test-date labels consistently, with legacy internal identifiers mapped.

| Original module | All details to retain |
| --- | --- |
| HIV / Retroviral Infection | NAP-ID, initial diagnosis, ART start, CD4 at first visit/count/percentage/date, adherence choices, latest viral load/date, current ART catalogue and repeatable medicines, tablet counts, administration times, OI prophylaxis, TMX/SMP quantity, last pick-up, days supplied and notes. |
| Active Syphilis | Start date, original Benzathine penicillin G/doxycycline choices, applicable three-dose schedule, duration, overrides and notes; scheduled versus administered status stays distinct. |
| Suspected Mpox | All original symptoms, duration and risk choices; conditional Other details; explicit no-known-risk choice; preserve suspected status. |
| HBV Co-infection | Original condition wording and clinician-entered additional prose, without invented investigation or treatment facts. |
| Active HCV Co-infection | Original active condition, kept separate from treated HCV. |
| Previously Treated Syphilis | Original historical condition, without conversion to active treatment. |
| Previously Treated HCV | Regimen, completion date and historical wording. |
| Previously Treated TB | Multiple disease sites, Other site, regimen and completion date; expand tuberculosis in English prose. |
| Completed TPT | Original regimen/Other choices, month/year start, notes and completed status. |
| Ongoing TPT | Original regimen/Other choices, month/year start, notes and ongoing status. |
| Other Medical History | Free text with paragraphs/line breaks. |

Also preserve all original referral purposes and multiple/custom selection, referral versus medical-summary behaviour, independent ART/OI/pick-up/supply blocks, independent Other Medications with name/strength/OD/BID/TID/QID/PRN/quantity, admission request, latest laboratory attachments, other attachment descriptions and independent additional notes.

A new referral contains date, headers, patient identification, referral purpose, original basic prose, closing and physician details. It starts with no disease blocks, admission claim, attachment claim or financial request. Integrate custom purpose naturally in the subject rather than printing a disconnected “additional purpose” label.

## 7. The other three documents and wording review

Review all four document types and every optional block, using the original referral as its wording authority and comparable public Thai/English resources for the other documents. Write natural surrounding prose without runtime translation, unsupported medical assertions or unintended changes of tense/status. Preserve manually edited wording on field updates and language changes.

**Medical certificate:** retain certificate date, salutation/Other, name, sex, editable Age, passport, National ID, optional DOB, examination/date/diagnosis inclusion, inclusive medical leave/dates/notes, documented syphilis treatment/date/notes, documented TB completion/date/notes, physician comments and Thai/English doctor names/licence. Adapt the supplied Thai sample’s “ข้าพเจ้า…”, “ใบอนุญาตประกอบวิชาชีพเวชกรรมเลขที่…”, “ได้ตรวจร่างกาย…”, “อาการที่ตรวจพบ”, “การวินิจฉัยของแพทย์”, “ความเห็นและข้อแนะนำของแพทย์”, medical-leave and issue-date phrasing. Add optional examination findings. An attendance statement is explicitly selected and supported by an entered encounter date. Use the clinic identity and retain the original protected letterhead; copy no patient identifiers, university branding, signature or stamp from the sample. English certificate prose uses readable terminology including tuberculosis. Examination and administration statements depend on actual entered facts.

**Medication travel certificate:** retain date, salutation/Other, name, DOB, nationality/Other, passport, original medication choices/Other, repeatable entries, notes and both doctor names/licence. Use clear certification for personal therapeutic medicines during travel; never invent dosing, assert fitness to fly or automatically disclose diagnoses. Require a named medicine according to the certificate’s purpose and original validation.

**Free-form letter:** retain date, editable title, addressee, freely editable body and doctor details. Use “Medical Notes” / “บันทึกข้อความ” as safe defaults. Supported patient/clinical/administrative blocks are inserted deliberately. Preserve its optional physician/identity fields and omit empty labels.

Use safe defaults such as today’s document date and the free-form title. Preserve original choices and deliberate presets. Entered/selected facts or valid calculations support clinical doses, event dates and supply durations; do not silently manufacture clinical information.

Sources for the editorial review include the user’s sample, [Thai Department of Mental Health referral examples](https://dmh.go.th/YamDMH/MainWeb/PdfHandler.ashx?file=somdet3.pdf&folder=WebDMH), [Chiang Mai University medical-certificate examples](https://w1.med.cmu.ac.th/commed/wp-content/uploads/2023/10/20230425_V3_-Extern%E0%B9%83%E0%B8%9A%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B9%81%E0%B8%9E%E0%B8%97%E0%B8%A2%E0%B9%8C.pdf), [NHS referral guidance](https://gps.westandnorthlondon.icb.nhs.uk/referral-support/standard-referral-form), [NHS travel-letter guidance](https://www.fitfortravel.scot.nhs.uk/advice/general-travel-health-advice/travelling-with-medicines), [Department of Medical Services memo examples](https://diamed.dms.go.th/wp-content/uploads/sites/12/2025/09/%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%A1%E0%B8%84%E0%B8%B9%E0%B9%88%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B9%81%E0%B8%99%E0%B8%A7%E0%B8%97%E0%B8%B2%E0%B8%87.pdf), and [NHS plain-language correspondence guidance](https://service-manual.nhs.uk/content/writing-nhs-messages). These are editorial references, not certification of this application or its wording.

## 8. Optional financial assistance

OFF by default; available in referral and deliberately in free-form letters. Insert before the closing/signature, alongside admission/notes as appropriate. Support editing, removal, restoration and reordering. Retain the approved wording:

Thai: “หากเห็นสมควร ขอความอนุเคราะห์ทีมของท่านให้คำแนะนำเกี่ยวกับแนวทางสนับสนุนด้านค่าใช้จ่ายในการรักษาหรือด้านสังคมสงเคราะห์ที่เหมาะสมสำหรับผู้ป่วย”

English: “Where appropriate, I would welcome your team’s advice on any financial assistance or social welfare support that may be available to this patient.”

Do not restore the withdrawn offer to coordinate. This requests advice and does not assert inability to pay, eligibility, approved funding or an obligation to provide support.

## 9. Calculations, formatting and omission

Structured dates accept CE and BE; normalise valid completed values once to Gregorian canonical data and display BE in Thai/CE in English. Retain full-date, month/year and year-only precision. Apply conversion on completion/blur/language changes without interrupting incomplete typing or Thai composition. The original official footer’s date format remains unchanged.

Format National ID and NAP-ID separators without truncating invalid input. Retain the original ID format/validation; do not claim that formatting verifies identity. Ordinary clinical prose and unrelated numbers are unchanged.

Calculate completed-year Age from exact DOB and the relevant encounter/examination date, otherwise the document date. Age remains highlighted, editable and a Tab stop. Preserve manual overrides and offer explicit recalculation; missing, partial, invalid or future DOB does not produce a fabricated age.

For the original applicable three-dose Benzathine penicillin G regimen, calculate start/start+7/start+14 calendar days. Preserve alternative doxycycline choices, editable schedule dates, manual overrides and explicit recalculation. Medical leave remains inclusive of both calendar dates and rejects reversed ranges. TPT month/year remains partial.

Use the original referral validation rules and documented context-specific requirements for the other templates. Missing/invalid required information gives clear feedback and blocks final print/download; a warned preview remains available. Removing a field does not silently bypass required-information validation.

Use structured semantic phrase groups for omission. Empty/omitted optional passport, National ID, CD4 details, viral-load clauses, medication pick-up/supply, medicines, attachments and notes remove their associated labels/punctuation/headings cleanly. Required data uses validation rather than N/A. Missing or omitted information is never a negative finding.

## 10. Images and genuine A4 layout

Keep local PNG/JPEG insertion with validated type, encoded/decoded dimensions and size, local decoding/re-encoding and no remote processing. Pictures and their descriptions/captions stay in session memory.

Provide corner resize handles with the original aspect ratio locked; a simple width control may also be retained. Constrain images to the printable A4 body, preserve proportions in editor and PDF, and support removal/restoration/Undo. There is one proportional resize mode.

Maintain genuine A4 portrait pagination: automatic overflow/new pages, reverse reflow, manual breaks, Thai/English wrapping, lists, fields, images, cross-page navigation and stable selection/history. No content overlaps protected header/footer areas. Editing controls are excluded from PDF. PDF remains the authoritative final printed layout; verify consistency without claiming untested pixel-perfect body parity.

## 11. Export, reset and deployment

Convert the structured editor document to selectable/searchable pdfmake text and deliberately inserted images. Preserve supported body formatting, original protected header/footer and selected clinical facts. Exclude placeholder highlights, × buttons, dropdowns, insertion prompts, shortcut hints, validation decorations, empty optional content and removed blocks.

Preview is on demand and reflects the current document. Preview, closing preview, printing/cancelling, downloading and export errors preserve the active document, shared values and all inactive retained documents.

Provide one Clear Form action. After edits, its confirmation explicitly explains that it clears the whole patient session, including unused data, pictures and retained documents in other templates. On confirmation restore fresh built-in bodies, clear patient/clinical/medicine data, archives, calculations and overrides, and remove inserted optional/financial blocks. Preserve selected type, language and permitted doctor preferences, then autofocus. Cancelling preserves everything. Template switching never invokes Clear Form.

Reuse free/open-source Tiptap/ProseMirror, Vite, Tailwind and pdfmake. Preserve Docker/Caddy static deployment and offline assets/fonts/PDF generation. Use no paid extensions, proprietary pagination, cloud editor, external translation/writing API or patient-data backend. Audit licences, compatibility, maintenance, security and transitive obligations for any dependency changes. Cache static application assets only, never working patient documents or images.

## 12. Implementation sequence

1. Re-audit original referral phrasing, full field/section inventory, medication options, defaults, calculations and script-level validation. Record intentional exceptions and protected header/footer baseline.
2. Implement shared canonical session state plus retained per-template documents, in-place switching, common-field synchronisation and confirmed whole-session Clear Form.
3. Apply the light interface and final toolbar/typography. Unify document choices beneath placeholders, implement × removal and visible contextual block insertion points.
4. Restore original referral content and validations; preserve every module/workflow; implement clinical bullets without duplicate diagnosis lines; adapt the medical certificate and review the other documents.
5. Finish proportional image resizing and verify all date/ID formatting, clinical calculations, omission, navigation and manual-edit preservation.
6. Verify pagination and clean non-destructive PDF output with the approved 9 pt clinic-name reference. Test every document in Thai and English.
7. Run unit/browser/PDF/deployment/offline checks, fix failures and update documentation and fictional samples. Record actual results and unresolved limits.

## 13. Verification and deliverables

Run meaningful unit/integration and browser tests covering:

* Default referral opening; all four template choices; typing immediately; first focus; Tab/reverse Tab/replacement selection; boundaries; calculated fields; Thai composition; keyboard-accessible menus and × controls.
* Shared fields across all template pairs, edits made in either document, unused clinical values, manually edited prose, images, removed blocks and overrides after switching away/back. Switching does not insert unsupported clinical statements. Confirmed Clear Form clears all retained patient documents; cancellation does not.
* Every original disease/history module’s fields, insertion, removal, restoration, reorder and Undo/Redo; multiple insertion; ART/OI/TMX; all medication rows/catalogues/times/quantities/frequencies; pick-up date/duration combinations; purposes, admission, attachments and notes.
* Original referral validation parity; context-specific required fields; invalid input retention; date/ID formatting; BE/CE and precision; age/date boundaries/leap days/manual override; Benzathine penicillin G regimen/schedule/override; inclusive leave and TPT partial dates.
* Original diagnosis preservation, required first-visit CD4 labels, English tuberculosis wording, sample-based Thai certificate phrases, conditional examination/attendance facts, clinical bullets, no duplicate HBV/HCV statement and correct Thai/English selection phrases.
* Smart omission and restoration, required fields after × removal, no N/A/empty labels/blank bullets/dangling punctuation, and no fabricated negative findings.
* Proportional image dragging/width limits, unsafe-file rejection, pagination/no clipping, pictures and formatting retained through Undo, switching and PDF output.
* Preview/download/print/cancellation/errors preserving all documents; searchable Thai/English PDFs; no editing decorations; original logo/wording/margins and authorised header/footer typography on every page.
* Production build, Docker/Caddy startup, all document routes, local fonts/assets, offline editing/PDF generation, no patient-state caching/persistence and dependency/licence checks.

Maintain the working application and update:

* `README.md`.
* `docs/field-migration-map.md` and `docs/section-migration-map.md`, including actual child behaviours, validation and tests.
* `docs/dependency-audit.md` and distributed licence notices.
* `docs/template-language-review.md`, with sources, decisions and review status.
* `docs/pdf-regression.md`, approved typography reference and machine results.
* Fictional Thai/English PDF samples for all four document types.
* `docs/verification.md`, recording commands actually run, passed/failed/skipped checks, platform coverage and genuine limitations.

Do not report planned checks as passed. Actual results are recorded in verification.md. A qualified clinical editorial approval has not been obtained; record that status explicitly before official clinical deployment.
