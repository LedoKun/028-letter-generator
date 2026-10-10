# Dependency audit

Reviewed against the lockfile and installed licence files on 10 October 2026. The application runs entirely in the browser; no editor, patient content, images or PDF generation use a remote service. The complete locked-package ledger is [dependency-licenses.json](dependency-licenses.json); distributed notices are [../public/third-party-notices.txt](../public/third-party-notices.txt).

| Component | Version | Licence and identity | Use and compatibility |
| --- | --- | --- | --- |
| `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit` | 3.31.4 | MIT; installed `LICENSE.md`; [Tiptap source](https://github.com/ueberdosis/tiptap) | Vanilla JavaScript, ProseMirror transactions, fields, history and formatting. Version-matched packages; no Pro extensions, Pages service, React or cloud collaboration. |
| `@tiptap/extension-text-align`, `@tiptap/extension-text-style` | 3.31.4 | MIT; installed licences | Alignment and font-size commands; matching PDF conversion. |
| Vite | 8.3.4 | MIT; installed licence and bundled third-party notices; [source](https://github.com/vitejs/vite) | Build/development only. Supports Node 20.19+ or 22.12+; Docker uses Node 24. Browser output is static. |
| `@playwright/test` | 1.64.0 | Apache-2.0; installed licence; [source](https://github.com/microsoft/playwright) | Development tests only. Chromium and Firefox exercised. WebKit requires ICU/JPEG libraries missing on the current host. |
| Sarabun regular/bold/italic/bold italic | Repository TTF assets | SIL OFL 1.1; [source and licence](https://github.com/google/fonts/tree/main/ofl/sarabun) | One family covers Thai and English in the interface and PDF. All four actual styles are local. Font files are unmodified; the licence is shipped. |
| Existing pdfmake | Vendored 0.3.9 | MIT; [source](https://github.com/bpampuch/pdfmake/tree/0.3.9); vendored licence added | Retained. Local fonts/logo, selectable PDF text, local images. No PDF conversion service. |
| Existing Tailwind CLI / CSS | 4.3.3 | MIT | Retained build pipeline. `@parcel/watcher` is overridden to 2.6.0 to remove the vulnerable older micromatch/braces chain found during the audit. |

## Pagination evaluation

* `tiptap-pagination-plus` 3.1.0 declares MIT and accepts Tiptap 2 or 3. Its published source and a browser proof were inspected. After fonts loaded, its page count could lag behind the last paragraph until another transaction: a six-page decoration set left the final field beyond its last footer. It was evaluated temporarily and removed. The historical proof is retained in `tests/fixtures/pagination-poc.html`; it needs the evaluated package to run independently.
* `@adalat-ai/page-extension` 1.0.9 declares MIT, but its published peer dependencies require Tiptap 2 and React/React DOM. It was not installed because this application uses vanilla Tiptap 3.
* The selected pagination is repository-owned ProseMirror layout code. Measured spacers reserve real A4 header/footer and page-gap areas; text is moved before overflow, rather than drawn beneath decorative page borders. The document positions and history are unaffected. Fonts, picture loading, list boundaries, deletion and manual page breaks trigger reflow. PDF remains the authority for printed layout.

Sources: [pagination-plus repository](https://github.com/RomikMakavana/tiptap-pagination-plus), [page-extension repository](https://github.com/adalat-ai-tech/tiptap-pages).

## Transitive licensing, security and deployment

The locked ledger records package identity, exact version, licence, optional platform status, installed status and source location for every package. Installed licence/notice files were collected; alternative platform packages use their locked published licence metadata. The licence set is MIT, Apache-2.0, ISC, BSD-3-Clause and MPL-2.0. Lightning CSS is the MPL component: it is an unmodified build tool, its source URL is provided, and no compiler binaries or MPL source are included in the browser/Caddy runtime. [Mozilla's file-level compatibility guidance](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) permits combination with separately licensed code; no MPL files were modified.

MIT/ISC/BSD notices and Apache licence/notice obligations are retained. OFL licences accompany font assets; fonts are bundled with the application, not sold separately. The project source remains MIT.

`npm audit --json` was executed and its output is recorded in [npm-audit.json](npm-audit.json). Advisory results are a point-in-time package audit, not a guarantee against undisclosed vulnerabilities or font/browser defects.

All production resources are same-origin, bundled or copied to `dist`. A content-derived service-worker cache covers only known static paths. Blob/data images and working documents are not cached as application assets. Docker builds with Node and serves the result with Caddy; the final image has no Node backend. Browser tests cover current Chromium/Firefox and offline font/PDF operation. Safari/WebKit and physical printer checks remain deployment validation items.

The final light-theme/session update introduces no additional packages. Per-template history uses native ProseMirror `EditorState` and a repository-owned invertible `Step`; contextual dropdowns and proportional image handles use existing browser/editor APIs. The current audit reports zero advisories. Executed build, browser, PDF and Docker results are recorded in [verification.md](verification.md).

The Thai PDF-wrapping correction also introduces no dependencies. It uses native `Intl.Segmenter` word segmentation (the paginator already requires this API for graphemes) and existing pdfmake text arrays. Segmentation runs locally; no wording, patient values or fonts are sent to a service or modified in storage.
