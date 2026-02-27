// Feature: System Utilities | Trace: README.md
import { INTERCEPTOR_SCRIPT } from './proxy-interceptors';
import { CORE_SCANNER_SCRIPT } from './proxy-core-scanner';

const SCANNER_SCRIPT = `
<script>
(function() {
  ${CORE_SCANNER_SCRIPT}
  ${INTERCEPTOR_SCRIPT}
})();
</script>`;

export function injectScanner(html: string): string {
  if (html.includes('</body>')) {
    return html.replace('</body>', SCANNER_SCRIPT + '</body>');
  }
  return html + SCANNER_SCRIPT;
}
