(function () {
    const PDFMAKE_VERSION = '0.3.9';
    const AUTHOR = 'Public Health Center 28 Krung Thon Buri';
    const THAI_FONT = 'NotoSansThai';
    const EN_FONT = 'NotoSans';
    const LOGO_URL = '/media/logo/logo.png';
    const MM = 72 / 25.4;

    let logoDataUrlPromise = null;
    let fontsRegistered = false;

    function mm(value) {
        return value * MM;
    }

    function pad2(value) {
        return String(value).padStart(2, '0');
    }

    function formatDate(date) {
        return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
    }

    function formatIsoDateTime(date) {
        return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
    }

    function sanitizeFilenamePart(value, fallback) {
        const sanitized = String(value || '')
            .trim()
            .replace(/[\\/:*?"<>|]+/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        return sanitized || fallback;
    }

    function toAbsoluteUrl(path) {
        return new URL(path, window.location.origin).href;
    }

    function isThaiText(value) {
        return /[\u0E00-\u0E7F]/.test(value);
    }

    function inlineOptions(options) {
        const keys = ['bold', 'italics', 'decoration', 'decorationStyle', 'decorationColor', 'color', 'background'];
        return keys.reduce((acc, key) => {
            if (Object.prototype.hasOwnProperty.call(options, key)) acc[key] = options[key];
            return acc;
        }, {});
    }

    function splitTextRuns(value, options = {}) {
        const raw = String(value || '');
        if (!raw) return [{ text: '', font: THAI_FONT }];
        const inline = inlineOptions(options);
        return raw.match(/[\u0E00-\u0E7F]+|[^\u0E00-\u0E7F]+/g).map(part => Object.assign({
            text: part,
            font: isThaiText(part) ? THAI_FONT : EN_FONT
        }, inline));
    }

    function normalizeTextParts(parts) {
        if (Array.isArray(parts)) return parts.flatMap(normalizeTextParts);
        if (typeof parts === 'string' || typeof parts === 'number') return splitTextRuns(parts);
        if (parts && typeof parts === 'object' && typeof parts.text === 'string') {
            return [Object.assign({}, parts, { text: splitTextRuns(parts.text, parts) })];
        }
        return [parts];
    }

    function registerFonts() {
        if (fontsRegistered) return;
        if (!window.pdfMake || typeof window.pdfMake.addFonts !== 'function') {
            throw new Error('pdfmake is not loaded.');
        }
        if (typeof window.pdfMake.setUrlAccessPolicy === 'function') {
            window.pdfMake.setUrlAccessPolicy((url) => new URL(url).origin === window.location.origin);
        }
        window.pdfMake.addFonts({
            [THAI_FONT]: {
                normal: toAbsoluteUrl('/vendor/fonts/NotoSansThai-Regular.ttf'),
                bold: toAbsoluteUrl('/vendor/fonts/NotoSansThai-Bold.ttf'),
                italics: toAbsoluteUrl('/vendor/fonts/NotoSansThai-Regular.ttf'),
                bolditalics: toAbsoluteUrl('/vendor/fonts/NotoSansThai-Bold.ttf')
            },
            [EN_FONT]: {
                normal: toAbsoluteUrl('/vendor/fonts/NotoSans-Regular.ttf'),
                bold: toAbsoluteUrl('/vendor/fonts/NotoSans-Bold.ttf'),
                italics: toAbsoluteUrl('/vendor/fonts/NotoSans-Regular.ttf'),
                bolditalics: toAbsoluteUrl('/vendor/fonts/NotoSans-Bold.ttf')
            }
        });
        fontsRegistered = true;
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function fetchDataUrl(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
        return blobToDataUrl(await response.blob());
    }

    function getLogoDataUrl() {
        if (!logoDataUrlPromise) logoDataUrlPromise = fetchDataUrl(LOGO_URL);
        return logoDataUrlPromise;
    }

    function text(value, options = {}) {
        return Object.assign({ text: splitTextRuns(value, options) }, options);
    }

    function bold(value, options = {}) {
        return text(value, Object.assign({ bold: true }, options));
    }

    function highlight(value, options = {}) {
        return text(String(value || '').trim(), Object.assign({
            bold: true,
            decoration: 'underline',
            decorationStyle: 'dotted'
        }, options));
    }

    function line(parts, options = {}) {
        return Object.assign({ text: normalizeTextParts(parts), margin: [0, 0, 0, 0.75] }, options);
    }

    function para(parts, options = {}) {
        if (Array.isArray(parts)) return line(parts, options);
        if (parts && typeof parts === 'object') return line([parts], options);
        return line([String(parts || '')], options);
    }

    function title(value, fontSize = 15) {
        return {
            text: splitTextRuns(value, { bold: true }),
            alignment: 'center',
            bold: true,
            fontSize,
            margin: [0, 0, 0, 1.5]
        };
    }

    function sectionTitle(value) {
        return {
            text: splitTextRuns(value, { bold: true }),
            bold: true,
            fontSize: 9,
            margin: [0, 4, 0, 1]
        };
    }

    function convertBEtoCE(beDate) {
        if (!beDate || typeof beDate !== 'string' || !beDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) return '';
        const parts = beDate.split('/');
        const year = parseInt(parts[2], 10);
        return Number.isNaN(year) ? '' : `${parts[0]}/${parts[1]}/${year - 543}`;
    }

    function convertCEtoBE(ceDate) {
        if (!ceDate || typeof ceDate !== 'string' || !ceDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) return '';
        const parts = ceDate.split('/');
        const year = parseInt(parts[2], 10);
        return Number.isNaN(year) ? '' : `${parts[0]}/${parts[1]}/${year + 543}`;
    }

    function convertPartialBEtoCE(value) {
        if (!value || typeof value !== 'string') return '';
        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) return convertBEtoCE(value);
        const match = value.match(/^(\d{2})\/(\d{4})$/);
        if (!match) return '';
        const year = parseInt(match[2], 10);
        return Number.isNaN(year) ? '' : `${match[1]}/${year - 543}`;
    }

    function highlightedDatePair(beDate) {
        const ceDate = convertBEtoCE(beDate);
        return ceDate ? [highlight(beDate), ' (', highlight(ceDate), ')'] : [highlight(beDate)];
    }

    function partialDatePair(beDate) {
        const ceDate = convertPartialBEtoCE(beDate);
        return ceDate ? [highlight(beDate), ' (', highlight(ceDate), ')'] : [highlight(beDate)];
    }

    function listItem(parts, nested = []) {
        if (!nested.length) {
            if (Array.isArray(parts)) return { text: normalizeTextParts(parts) };
            if (typeof parts === 'string' || typeof parts === 'number') return { text: normalizeTextParts(parts) };
            if (parts && typeof parts === 'object') return parts;
            return { text: normalizeTextParts(String(parts || '')) };
        }
        return {
            stack: [
                Array.isArray(parts) ? { text: normalizeTextParts(parts) } : (parts && typeof parts === 'object' ? parts : { text: normalizeTextParts(String(parts || '')) }),
                { ul: nested, margin: [8, 0, 0, 0] }
            ]
        };
    }

    function makeHeader(logoDataUrl) {
        return function () {
            return {
                margin: [mm(13), mm(7), mm(13), 0],
                table: {
                    widths: [223, '*'],
                    body: [[
                        { image: logoDataUrl, width: 223, margin: [0, 2, 4, 2] },
                        {
                            text: [
                                ...splitTextRuns('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี\nPublic Health Center 28 - Krung Thon Buri\n', { bold: true, fontSize: 12.5 }),
                                ...splitTextRuns('สำนักอนามัย / Health Department\nกรุงเทพมหานคร / Bangkok Metropolitan Administration', { fontSize: 8.5 })
                            ],
                            alignment: 'right',
                            fontSize: 8.5,
                            lineHeight: 0.95,
                            margin: [0, 7, 0, 2]
                        }
                    ]]
                },
                layout: {
                    hLineWidth: (i, node) => i === node.table.body.length ? 0.5 : 0,
                    vLineWidth: () => 0,
                    hLineColor: () => '#777',
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 0,
                    paddingBottom: () => 3
                }
            };
        };
    }

    function makeFooter(printedDate) {
        return function (currentPage, pageCount) {
            return {
                margin: [mm(13), 0, mm(13), mm(7)],
                table: {
                    widths: ['*'],
                    body: [[{
                        stack: [
                            bold(`เอกสารฉบับนี้จะสมบูรณ์เมื่อมีตราประทับเท่านั้น / Valid only with an official stamp.\nพิมพ์เมื่อ / Printed on: ${printedDate} (DD/MM/YYYY) · หน้า / Page: ${currentPage} of ${pageCount}`, { margin: [0, 2, 0, 3] }),
                            text('ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี 124/16 ถนนกรุงธนบุรี แขวงบางลำภูล่าง เขตคลองสาน กรุงเทพฯ 10600', { margin: [0, 0, 0, 1] }),
                            text('Public Health Center 28 Krung Thon Buri 124/16 Krung Thon Buri Road, Khlong San, Bangkok 10600, Thailand', { margin: [0, 0, 0, 1] }),
                            text('โทร / Tel: +66 (0) 96 797 1610, +66 (0) 96 323 1696 - อีเมล / Email: 028tbclinic@gmail.com', { margin: [0, 0, 0, 1] })
                        ],
                        fontSize: 7,
                        lineHeight: 1
                    }]]
                },
                layout: {
                    hLineWidth: i => i === 0 ? 0.5 : 0,
                    vLineWidth: () => 0,
                    hLineColor: () => '#777',
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 2,
                    paddingBottom: () => 0
                }
            };
        };
    }

    function buildDocDefinition({ type, content, logoDataUrl, generatedAt }) {
        return {
            pageSize: 'A4',
            pageMargins: [mm(15), mm(34), mm(15), mm(30)],
            header: makeHeader(logoDataUrl),
            footer: makeFooter(formatDate(generatedAt)),
            info: {
                title: type,
                author: AUTHOR,
                subject: `${type} generated by ${AUTHOR}`,
                creator: AUTHOR,
                producer: `${AUTHOR} using pdfmake ${PDFMAKE_VERSION}`,
                creationDate: generatedAt,
                modDate: generatedAt
            },
            defaultStyle: {
                font: THAI_FONT,
                fontSize: 8.5,
                lineHeight: 1.05
            },
            styles: {
                english: { font: EN_FONT },
                small: { fontSize: 7.5 }
            },
            content
        };
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    async function generateAndPrint({ type, patientName, content }) {
        registerFonts();
        const generatedAt = new Date();
        const logoDataUrl = await getLogoDataUrl();
        const filename = `${formatIsoDateTime(generatedAt)}-${sanitizeFilenamePart(type, 'Document')}-${sanitizeFilenamePart(patientName, 'Patient')}.pdf`;
        const docDefinition = buildDocDefinition({ type, content, logoDataUrl, generatedAt });
        const pdf = window.pdfMake.createPdf(docDefinition);
        const blob = await pdf.getBlob();
        downloadBlob(blob, filename);
        setTimeout(() => {
            try {
                pdf.print();
            } catch (error) {
                console.warn('Unable to trigger PDF print dialog:', error);
            }
        }, 250);
    }

    window.PdfGenerator = {
        generateAndPrint,
        helpers: {
            bold,
            convertBEtoCE,
            convertCEtoBE,
            convertPartialBEtoCE,
            highlight,
            highlightedDatePair,
            line,
            listItem,
            para,
            partialDatePair,
            sectionTitle,
            text,
            title
        }
    };
})();
