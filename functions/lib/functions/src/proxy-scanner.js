"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectScanner = injectScanner;
// Feature: System Utilities | Trace: README.md
const proxy_interceptors_1 = require("./proxy-interceptors");
const proxy_core_scanner_1 = require("./proxy-core-scanner");
const SCANNER_SCRIPT = `
<script>
(function() {
  ${proxy_core_scanner_1.CORE_SCANNER_SCRIPT}
  ${proxy_interceptors_1.INTERCEPTOR_SCRIPT}
})();
</script>`;
function injectScanner(html) {
    if (html.includes('</body>')) {
        return html.replace('</body>', SCANNER_SCRIPT + '</body>');
    }
    return html + SCANNER_SCRIPT;
}
//# sourceMappingURL=proxy-scanner.js.map