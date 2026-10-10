# Pagination proof and selected implementation

The initial vanilla Tiptap 3 proof used the MIT-declared `tiptap-pagination-plus` 3.1.0 with inline field nodes, a clinical-section wrapper and a paragraph containing 400 repetitions of mixed Thai/English text. The initial result reported six pages and a document height of 9,880 px, while its last footer ended around 7,123 px. A font/layout refresh transaction changed its page count. This was unsuitable as the sole pagination mechanism; the package was removed.

`@adalat-ai/page-extension` was inspected rather than installed: its peer requirements bring React and Tiptap 2 into a vanilla Tiptap 3 application.

The production implementation measures grapheme line rectangles in ProseMirror, reserves the A4 top/bottom margins and gaps through layout-only decorations, and refines after layout. Page rectangles, official content and working text are distinct. Overflow creates pages; deletion removes excess pages. Manual breaks, pictures and the first line of list items have explicit handling. Selection/document positions are unchanged by pagination and layout transactions are excluded from history. Font and picture loading also trigger measurement.

Browser tests exercise long Thai/English text, field navigation across pages, reverse reflow, list markers and image blocks. The authoritative printed layout remains pdfmake PDF; preview is required for final clinical review.
