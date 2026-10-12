# Clinical Document Editor

A Word-like, local clinical editor for four built-in documents: Patient Referral Letter, Medical Certificate, Medication Certificate for Travel, and Free-form / Custom Letter.

The application opens directly into a referral. The interface is light and English; letter content can be Thai or British English. The document-template and letter-language dropdowns sit together in the main toolbar. Sarabun is bundled for both scripts.

## Use

1. Start typing in the automatically focused field; initial focus skips the document date. **Tab** / **Shift+Tab** follow document order through fields and **Add…** buttons. Fields select their values for replacement; insertion buttons open their block choices, except direct medicine/TMX/SMP commands. Tab from the last stop focuses **PDF Preview**; Tab from Preview returns to the document date.
2. Choice dropdowns open automatically beside the focused field and float over the document without changing pagination. Use **Up/Down** to highlight an option, **Enter** to apply and close, or **Tab** to apply and advance. Without a highlighted choice, Enter only closes and Tab advances without replacing the value. **Space** toggles multiple choices; mouse checkboxes/radios and **Apply selection** remain available. **Alt+Down** focuses catalogue search, and **Escape** cancels pending selections. Thai letters use the original Thai choice phrases; clinical terms and medicine names retain their original wording.
3. Tab to an **Add…** point, click it, or use **Insert Block** to insert whole related groups. Use **Up/Down**, **Space** for multiple blocks, and **Enter/Tab** to add and focus the first new editable field. With no selected block, Enter closes and Tab moves on. Fieldless blocks advance to the next stop when added with Tab. Tabbing to **Add medicine** or **Add TMX/SMP 80/400 mg** does not insert content; Enter, Space or a click adds it. TMX/SMP inserts directly without a selection menu. Add buttons disappear when every available block is included and return when a block is removed or insertion is undone; hidden buttons are skipped by Tab. All eleven original disease/history modules remain available; referrals start with none selected.
4. Use **×** to remove an occurrence and its associated phrase. Values remain in session memory; Undo or **Restore occurrence** restores it. Blocks and medicines can also be removed, restored and reordered.
5. Switch document type in place. Common facts carry across; each document retains its prose, formatting, pictures, sections, omissions and overrides. Unused information remains available when returning. When first opening the travel certificate, active named referral medicines are reused; other clinical details stay available in their original context.
6. Insert a local PNG/JPEG picture. Drag a bottom corner, use its Arrow keys, or choose a width to resize proportionally. Files are validated and re-encoded locally to remove metadata.
7. Preview, print or download a searchable PDF. Empty optional phrases disappear; final exports require applicable valid information. Export never clears any retained document.
8. The canvas keeps only the relevant insertion controls. Other medicines and whole identity/administrative blocks remain available through the toolbar’s **Insert Block** menu. The referral closing point offers admission and financial requests; the medical-certificate point excludes attendance and identity/physician blocks. Travel and free-form letters have no closing insertion button; the free-form body shows only **Start writing your letter here...** when empty.
9. **Clear Form** intentionally clears the whole patient session after confirmation, including inactive documents. It preserves the current document type/language and permitted doctor preferences.

Hover over a date or National ID field for its format and entry guidance. Full dates accept eight digits without slashes, with automatic CE/BE detection; TPT month/year fields accept six digits. National IDs accept 13 digits and gain the standard hyphens. Over-limit keystrokes are ignored; an over-limit paste is rejected with a message and preserves the existing value. Invalid dates remain editable and block final export. Patient details, clinical sections, requests and enclosures have additional spacing between groups; clinical bullet rows stay compact.

Dates, National IDs and NAP IDs format automatically. Structured dates display BE in Thai and CE in English. Exact DOB supports completed-year Age; Age remains editable with explicit recalculation. Scheduled Benzathine penicillin G dates have separate fields from documented administration. Medical leave includes both calendar dates. Doxycycline’s duration is already in its regimen choice; no second duration line is printed. TPT month/year precision is retained.

Referral wording uses the original GitHub templates and the user's saved legacy PDFs, with the requested opening and signature adjustments. Referral purposes are inline in the opening paragraph, before patient identification; there is no separate Additional details block. All eleven diagnoses/history modules share one clinical summary, using outer diagnosis bullets and nested clinical facts, medicines and injection dates. Its insertion point offers only those eleven modules. Original diagnosis names, canonical choice values and applicable validation remain. **CD4 at first visit** remains the required terminology. Thai labels use spacing rather than English colons, semicolons or sentence-ending full stops; entered prose, medical abbreviations, decimal doses and times are preserved. Inserting Retroviral Infection includes an editable medication-continuity bullet, defaulting collection to today and supply to 60 days. The optional prophylaxis command is labelled TMX/SMP 80/400 mg. Active Syphilis starts with today and the original Benzathine penicillin G option; dates remain explicitly scheduled, with manual overrides and recalculation. Existing entered values take priority. Original pick-up validation applies within HIV unless the date is explicitly omitted for duration-only wording.

Adding the medical-certificate examination block defaults its examination date to today, with CE/BE display and editable replacement selection. Entered or deliberately cleared dates survive removal/restoration; starting that block afresh explicitly restores the today default. An examination is not added automatically.

The formatting toolbar includes **− / +**, a horizontal zoom slider and a percentage readout from **50% to 200%**. Zoom changes only the view: A4 layout, field values, formatting, Undo and PDF output stay unchanged. The full enlarged page remains reachable by scrolling; picture dragging compensates for zoom. Zoom is held in page memory and follows template/language changes.

The **?** help control contains keyboard shortcuts, the current page count/A4/session-memory information and the PDF printed-layout note. The separate shortcut-hint and status bars are removed.

