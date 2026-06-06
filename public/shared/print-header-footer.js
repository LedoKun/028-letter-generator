/* ========================================
   SHARED PRINT HEADER/FOOTER INJECTION
   ======================================== 
   Injects clinic header and footer into
   all print template documents.
   
   Called by all four print templates.
*/

(function () {
    function createHeaderFooter() {
        if (document.querySelector('.page-header-running-container')) return;

        var headerHTML = `
            <div class="page-header-running-container">
                <div class="header-logo-column">
                    <img src="../media/logo/logo.png" alt="Logo" class="header-logo">
                </div>
                <div class="header-text-column thai-font">
                    <div class="clinic-name-main">ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี<br>PUBLIC HEALTH CENTER 28 KRUNG THON BURI</div>
                    <div class="clinic-name-sub">สำนักอนามัย / Health Department<br>กรุงเทพมหานคร / Bangkok Metropolitan Administration</div>
                </div>
            </div>`;

        var footerHTML = `
            <div class="page-footer-running-container thai-font">
                <div>ศูนย์บริการสาธารณสุข 28 กรุงธนบุรี 124/16 ถนนกรุงธนบุรี แขวงบางลำภูล่าง เขตคลองสาน กรุงเทพฯ 10600</div>
                <div class="footer-address-english">Public Health Center 28 Krung Thon Buri 124/16 Krung Thon Buri Road, Khlong San, Bangkok 10600, Thailand</div>
                <div>โทร / Tel: +66 (0) 96 797 1610, +66 (0) 96 323 1696 - อีเมล / Email: 028tbclinic@gmail.com</div>
                <div class="footer-page-number-container">Date format: DD/MM/YYYY &middot; พิมพ์เมื่อ / Printed on: <span class="printed-on-datetime"></span> &middot; <span class="page-info-label">หน้า / Page:</span> <span class="page-number-display"></span></div>
            </div>`;

        // Find or create header element
        var header = document.querySelector('.page-header-running-container');
        if (!header) {
            header = document.createElement('div');
            header.innerHTML = headerHTML;
            document.body.insertBefore(header, document.body.firstChild);
        }

        // Find or create footer element
        var footer = document.querySelector('.page-footer-running-container');
        if (!footer) {
            footer = document.createElement('div');
            footer.innerHTML = footerHTML;
            document.body.appendChild(footer);
        }

        // Update printed date/time
        updatePrintedOn();
    }

    function updatePrintedOn() {
        var el = document.querySelector('.printed-on-datetime');
        if (el) {
            var d = new Date();
            var z = function (n) { return (n < 10 ? '0' : '') + n; };
            el.textContent = z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createHeaderFooter);
    } else {
        createHeaderFooter();
    }

    if (window.onbeforeprint !== undefined) {
        window.onbeforeprint = updatePrintedOn;
    }
})();