The medical-certificate title always stays **Medical Certificate** / **ใบรับรองแพทย์**, regardless of the selected examination, leave or actual-treatment sections. A manually edited title is preserved. Treatment history does not certify disease clearance; the tuberculosis date remains the documented completion date. English treatment statements spell out **tuberculosis**. Clinician-entered diagnoses and prose are never machine translated.

All four documents have one blank line after their title and one blank line before **Yours faithfully,** / **ขอแสดงความนับถือ**, followed by blank signing space, the plain physician name and medical licence number. The default signature stays together when it fits; manual page breaks remain available. Certificates use plain examination, leave and actual-treatment sentences. English introductions add **Dr** when the entered name has no recognised title, while retaining the original name in session data and the signature.

Referrals keep diagnoses together and other medicines, closing requests and enclosures separate. Latest laboratory results is included by default as an editable inline field; Tab, × removal and restoration work just like patient/addressee fields. Untouched default wording follows the letter language; manually entered wording stays unchanged. Redundant Notes / Additional Notes blocks and child note placeholders are removed; ordinary text stays freely editable, with Other Medical History and medical-certificate physician comments available. Legacy note definitions/values remain compatible in memory. Modules remain separate and can be removed, restored and reordered within their group. Thai enclosures are numbered; English enclosures use bullets. Other-medication quantities can include an explicitly selected tablet/capsule/bottle/unit; no unit is assumed when none is entered. The clinic name is **Public Health Center 28 Krung Thon Buri** in the letterhead and body. The supplied Public Health Center 28 logo replaces the previous header logo, with its display height preserved and width proportional. The PNG copy is bundled for offline PDF support; the user removed the source WebP. The original Health Department logo matches the footer text block’s full height on the right, retaining its proportions without increasing footer height or moving the existing text. Historical assets and samples remain available. The referral title uses **Medical Referral Letter**; referral-purpose choices preserve **HIV care and treatment** acronym casing.

Multiple-choice fields retain canonical options without empty leading entries, so mpox/TB lists and validation stay consistent. Default bullet paragraphs/lists use 2 pt after-spacing; ordinary paragraph spacing and deliberate formatting remain supported.

The optional financial-assistance paragraph politely requests consideration of available support, is OFF by default, and is inserted before the closing/signature. It does not promise coordination, funding or eligibility.

Patient values, pictures and all retained documents stay in page memory. Reloading/closing discards them. Only doctor names, licence and the letter-language preference use persistent browser storage. There are no saved patient drafts, patient databases or external writing/translation services.

## Development and production

Use Node 24 or a compatible version (Vite requires 20.19+ or 22.12+).

```bash
npm ci
npm run dev
```

```bash
npm run build
npm run preview -- --port 4000
```

Deploy `dist`. Source pages should be served through Vite. Fonts, editor code, templates and PDF libraries are local. Offline use requires an initial successful service-worker installation over HTTPS or localhost. Only static assets are cached; working documents and inserted pictures are not.

## Docker / Caddy

```bash
docker build -t letter-generator .
docker run --rm -p 4000:4000 letter-generator
```

Open `http://localhost:4000`. Node performs the build; the final container serves static files with Caddy. The existing multi-architecture workflow remains available.

## LAN HTTP troubleshooting

The editor and PDF generation support plain HTTP on a LAN address. Browser `crypto.randomUUID()` requires a secure context, so document IDs use `crypto.getRandomValues()` when the native UUID method is unavailable. This applies to initial fields, inserted placeholders, block menus, medicines and template reuse.

If an older image shows a partial screen with no toolbar/pages and `globalThis.crypto.randomUUID is not a function`, rebuild from the fixed source or pull the rebuilt image once it has been published, then recreate the container. The image tag alone does not update an already-running container. Offline service-worker caching still requires HTTPS or localhost.

[Diagnosis and executed container checks](docs/container-http-troubleshooting.md)

## Verification

```bash
npm test
npx playwright install chromium firefox
npm run test:browser
npm run test:pdf
```

PDF regression also needs Python 3 and Poppler (`pdfinfo`, `pdftotext`, `pdftoppm`). It preserves historical samples and compares every current PDF page against the original logo and an authorised typography reference. Twelve current samples include all four document categories, treatment-only medical certificates and compact referral wording samples in Thai/English. Medical certificates keep the same title in every sample. Its ignored raster output uses `pdf-results`, separately from Playwright's temporary files. To recapture original samples, run `node scripts/capture-legacy.mjs http://localhost:4001` against the original app: it checks served source, fonts, PDF library and logo against the pinned GitHub commit before generation. User-supplied PDFs are preserved and recorded separately.

[Original GitHub / legacy sample provenance](docs/legacy-sample-provenance.json) · [Master plan](docs/master-plan.md) · [Field migration](docs/field-migration-map.md) · [Section migration](docs/section-migration-map.md) · [Dependency audit](docs/dependency-audit.md) · [Language review](docs/template-language-review.md) · [PDF regression](docs/pdf-regression.md) · [Verification report](docs/verification.md)

The official logo, wording, contact details, margins and printed-date/page-number formats remain protected. Approved typography uses 9 pt clinic-name lines and 6.5 pt institutional/footer text. Body layout may differ between editor and pdfmake; PDF Preview is the final layout reference.

## Licence and clinical review

Project code is MIT. Packages and fonts retain their own licences; [distributed notices](public/third-party-notices.txt) and the [dependency ledger](docs/dependency-licenses.json) record them. No proprietary editor or paid runtime service is used.

Engineering tests do not constitute clinical approval. A qualified clinician should review the final wording and retained original medication/regimen catalogue before official deployment. Safari/WebKit and physical printer checks are reported separately in verification.
